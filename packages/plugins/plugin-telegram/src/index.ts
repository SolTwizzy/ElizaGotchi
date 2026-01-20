// Client
export { TelegramClient } from './client';
export type {
  TelegramConfig,
  TelegramMessage,
  SendMessageOptions,
  KeyboardButton,
  InlineButton,
  MessageHandler,
  CallbackHandler,
  CommandHandler,
} from './client';

// Actions
export { createMessagingAction } from './actions/messaging';
export type { MessagingAction, SendTextInput } from './actions/messaging';

export { createModerationAction } from './actions/moderation';
export type { ModerationAction, ModerationResult } from './actions/moderation';

// Plugin factory
export function createTelegramPlugin(config: { token: string }) {
  const { TelegramClient } = require('./client');
  const client = new TelegramClient({ token: config.token });

  const { createMessagingAction } = require('./actions/messaging');
  const { createModerationAction } = require('./actions/moderation');

  return {
    name: '@elizagotchi/plugin-telegram',
    version: '0.1.0',
    description: 'Telegram bot integration plugin',

    client,

    providers: [],

    actions: {
      messaging: createMessagingAction(client),
      moderation: createModerationAction(client),
    },

    async connect(): Promise<void> {
      await client.connect();
    },

    async disconnect(): Promise<void> {
      await client.disconnect();
    },

    // Register a command handler
    registerCommand: client.registerCommand.bind(client),

    // Register message handler
    onMessage: client.onMessage.bind(client),

    // Register callback handler (for inline buttons)
    onCallback: client.onCallback.bind(client),

    // Set bot commands (shown in Telegram menu)
    async setCommands(commands: Array<{ command: string; description: string }>): Promise<void> {
      await client.setCommands(commands);
    },

    // Get bot info
    getBotInfo: client.getBotInfo.bind(client),
  };
}

export type TelegramPlugin = ReturnType<typeof createTelegramPlugin>;

export default createTelegramPlugin;
