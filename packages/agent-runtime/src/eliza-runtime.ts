/**
 * ElizaOS Runtime Wrapper
 *
 * This module wraps the official ElizaOS AgentRuntime to provide
 * integration with the ElizaGotchi platform.
 */

import {
  AgentRuntime as ElizaAgentRuntime,
  type Character,
  type Plugin,
  type UUID,
  type Memory,
  type Content,
  type IAgentRuntime,
} from '@elizaos/core';
import { v5 as uuidv5 } from 'uuid';
import type { AgentType } from '@elizagotchi/shared';
import type { CharacterTemplate } from '@elizagotchi/agent-templates';
import { loadCharacterTemplate } from './character-loader';

// Deterministic UUID namespace for room IDs - must match chat-history.ts
const ROOM_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generate a deterministic UUID for a room based on agentId and userId.
 * This ensures the same room is always used for the same agent-user pair.
 */
function generateRoomId(agentId: string, userId: string): UUID {
  return uuidv5(`${agentId}-${userId}`, ROOM_NAMESPACE) as UUID;
}

export interface ElizaRuntimeConfig {
  agentId: string;
  agentType: AgentType;
  customization?: {
    name?: string;
    personality?: string;
    rules?: string[];
    tone?: 'formal' | 'casual' | 'friendly' | 'professional';
  };
  agentConfig: Record<string, unknown>;
  databaseUrl?: string;
  apiKeys?: {
    anthropic?: string;
  };
  // Platform integrations
  telegram?: {
    botToken?: string;
    chatId?: string;
  };
  discord?: {
    webhookUrl?: string;
  };
  onMessage?: (message: ElizaMessage) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface ElizaMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type ElizaRuntimeState = 'idle' | 'initializing' | 'running' | 'paused' | 'stopped' | 'error';

/**
 * Convert our character template to ElizaOS Character format
 */
function convertToElizaCharacter(
  template: CharacterTemplate,
  config: ElizaRuntimeConfig
): Character {
  const { customization, telegram, discord } = config;
  const name = customization?.name || template.name;

  // Build bio from template bio array
  const bio = Array.isArray(template.bio) ? template.bio.join('\n') : template.bio;

  // Build system prompt from customization
  let system = `You are ${name}. ${template.description || ''}`;
  if (customization?.personality) {
    system += `\n\nPersonality: ${customization.personality}`;
  }
  if (customization?.rules?.length) {
    system += `\n\nRules:\n${customization.rules.map((r) => `- ${r}`).join('\n')}`;
  }
  if (customization?.tone) {
    system += `\n\nTone: ${customization.tone}`;
  }

  // Convert message examples to ElizaOS format
  const messageExamples = template.messageExamples?.map((conversation) =>
    conversation.map((msg) => ({
      name: msg.user === 'assistant' ? name : 'User',
      content: {
        text: typeof msg.content === 'string' ? msg.content : msg.content.text || '',
      },
    }))
  );

  // Get model configuration from agentConfig (user selection) or template default
  const agentConfig = config.agentConfig || {};
  const selectedModel = (agentConfig.model as string) || template.settings?.model || 'claude-3-5-haiku-20241022';
  const customApiKey = agentConfig.customApiKey as string | undefined;

  // Map our model names to ElizaOS model names (Anthropic only)
  const modelMapping: Record<string, string> = {
    'claude-3-haiku': 'claude-3-5-haiku-20241022',
    'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-sonnet-4': 'claude-sonnet-4-20250514',
    'claude-3-opus': 'claude-3-opus-20240229',
  };

  const elizaModel = modelMapping[selectedModel] || selectedModel;

  // Determine which plugins to use
  const plugins: string[] = [];

  // Always use Anthropic as the model provider
  plugins.push('@elizaos/plugin-anthropic');

  // Bootstrap plugin is optional - skip if SKIP_BOOTSTRAP_PLUGIN is set
  // This avoids the 30s service registration timeout on resource-constrained deployments
  if (process.env.SKIP_BOOTSTRAP_PLUGIN !== 'true') {
    plugins.push('@elizaos/plugin-bootstrap');
  }

  // Add SQL adapter for ElizaOS database (separate from our platform_agents table)
  plugins.push('@elizaos/plugin-sql');

  // Add Telegram plugin if configured
  if (telegram?.botToken) {
    plugins.push('@elizaos/plugin-telegram');
  }

  // Build settings including platform configs and model selection
  const settings: Record<string, string | boolean | number | Record<string, unknown>> = {
    ...template.settings,
    model: elizaModel,
  };

  // If user provided a custom API key, store it for Anthropic
  if (customApiKey) {
    settings.ANTHROPIC_API_KEY = customApiKey;
  }

  // Add Telegram settings
  if (telegram?.botToken) {
    settings.TELEGRAM_BOT_TOKEN = telegram.botToken;
    if (telegram.chatId) {
      settings.TELEGRAM_CHAT_ID = telegram.chatId;
    }
  }

  // Add Discord webhook for notifications (not full bot integration due to native deps)
  if (discord?.webhookUrl) {
    settings.DISCORD_WEBHOOK_URL = discord.webhookUrl;
  }

  return {
    id: undefined, // Will be set by runtime
    name,
    username: name.toLowerCase().replace(/\s+/g, '-'),
    system,
    bio,
    messageExamples,
    postExamples: template.postExamples || [],
    topics: template.topics || [],
    adjectives: template.adjectives || [],
    knowledge: template.knowledge?.map((k) => (typeof k === 'string' ? k : k)) || [],
    plugins,
    settings,
    style: template.style || {},
  };
}

/**
 * ElizaOS Runtime wrapper for the ElizaGotchi platform
 */
export class ElizaRuntime {
  private config: ElizaRuntimeConfig;
  private runtime: ElizaAgentRuntime | null = null;
  private state: ElizaRuntimeState = 'idle';
  private character: Character;
  private loadedPlugins: Plugin[] = [];

