// Client
export { DiscordClient } from './client';
export type {
  DiscordConfig,
  DiscordMessage,
  SendMessageOptions,
  EmbedData,
  ButtonData,
  MessageHandler,
  ButtonHandler,
} from './client';

import type { DiscordMessage } from './client';

// Actions
export { createSendMessageAction } from './actions/send-message';
export type { SendMessageAction, SendMessageInput } from './actions/send-message';

export { createModerationAction } from './actions/moderation';
export type {
  ModerationAction,
  TimeoutInput,
  BanInput,
  KickInput,
  RoleInput,
  ModerationResult,
} from './actions/moderation';

export { createCommandsAction } from './actions/commands';
export type {
  CommandsAction,
  CommandDefinition,
  CommandContext,
  CommandResponse,
  CommandPermission,
  CommandConfig,
} from './actions/commands';

// Plugin factory
export function createDiscordPlugin(config: {
  token: string;
  commandPrefix?: string;
}) {
  const { DiscordClient } = require('./client');
  const client = new DiscordClient({ token: config.token });

  const { createSendMessageAction } = require('./actions/send-message');
  const { createModerationAction } = require('./actions/moderation');
  const { createCommandsAction } = require('./actions/commands');

  const commandsAction = createCommandsAction(client, {
    prefix: config.commandPrefix ?? '!',
    allowBots: false,
    ignoreDMs: false,
  });

  // Register built-in commands
  commandsAction.registerHelpCommand();
  commandsAction.registerPingCommand();

  return {
    name: '@elizagotchi/plugin-discord',
    version: '0.1.0',
    description: 'Discord integration plugin for bot functionality and moderation',

    client,

    providers: [],

    actions: {
      sendMessage: createSendMessageAction(client),
      moderation: createModerationAction(client),
      commands: commandsAction,
    },

    async connect(): Promise<void> {
      await client.connect();

      // Set up command handling
      client.onMessage(async (message: DiscordMessage) => {
        await commandsAction.handleMessage(message);
      });
    },

    async disconnect(): Promise<void> {
      await client.disconnect();
    },

    // Expose command registration for custom commands
    registerCommand: commandsAction.register.bind(commandsAction),
    unregisterCommand: commandsAction.unregister.bind(commandsAction),
    getCommands: commandsAction.getCommands.bind(commandsAction),
  };
}

export type DiscordPlugin = ReturnType<typeof createDiscordPlugin>;

export default createDiscordPlugin;
