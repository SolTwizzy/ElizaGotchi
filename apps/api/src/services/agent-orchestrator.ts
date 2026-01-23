import { eq, and } from 'drizzle-orm';
import { db, agents, agentLogs, agentConnections, connections } from '@elizagotchi/database';
import {
  AgentRuntime,
  ElizaRuntime,
  createElizaRuntime,
} from '@elizagotchi/agent-runtime';
import { getTemplate } from '@elizagotchi/agent-templates';
import { redis, setCache, getCache, deleteCache } from '../lib/redis';
import type { AgentStatus, AgentType } from '@elizagotchi/shared';

// Use ElizaOS runtime by default (our tables renamed to platform_agents to avoid conflict)
// Set USE_ELIZAOS=false to use legacy runtime
const USE_ELIZAOS = process.env.USE_ELIZAOS !== 'false';

interface RunningAgent {
  runtime: AgentRuntime | ElizaRuntime;
  startedAt: Date;
  lastHeartbeat: Date;
  heartbeatIntervalId?: ReturnType<typeof setInterval>;
}

interface RetryInfo {
  count: number;
  lastAttempt: Date;
  nextAttemptAfter: Date;
}

const MAX_AUTO_RESTART_RETRIES = 3;
const RETRY_BACKOFF_MS = [10000, 30000, 60000]; // 10s, 30s, 60s

class AgentOrchestrator {
  private runningAgents: Map<string, RunningAgent> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private errorRestartInterval: ReturnType<typeof setInterval> | null = null;
  private recoveryInProgress: Set<string> = new Set();
  private retryAttempts: Map<string, RetryInfo> = new Map();

  constructor() {
    this.startHeartbeatMonitor();
    this.startErrorRestartMonitor();
  }

  /**
   * Recover agents that were running before server restart.
   * This should be called during server initialization.
   */
  async recoverRunningAgents(): Promise<void> {
    console.log('[AgentOrchestrator] Checking for agents to recover...');

    try {
      // Find all agents with 'running' or 'starting' status that don't have active runtimes
      const agentsToRecover = await db.query.agents.findMany({
        where: (agents, { inArray }) => inArray(agents.status, ['running', 'starting']),
      });

      if (agentsToRecover.length === 0) {
        console.log('[AgentOrchestrator] No agents to recover');
        return;
      }

      console.log(`[AgentOrchestrator] Found ${agentsToRecover.length} agents to recover`);

      // Recover agents one at a time with a delay between each
      // This prevents migration lock contention and service registration timeouts
      const RECOVERY_DELAY_MS = 5000; // 5 seconds between each agent
      let recoveredCount = 0;

      for (const agent of agentsToRecover) {
        if (this.runningAgents.has(agent.id)) {
          // Already running in memory, skip
          continue;
        }

        // Add delay between agents (except for the first one)
        if (recoveredCount > 0) {
          console.log(`[AgentOrchestrator] Waiting ${RECOVERY_DELAY_MS / 1000}s before next agent...`);
          await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY_MS));
        }

        try {
          console.log(`[AgentOrchestrator] Recovering agent ${recoveredCount + 1}/${agentsToRecover.length}: ${agent.id} (${agent.name})`);
          await this.startAgent(agent.id, agent.userId);
          recoveredCount++;
        } catch (error) {
          console.error(`[AgentOrchestrator] Failed to recover agent ${agent.id}:`, error);
          // Mark as error so user knows to manually restart
          await this.updateAgentStatus(agent.id, 'error');
          await this.logAgentEvent(agent.id, 'error', `Failed to auto-recover after restart: ${error}`);
        }
      }

