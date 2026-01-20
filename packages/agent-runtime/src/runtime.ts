import type { AgentType } from '@elizagotchi/shared';
import type { CharacterTemplate } from '@elizagotchi/agent-templates';
import {
  loadCharacterTemplate,
  mergeCustomizations,
  buildSystemPrompt,
  type LoadedCharacter,
} from './character-loader';
import { loadPlugins, type LoadedPlugin, type PluginConfig } from './plugin-loader';
import { ModelRouter, type ChatMessage, type CompletionResponse } from './model-router';

export interface AgentRuntimeConfig {
  agentType: AgentType;
  customization?: {
    name?: string;
    personality?: string;
    rules?: string[];
    tone?: 'formal' | 'casual' | 'friendly' | 'professional';
  };
  agentConfig: Record<string, unknown>;
  plugins: PluginConfig[];
  connections: Array<{
    type: string;
    credentials: Record<string, string>;
    config?: Record<string, unknown>;
  }>;
  onMessage?: (message: AgentMessage) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  messages: AgentMessage[];
  userId?: string;
  channelId?: string;
  platform?: string;
}

export type AgentState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export class AgentRuntime {
  private config: AgentRuntimeConfig;
  private character: LoadedCharacter;
  private systemPrompt: string;
  private plugins: Map<string, LoadedPlugin> = new Map();
  private modelRouter: ModelRouter;
  private state: AgentState = 'idle';
  private conversationHistory: Map<string, AgentMessage[]> = new Map();

  constructor(config: AgentRuntimeConfig) {
    this.config = config;
    this.modelRouter = new ModelRouter();

    // Load and merge character
    const baseTemplate = loadCharacterTemplate(config.agentType);
    this.character = mergeCustomizations(baseTemplate, config.customization);
    this.systemPrompt = buildSystemPrompt(this.character);
  }

  async start(): Promise<void> {
    if (this.state === 'running') return;

    try {
      // Load plugins
      this.plugins = await loadPlugins(this.config.plugins);

      // Initialize connections
      for (const connection of this.config.connections) {
        await this.initializeConnection(connection);
      }

      this.state = 'running';
    } catch (error) {
      this.state = 'error';
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === 'stopped') return;

    // Cleanup plugins
    for (const [name, plugin] of this.plugins) {
      if ('disconnect' in plugin && typeof plugin.disconnect === 'function') {
        await (plugin as any).disconnect();
      }
    }

    this.state = 'stopped';
  }

  async pause(): Promise<void> {
    if (this.state !== 'running') return;
    this.state = 'paused';
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused') return;
    this.state = 'running';
  }

  getState(): AgentState {
    return this.state;
  }

  async processMessage(
    content: string,
    context: Partial<ConversationContext> = {}
  ): Promise<AgentMessage> {
    if (this.state !== 'running') {
      throw new Error(`Agent is not running (state: ${this.state})`);
    }

    const conversationKey = context.channelId || context.userId || 'default';
    const history = this.conversationHistory.get(conversationKey) || [];

    // Add user message
    const userMessage: AgentMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: { platform: context.platform },
    };
    history.push(userMessage);

    // Build messages for LLM
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...history.slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Get completion
    const response = await this.modelRouter.complete({
      messages,
      tier: 'default',
    });

    // Add assistant message
    const assistantMessage: AgentMessage = {
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: {
        model: response.model,
        usage: response.usage,
      },
    };
    history.push(assistantMessage);

    // Update history
    this.conversationHistory.set(conversationKey, history.slice(-50));

    // Notify
    this.config.onMessage?.(assistantMessage);

    return assistantMessage;
  }

  async executeAction(
    pluginName: string,
    actionName: string,
    ...args: unknown[]
  ): Promise<unknown> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    const actions = plugin.actions;
    const action = Array.isArray(actions)
      ? actions.find((a) => a.name === actionName)
      : (actions as Record<string, unknown>)[actionName] as Record<string, unknown> | undefined;

    if (!action || typeof (action as Record<string, unknown>).execute !== 'function') {
      throw new Error(`Action not found: ${actionName}`);
    }

    return ((action as Record<string, unknown>).execute as Function)(...args);
  }

  async getProviderData(
    pluginName: string,
    providerName: string,
    method: string,
    ...args: unknown[]
  ): Promise<unknown> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    const providers = plugin.providers;
    const provider = Array.isArray(providers)
      ? providers.find((p) => p.name === providerName)
      : (providers as Record<string, unknown>)[providerName] as Record<string, unknown> | undefined;

    if (!provider || typeof (provider as Record<string, unknown>)[method] !== 'function') {
      throw new Error(`Provider method not found: ${providerName}.${method}`);
    }

    return ((provider as Record<string, unknown>)[method] as Function)(...args);
  }

  getCharacter(): LoadedCharacter {
    return this.character;
  }

  getConfig(): AgentRuntimeConfig {
    return this.config;
  }

  private async initializeConnection(connection: {
    type: string;
    credentials: Record<string, string>;
    config?: Record<string, unknown>;
  }): Promise<void> {
    // Connection initialization based on type
    switch (connection.type) {
      case 'discord':
        // Would initialize Discord client
        break;
      case 'telegram':
        // Would initialize Telegram bot
        break;
      case 'twitch':
        const twitchPlugin = this.plugins.get('plugin-twitch');
        if (twitchPlugin && 'connect' in twitchPlugin) {
          await (twitchPlugin as any).connect();
        }
        break;
      case 'github':
        // GitHub uses API, no persistent connection needed
        break;
      case 'wallet-evm':
      case 'wallet-solana':
        // Wallet connections are read-only, no initialization needed
        break;
    }
  }
}
