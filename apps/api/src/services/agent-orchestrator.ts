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
}

class AgentOrchestrator {
  private runningAgents: Map<string, RunningAgent> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeatMonitor();
  }

  private startHeartbeatMonitor() {
    // Check agent health every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.checkAgentHealth();
    }, 30000);
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
          modelProvider: template.modelProvider as 'openai' | 'anthropic',
          apiKeys: {
            openai: process.env.OPENAI_API_KEY,
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

      // Store running agent
      this.runningAgents.set(agentId, {
        runtime,
        startedAt: new Date(),
        lastHeartbeat: new Date(),
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

  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Stop all running agents
    for (const [agentId, agent] of this.runningAgents) {
      try {
        await agent.runtime.stop();
        await this.updateAgentStatus(agentId, 'stopped');
      } catch (error) {
        console.error(`Error stopping agent ${agentId}:`, error);
      }
    }

    this.runningAgents.clear();
  }
}

export const agentOrchestrator = new AgentOrchestrator();