      console.log(`[AgentOrchestrator] Recovery complete (${recoveredCount}/${agentsToRecover.length} agents recovered)`);
    } catch (error) {
      console.error('[AgentOrchestrator] Error during recovery:', error);
    }
  }

  /**
   * Ensure an agent runtime is available, restarting if necessary.
   * This handles cases where the database says 'running' but the runtime was lost (e.g., server restart).
   */
  async ensureAgentRuntime(agentId: string, userId: string): Promise<AgentRuntime | ElizaRuntime | null> {
    // Check if already running
    const existing = this.runningAgents.get(agentId);
    if (existing) {
      return existing.runtime;
    }

    // Prevent concurrent recovery attempts for the same agent
    if (this.recoveryInProgress.has(agentId)) {
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 2000));
      const recovered = this.runningAgents.get(agentId);
      return recovered?.runtime ?? null;
    }

    // Verify agent exists and belongs to user
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      return null;
    }

    // If agent status is 'running' but runtime is missing, auto-restart
    if (agent.status === 'running' || agent.status === 'starting') {
      console.log(`[AgentOrchestrator] Runtime missing for running agent ${agentId}, auto-restarting...`);

      this.recoveryInProgress.add(agentId);
      try {
        // Reset status to allow restart
        await this.updateAgentStatus(agentId, 'stopped');
        await this.startAgent(agentId, userId);

        const recovered = this.runningAgents.get(agentId);
        return recovered?.runtime ?? null;
      } catch (error) {
        console.error(`[AgentOrchestrator] Failed to auto-restart agent ${agentId}:`, error);
        await this.updateAgentStatus(agentId, 'error');
        await this.logAgentEvent(agentId, 'error', `Failed to auto-restart: ${error}`);
        return null;
      } finally {
        this.recoveryInProgress.delete(agentId);
      }
    }

    return null;
  }

  private startHeartbeatMonitor() {
    // Check agent health every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.checkAgentHealth();
    }, 30000);
  }

  /**
   * Monitor for agents in error state and auto-restart them.
   * This ensures agents recover from transient failures automatically.
   */
  private startErrorRestartMonitor() {
    // Check for error agents every 15 seconds
    this.errorRestartInterval = setInterval(() => {
      this.checkAndRestartErrorAgents();
    }, 15000);
  }

  private async checkAndRestartErrorAgents() {
    try {
      // Find all agents in error state
      const errorAgents = await db.query.agents.findMany({
        where: eq(agents.status, 'error'),
      });

      const now = new Date();

      for (const agent of errorAgents) {
        // Skip if recovery is already in progress
        if (this.recoveryInProgress.has(agent.id)) {
          continue;
        }

        // Check retry info
        const retryInfo = this.retryAttempts.get(agent.id);

        if (retryInfo) {
          // Check if we've exceeded max retries
          if (retryInfo.count >= MAX_AUTO_RESTART_RETRIES) {
            // Don't retry anymore - user needs to manually intervene
            continue;
          }

          // Check if enough time has passed since last attempt
          if (now < retryInfo.nextAttemptAfter) {
            continue;
          }
        }

        // Attempt auto-restart
        console.log(`[AgentOrchestrator] Auto-restarting error agent ${agent.id} (${agent.name})`);
        this.recoveryInProgress.add(agent.id);

        try {
          // Reset status to allow restart
          await this.updateAgentStatus(agent.id, 'stopped');
          await this.startAgent(agent.id, agent.userId);

          // Success - clear retry info
          this.retryAttempts.delete(agent.id);
          await this.logAgentEvent(agent.id, 'info', 'Agent auto-recovered from error state');
          console.log(`[AgentOrchestrator] Agent ${agent.id} auto-recovered successfully`);
        } catch (error) {
          // Failed - update retry info
          const currentRetries = retryInfo?.count ?? 0;
          const nextRetryIndex = Math.min(currentRetries, RETRY_BACKOFF_MS.length - 1);
          const backoffMs = RETRY_BACKOFF_MS[nextRetryIndex];

          this.retryAttempts.set(agent.id, {
            count: currentRetries + 1,
            lastAttempt: now,
            nextAttemptAfter: new Date(now.getTime() + backoffMs),
          });

          await this.updateAgentStatus(agent.id, 'error');
          await this.logAgentEvent(
            agent.id,
            'warn',
            `Auto-restart attempt ${currentRetries + 1}/${MAX_AUTO_RESTART_RETRIES} failed: ${error}. Next attempt in ${backoffMs / 1000}s`
          );
          console.log(
            `[AgentOrchestrator] Agent ${agent.id} auto-restart failed (attempt ${currentRetries + 1}/${MAX_AUTO_RESTART_RETRIES})`
          );
        } finally {
          this.recoveryInProgress.delete(agent.id);
        }
      }
    } catch (error) {
      console.error('[AgentOrchestrator] Error in checkAndRestartErrorAgents:', error);
    }
  }

  private async checkAgentHealth() {
    const now = new Date();
    for (const [agentId, agent] of this.runningAgents) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();

      // If no heartbeat for 2 minutes, mark as error
      if (timeSinceHeartbeat > 120000) {
        console.error(`Agent ${agentId} missed heartbeat, marking as error`);
        await this.updateAgentStatus(agentId, 'error');
        await this.logAgentEvent(agentId, 'error', 'Agent missed heartbeat');
        this.runningAgents.delete(agentId);
      }
    }
  }

  async startAgent(agentId: string, userId: string): Promise<void> {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status === 'running') {
      throw new Error('Agent is already running');
    }

    // Update status to starting
    await this.updateAgentStatus(agentId, 'starting');
    await this.logAgentEvent(agentId, 'info', 'Agent starting');

    try {
      // Verify template exists for this agent type
      const template = getTemplate(agent.type);
      if (!template) {
        throw new Error(`Template not found for agent type: ${agent.type}`);
      }

      // Get connected accounts
      const agentConns = await db.query.agentConnections.findMany({
        where: eq(agentConnections.agentId, agentId),
        with: {
          connection: true,
        },
      });

      // Build connection configs
      const connectionConfigs = agentConns.map((ac) => ({
        type: ac.connection.type,
        credentials: {
          accessToken: ac.connection.accessToken ?? '',
          refreshToken: ac.connection.refreshToken ?? '',
        },
        config: ac.connection.metadata ?? {},
      }));

      // Extract customization from agent config
      const agentConfig = (agent.config as Record<string, unknown>) ?? {};
      const customization = {
        name: agentConfig.name as string | undefined,
        personality: agentConfig.personality as string | undefined,
        rules: agentConfig.rules as string[] | undefined,
        tone: agentConfig.tone as 'formal' | 'casual' | 'friendly' | 'professional' | undefined,
      };

      let runtime: AgentRuntime | ElizaRuntime;

      if (USE_ELIZAOS) {
        // Use official ElizaOS runtime
        console.log(`[AgentOrchestrator] Starting agent ${agentId} with ElizaOS runtime`);

        // Extract Telegram config from connections or agent config
        const telegramConn = connectionConfigs.find((c) => c.type === 'telegram');
        const telegramConfig = telegramConn
          ? {
              botToken: process.env.TELEGRAM_BOT_TOKEN,
              chatId: (telegramConn.config as Record<string, string>)?.chatId,
            }
          : undefined;

        // Extract Discord webhook from connections or agent config
        const discordConn = connectionConfigs.find((c) => c.type === 'discord');
        const discordConfig = discordConn
          ? {
              webhookUrl: (discordConn.config as Record<string, string>)?.webhookUrl,
            }
          : undefined;

        // Also check agent config for notification settings
        const notifConfig = agentConfig.notifications as Record<string, unknown> | undefined;
        const telegram = telegramConfig || (notifConfig?.telegram as { chatId?: string } | undefined
          ? { botToken: process.env.TELEGRAM_BOT_TOKEN, chatId: (notifConfig?.telegram as { chatId?: string })?.chatId }
          : undefined);
        const discord = discordConfig || (notifConfig?.discord as { webhookUrl?: string } | undefined
          ? { webhookUrl: (notifConfig?.discord as { webhookUrl?: string })?.webhookUrl }
          : undefined);

        runtime = createElizaRuntime({
          agentId,
          agentType: agent.type as AgentType,
          customization,
          agentConfig,
          databaseUrl: process.env.DATABASE_URL,
          apiKeys: {
            anthropic: process.env.ANTHROPIC_API_KEY,
          },
          telegram,
          discord,
          onMessage: (msg) => {
            console.log(`[Agent ${agentId}] Message:`, msg.content.substring(0, 100));
          },
          onError: (err) => {
            console.error(`[Agent ${agentId}] Error:`, err);
          },
        });
      } else {
        // Use legacy custom runtime
        console.log(`[AgentOrchestrator] Starting agent ${agentId} with legacy runtime`);
        runtime = new AgentRuntime({
          agentType: agent.type as AgentType,
          customization,
          agentConfig,
          plugins: template.plugins.map((p) => ({ name: p })),
          connections: connectionConfigs,
        });
      }

      await runtime.start();

      // Create heartbeat interval to keep agent alive
      const heartbeatIntervalId = setInterval(() => {
        const runningAgent = this.runningAgents.get(agentId);
        if (runningAgent) {
          runningAgent.lastHeartbeat = new Date();
        }
      }, 30000); // Update heartbeat every 30 seconds

      // Store running agent
      this.runningAgents.set(agentId, {
        runtime,
        startedAt: new Date(),
        lastHeartbeat: new Date(),
        heartbeatIntervalId,
      });

      // Update status to running
      await this.updateAgentStatus(agentId, 'running');
      await this.logAgentEvent(agentId, 'info', 'Agent started successfully');

      // Cache running state
      await setCache(`agent:${agentId}:status`, 'running', 3600);

    } catch (error) {
      await this.updateAgentStatus(agentId, 'error');
      await this.logAgentEvent(agentId, 'error', `Failed to start agent: ${error}`);
      throw error;
    }
  }

  async stopAgent(agentId: string, userId: string): Promise<void> {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const runningAgent = this.runningAgents.get(agentId);
    if (runningAgent) {
      // Clear heartbeat interval
      if (runningAgent.heartbeatIntervalId) {
        clearInterval(runningAgent.heartbeatIntervalId);
      }
      await runningAgent.runtime.stop();
      this.runningAgents.delete(agentId);
    }

    await this.updateAgentStatus(agentId, 'stopped');
    await this.logAgentEvent(agentId, 'info', 'Agent stopped');
    await deleteCache(`agent:${agentId}:status`);
  }

  async pauseAgent(agentId: string, userId: string): Promise<void> {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'running') {
      throw new Error('Agent is not running');
    }

    const runningAgent = this.runningAgents.get(agentId);
    if (runningAgent) {
      await runningAgent.runtime.pause();
    }

    await this.updateAgentStatus(agentId, 'paused');
    await this.logAgentEvent(agentId, 'info', 'Agent paused');
  }

  async resumeAgent(agentId: string, userId: string): Promise<void> {
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'paused') {
      throw new Error('Agent is not paused');
    }

    const runningAgent = this.runningAgents.get(agentId);
    if (runningAgent) {
      await runningAgent.runtime.resume();
    }

    await this.updateAgentStatus(agentId, 'running');
    await this.logAgentEvent(agentId, 'info', 'Agent resumed');
  }

  async restartAgent(agentId: string, userId: string): Promise<void> {
    // Clear any retry tracking since this is a manual restart
    this.retryAttempts.delete(agentId);
    await this.stopAgent(agentId, userId);
    await this.startAgent(agentId, userId);
  }

  async getAgentStatus(agentId: string): Promise<AgentStatus | null> {
    // Check cache first
    const cached = await getCache<AgentStatus>(`agent:${agentId}:status`);
    if (cached) return cached;

    // Check database
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
      columns: { status: true },
    });

    return agent?.status ?? null;
  }

  async getAgentLogs(
    agentId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    // Verify ownership
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    return db.query.agentLogs.findMany({
      where: eq(agentLogs.agentId, agentId),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit,
      offset,
    });
  }

  async updateHeartbeat(agentId: string): Promise<void> {
    const runningAgent = this.runningAgents.get(agentId);
    if (runningAgent) {
      runningAgent.lastHeartbeat = new Date();
    }
  }

  private async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    await db
      .update(agents)
      .set({ status, updatedAt: new Date() })
      .where(eq(agents.id, agentId));
  }

  private async logAgentEvent(
    agentId: string,
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await db.insert(agentLogs).values({
      agentId,
      level,
      message,
      metadata: metadata ?? {},
    });
  }

  async getRunningAgentCount(): Promise<number> {
    return this.runningAgents.size;
  }

  /**
   * Get a running agent's runtime for chat functionality
   */
  getRunningAgentRuntime(agentId: string): AgentRuntime | ElizaRuntime | null {
    const runningAgent = this.runningAgents.get(agentId);
    return runningAgent?.runtime ?? null;
  }

  /**
   * Check if an agent is currently running in memory
   */
  isAgentRunning(agentId: string): boolean {
    return this.runningAgents.has(agentId);
  }

  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.errorRestartInterval) {
      clearInterval(this.errorRestartInterval);
    }

    // Stop all running agents
    for (const [agentId, agent] of this.runningAgents) {
      try {
        // Clear heartbeat interval
        if (agent.heartbeatIntervalId) {
          clearInterval(agent.heartbeatIntervalId);
        }
        await agent.runtime.stop();
        await this.updateAgentStatus(agentId, 'stopped');
      } catch (error) {
        console.error(`Error stopping agent ${agentId}:`, error);
      }
    }

    this.runningAgents.clear();
    this.retryAttempts.clear();
  }
}

export const agentOrchestrator = new AgentOrchestrator();
