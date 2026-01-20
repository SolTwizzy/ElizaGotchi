// Legacy Runtime (custom implementation)
export { AgentRuntime } from './runtime';
export type {
  AgentRuntimeConfig,
  AgentMessage,
  ConversationContext,
  AgentState,
} from './runtime';

// ElizaOS Runtime (official framework)
export { ElizaRuntime, createElizaRuntime } from './eliza-runtime';
export type { ElizaRuntimeConfig, ElizaMessage, ElizaRuntimeState } from './eliza-runtime';

// Re-export useful ElizaOS types
export type {
  Character as ElizaCharacter,
  Plugin as ElizaPlugin,
  Action as ElizaAction,
  Provider as ElizaProvider,
  IAgentRuntime,
} from '@elizaos/core';

// Character Loader
export {
  loadCharacterTemplate,
  mergeCustomizations,
  buildSystemPrompt,
  formatExampleConversation,
} from './character-loader';
export type { LoadedCharacter } from './character-loader';

// Plugin Loader
export {
  loadPlugin,
  loadPlugins,
  getProviderFromPlugin,
  getActionFromPlugin,
} from './plugin-loader';
export type {
  PluginProvider,
  PluginAction,
  LoadedPlugin,
  PluginConfig,
} from './plugin-loader';

// Model Router
export {
  ModelRouter,
  modelRouter,
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
} from './model-router';
export type {
  ModelProvider,
  ModelTier,
  ModelConfig,
  ChatMessage,
  CompletionRequest,
  CompletionResponse,
} from './model-router';

// Alert Handler
export { AlertHandler, createAlertHandler } from './alert-handler';
export type { AgentAlert, AlertHandlerConfig } from './alert-handler';
