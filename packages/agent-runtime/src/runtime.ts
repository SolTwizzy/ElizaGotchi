import type { AgentType } from '@elizagotchi/shared';
import type { CharacterTemplate } from '@elizagotchi/agent-templates';
import {
  loadCharacterTemplate,
  mergeCustomizations,
  buildSystemPrompt,
  type LoadedCharacter,
} from './character-loader';
import { loadPlugins, type LoadedPlugin, type PluginConfig } from './plugin-loader';
import { ModelRouter, type ChatMessage, type CompletionResponse, type ToolDefinition, type ToolCall } from './model-router';
import { getToolDefinitions, getToolHandler, type ToolHandler } from './tool-registry';

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
  private tools: ToolDefinition[] = [];
  private maxToolIterations = 5; // Prevent infinite tool loops

  constructor(config: AgentRuntimeConfig) {
    this.config = config;
    this.modelRouter = new ModelRouter();

    // Load and merge character
    const baseTemplate = loadCharacterTemplate(config.agentType);
    this.character = mergeCustomizations(baseTemplate, config.customization);
    this.systemPrompt = buildSystemPrompt(this.character);

    // Load tools for this agent type
    this.tools = getToolDefinitions(config.agentType);
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

    // Tool call loop
    let iteration = 0;
    let response: CompletionResponse;

    while (iteration < this.maxToolIterations) {
      iteration++;

      // Get completion with tools
      response = await this.modelRouter.complete({
        messages,
        tier: 'default',
        tools: this.tools.length > 0 ? this.tools : undefined,
      });

      // If no tool calls, we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        break;
      }

      // Execute tool calls
      for (const toolCall of response.toolCalls) {
        const toolResult = await this.executeToolCall(toolCall);

        // Add assistant message with tool call (for context)
        messages.push({
          role: 'assistant',
          content: response.content || `Calling ${toolCall.function.name}...`,
        });

        // Add tool result message
        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id,
        });
      }
    }

    // Add assistant message
    const assistantMessage: AgentMessage = {
      role: 'assistant',
      content: response!.content,
      timestamp: new Date(),
      metadata: {
        model: response!.model,
        usage: response!.usage,
        toolsUsed: response!.toolCalls?.map(tc => tc.function.name),
      },
    };
    history.push(assistantMessage);

    // Update history
    this.conversationHistory.set(conversationKey, history.slice(-50));

    // Notify
    this.config.onMessage?.(assistantMessage);

    return assistantMessage;
  }

  private async executeToolCall(toolCall: ToolCall): Promise<unknown> {
    const handler = getToolHandler(toolCall.function.name);
    if (!handler) {
      return { error: `Unknown tool: ${toolCall.function.name}` };
    }

    try {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await this.executeToolWithHandler(handler, args);
      return result;
    } catch (error) {
      console.error(`Tool execution error for ${toolCall.function.name}:`, error);
      return { error: `Tool execution failed: ${(error as Error).message}` };
    }
  }

  private async executeToolWithHandler(handler: ToolHandler, args: Record<string, unknown>): Promise<unknown> {
    const plugin = this.plugins.get(handler.pluginName);
    if (!plugin) {
      throw new Error(`Plugin not loaded: ${handler.pluginName}`);
    }

    // Get the provider
    const providers = plugin.providers;
    let provider: Record<string, unknown> | undefined;

    if (Array.isArray(providers)) {
      provider = providers.find((p) => p.name === handler.providerName) as Record<string, unknown>;
    } else {
      provider = (providers as Record<string, unknown>)[handler.providerName] as Record<string, unknown>;
    }

    if (!provider) {
      throw new Error(`Provider not found: ${handler.providerName}`);
    }

    // Get the method
    const method = provider[handler.method];
    if (typeof method !== 'function') {
      throw new Error(`Method not found: ${handler.method}`);
    }

    // Call with appropriate arguments based on the tool
    switch (handler.method) {
      case 'getRecentWhaleActivity':
        // Args: tokenAddress, minValueUsd, chain, limit
        return method(
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH as default
          args.min_value_usd ?? 100000,
          args.chain ?? 'ethereum',
          args.limit ?? 10
        );
      case 'getKnownWhalesByChain':
        return method(args.chain ?? 'ethereum');
      case 'getCurrentGasPrices':
        return method(args.chain ?? 'ethereum');
      case 'getOptimalTransactionTime':
        return method(args.chain ?? 'ethereum');
      case 'getEVMWalletBalance':
        return method(args.address, args.chain ?? 'ethereum');
      case 'checkAirdropEligibility':
        return method(args.address, args.protocol);
      case 'getUpcomingAirdrops':
        return method(args.status ?? 'all');
      case 'getContractInfo':
        return method(args.address, args.chain ?? 'ethereum');
      default:
        // Generic call with args spread
        return method(...Object.values(args));
    }
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