  constructor(config: ElizaRuntimeConfig) {
    this.config = config;

    // Load and convert character template
    const template = loadCharacterTemplate(config.agentType);
    this.character = convertToElizaCharacter(template, config);
  }

  /**
   * Initialize and start the ElizaOS runtime
   */
  async start(): Promise<void> {
    if (this.state === 'running') return;

    this.state = 'initializing';

    try {
      // Ensure Anthropic API key is available in process.env for plugins that read it directly
      if (this.config.apiKeys?.anthropic && !process.env.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = this.config.apiKeys.anthropic;
      }

      // If SKIP_BOOTSTRAP_PLUGIN is set, also set IGNORE_BOOTSTRAP for ElizaOS core
      if (process.env.SKIP_BOOTSTRAP_PLUGIN === 'true') {
        process.env.IGNORE_BOOTSTRAP = 'true';
      }

      // Increase provider timeout for slow embedding initialization (default is only 1000ms)
      // This helps when local embeddings need time to initialize on cold start
      if (!process.env.PROVIDERS_TOTAL_TIMEOUT_MS) {
        process.env.PROVIDERS_TOTAL_TIMEOUT_MS = '30000'; // 30 seconds
      }

      // Load plugins dynamically
      await this.loadPlugins();

      // Create the ElizaOS AgentRuntime
      this.runtime = new ElizaAgentRuntime({
        agentId: this.config.agentId as UUID,
        character: this.character,
        plugins: this.loadedPlugins,
        settings: {
          // Pass Anthropic API key through settings
          ANTHROPIC_API_KEY:
            this.config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY || '',
          // plugin-sql expects POSTGRES_URL for external database connection
          POSTGRES_URL: this.config.databaseUrl || process.env.DATABASE_URL || '',
        },
      });

      // Initialize the runtime
      await this.runtime.initialize();

      this.state = 'running';
      console.log(`[ElizaRuntime] Agent ${this.config.agentId} started successfully`);
    } catch (error) {
      this.state = 'error';
      console.error(`[ElizaRuntime] Failed to start agent:`, error);
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Load required ElizaOS plugins
   */
  private async loadPlugins(): Promise<void> {
    this.loadedPlugins = [];

    // Map of plugin names to their expected module exports
    const pluginMap: Record<string, string> = {
      '@elizaos/plugin-anthropic': 'anthropicPlugin',
      '@elizaos/plugin-bootstrap': 'bootstrapPlugin',
      '@elizaos/plugin-sql': 'sqlPlugin',
      '@elizaos/plugin-telegram': 'telegramPlugin',
    };

    for (const pluginName of this.character.plugins || []) {
      if (!(pluginName in pluginMap)) {
        console.warn(`[ElizaRuntime] Unknown plugin: ${pluginName}`);
        continue;
      }

      try {
        // Dynamic import with type assertion to avoid strict type checking issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import(/* @vite-ignore */ pluginName);
        const exportName = pluginMap[pluginName];
        const plugin = mod.default || mod[exportName] || mod;

        if (plugin) {
          this.loadedPlugins.push(plugin as Plugin);
          console.log(`[ElizaRuntime] Loaded plugin: ${pluginName}`);
        }
      } catch (error) {
        console.error(`[ElizaRuntime] Failed to load plugin ${pluginName}:`, error);
      }
    }
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    if (this.state === 'stopped') return;

    if (this.runtime) {
      await this.runtime.stop();
    }

    this.state = 'stopped';
    console.log(`[ElizaRuntime] Agent ${this.config.agentId} stopped`);
  }

  /**
   * Pause the runtime
   */
  async pause(): Promise<void> {
    if (this.state !== 'running') return;
    this.state = 'paused';
  }

  /**
   * Resume the runtime
   */
  async resume(): Promise<void> {
    if (this.state !== 'paused') return;
    this.state = 'running';
  }

  /**
   * Get current state
   */
  getState(): ElizaRuntimeState {
    return this.state;
  }

  /**
   * Get the underlying ElizaOS runtime
   */
  getElizaRuntime(): IAgentRuntime | null {
    return this.runtime;
  }

  /**
   * Process a message using ElizaOS
   */
  async processMessage(
    content: string,
    context: {
      userId?: string;
      roomId?: string;
      platform?: string;
    } = {}
  ): Promise<ElizaMessage> {
    if (this.state !== 'running' || !this.runtime) {
      throw new Error(`Agent is not running (state: ${this.state})`);
    }

    try {
      // Create a memory for the incoming message
      // Use deterministic roomId so we can retrieve history later
      const roomId = generateRoomId(this.config.agentId, context.userId || 'anonymous');

      const userMessage: Memory = {
        id: crypto.randomUUID() as UUID,
        agentId: this.config.agentId as UUID,
        entityId: (context.userId || 'user') as UUID,
        roomId: roomId,
        content: {
          text: content,
          source: context.platform || 'api',
        } as Content,
        createdAt: Date.now(),
      };

      // Use the runtime's text generation
      const result = await this.runtime.generateText(content, {
        maxTokens: (this.character.settings?.maxTokens as number) || 1000,
      });

      const responseMessage: ElizaMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        metadata: {
          // GenerateTextResult only has text property
          agentId: this.config.agentId,
        },
      };

      this.config.onMessage?.(responseMessage);
      return responseMessage;
    } catch (error) {
      console.error(`[ElizaRuntime] Error processing message:`, error);
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Execute an action
   */
  async executeAction(actionName: string, ...args: unknown[]): Promise<unknown> {
    if (!this.runtime) {
      throw new Error('Runtime not initialized');
    }

    const action = this.runtime.actions.find((a) => a.name === actionName);
    if (!action) {
      throw new Error(`Action not found: ${actionName}`);
    }

    // Actions need a memory and state context
    // For now, create minimal context
    const memory: Memory = {
      id: crypto.randomUUID() as UUID,
      agentId: this.config.agentId as UUID,
      entityId: 'system' as UUID,
      roomId: 'system' as UUID,
      content: { text: actionName } as Content,
      createdAt: Date.now(),
    };

    const state = await this.runtime.composeState(memory);
    // Action handler callback is optional
    return action.handler(this.runtime, memory, state, undefined as unknown as undefined);
  }

  /**
   * Get character configuration
   */
  getCharacter(): Character {
    return this.character;
  }
}

/**
 * Create an ElizaOS runtime instance
 */
export function createElizaRuntime(config: ElizaRuntimeConfig): ElizaRuntime {
  return new ElizaRuntime(config);
}
