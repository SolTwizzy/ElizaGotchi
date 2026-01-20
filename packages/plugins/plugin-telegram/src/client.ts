import { Bot, Context, InlineKeyboard, Keyboard } from 'grammy';

export interface TelegramConfig {
  token: string;
}

export interface TelegramMessage {
  id: number;
  chatId: number;
  chatType: 'private' | 'group' | 'supergroup' | 'channel';
  text: string;
  from: {
    id: number;
    username?: string;
    firstName: string;
    lastName?: string;
    isBot: boolean;
  };
  replyToMessageId?: number;
  timestamp: Date;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface SendMessageOptions {
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyToMessageId?: number;
  keyboard?: KeyboardButton[][] | InlineButton[][];
  keyboardType?: 'inline' | 'reply' | 'remove';
}

export interface KeyboardButton {
  text: string;
  requestContact?: boolean;
  requestLocation?: boolean;
}

export interface InlineButton {
  text: string;
  callbackData?: string;
  url?: string;
}

export type MessageHandler = (message: TelegramMessage) => void | Promise<void>;
export type CallbackHandler = (query: { id: string; data: string; chatId: number; userId: number }) => void | Promise<void>;
export type CommandHandler = (ctx: { message: TelegramMessage; args: string[] }) => void | Promise<void>;

export class TelegramClient {
  private bot: Bot;
  private config: TelegramConfig;
  private messageHandlers: MessageHandler[] = [];
  private callbackHandlers: CallbackHandler[] = [];
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private connected: boolean = false;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.bot = new Bot(config.token);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle text messages
    this.bot.on('message:text', async (ctx) => {
      const message = this.transformMessage(ctx);

      // Check for command handlers
      if (message.text.startsWith('/')) {
        const [command, ...args] = message.text.slice(1).split(' ');
        const handler = this.commandHandlers.get(command.toLowerCase());
        if (handler) {
          try {
            await handler({ message, args });
          } catch (error) {
            console.error(`Error in command handler /${command}:`, error);
          }
          return;
        }
      }

      // Regular message handlers
      for (const handler of this.messageHandlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      }
    });

    // Handle callback queries (inline button clicks)
    this.bot.on('callback_query:data', async (ctx) => {
      const query = {
        id: ctx.callbackQuery.id,
        data: ctx.callbackQuery.data,
        chatId: ctx.callbackQuery.message?.chat.id ?? 0,
        userId: ctx.callbackQuery.from.id,
      };

      for (const handler of this.callbackHandlers) {
        try {
          await handler(query);
        } catch (error) {
          console.error('Error in callback handler:', error);
        }
      }

      // Acknowledge the callback
      await ctx.answerCallbackQuery().catch(() => {});
    });

    // Error handling
    this.bot.catch((err) => {
      console.error('Telegram bot error:', err);
    });
  }

  private transformMessage(ctx: Context): TelegramMessage {
    const msg = ctx.message!;
    return {
      id: msg.message_id,
      chatId: msg.chat.id,
      chatType: msg.chat.type as TelegramMessage['chatType'],
      text: msg.text ?? '',
      from: {
        id: msg.from!.id,
        username: msg.from!.username,
        firstName: msg.from!.first_name,
        lastName: msg.from!.last_name,
        isBot: msg.from!.is_bot,
      },
      replyToMessageId: msg.reply_to_message?.message_id,
      timestamp: new Date(msg.date * 1000),
      entities: msg.entities?.map((e) => ({
        type: e.type,
        offset: e.offset,
        length: e.length,
      })),
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    await this.bot.start({
      onStart: () => {
        console.log(`Telegram bot started: @${this.bot.botInfo?.username}`);
      },
    });

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await this.bot.stop();
    this.connected = false;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onCallback(handler: CallbackHandler): () => void {
    this.callbackHandlers.push(handler);
    return () => {
      const index = this.callbackHandlers.indexOf(handler);
      if (index > -1) {
        this.callbackHandlers.splice(index, 1);
      }
    };
  }

  registerCommand(command: string, handler: CommandHandler): () => void {
    this.commandHandlers.set(command.toLowerCase(), handler);
    return () => this.commandHandlers.delete(command.toLowerCase());
  }

  async sendMessage(chatId: number, options: SendMessageOptions): Promise<number> {
    let keyboard;

    if (options.keyboard && options.keyboardType) {
      if (options.keyboardType === 'inline') {
        const inline = new InlineKeyboard();
        for (const row of options.keyboard as InlineButton[][]) {
          for (const btn of row) {
            if (btn.url) {
              inline.url(btn.text, btn.url);
            } else if (btn.callbackData) {
              inline.text(btn.text, btn.callbackData);
            }
          }
          inline.row();
        }
        keyboard = inline;
      } else if (options.keyboardType === 'reply') {
        const reply = new Keyboard();
        for (const row of options.keyboard as KeyboardButton[][]) {
          for (const btn of row) {
            if (btn.requestContact) {
              reply.requestContact(btn.text);
            } else if (btn.requestLocation) {
              reply.requestLocation(btn.text);
            } else {
              reply.text(btn.text);
            }
          }
          reply.row();
        }
        keyboard = reply.resized();
      } else if (options.keyboardType === 'remove') {
        keyboard = { remove_keyboard: true as const };
      }
    }

    const sent = await this.bot.api.sendMessage(chatId, options.text, {
      parse_mode: options.parseMode,
      reply_to_message_id: options.replyToMessageId,
      reply_markup: keyboard,
    });

    return sent.message_id;
  }

  async editMessage(chatId: number, messageId: number, text: string, parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'): Promise<void> {
    await this.bot.api.editMessageText(chatId, messageId, text, {
      parse_mode: parseMode,
    });
  }

  async deleteMessage(chatId: number, messageId: number): Promise<void> {
    await this.bot.api.deleteMessage(chatId, messageId);
  }

  async sendPhoto(chatId: number, photo: string, caption?: string): Promise<number> {
    const sent = await this.bot.api.sendPhoto(chatId, photo, { caption });
    return sent.message_id;
  }

  async sendDocument(chatId: number, document: string, caption?: string): Promise<number> {
    const sent = await this.bot.api.sendDocument(chatId, document, { caption });
    return sent.message_id;
  }

  async answerCallbackQuery(queryId: string, text?: string, showAlert?: boolean): Promise<void> {
    await this.bot.api.answerCallbackQuery(queryId, {
      text,
      show_alert: showAlert,
    });
  }

  async getChatMember(chatId: number, userId: number): Promise<{
    status: string;
    isAdmin: boolean;
  }> {
    const member = await this.bot.api.getChatMember(chatId, userId);
    return {
      status: member.status,
      isAdmin: ['creator', 'administrator'].includes(member.status),
    };
  }

  async kickChatMember(chatId: number, userId: number, untilDate?: number): Promise<boolean> {
    try {
      await this.bot.api.banChatMember(chatId, userId, { until_date: untilDate });
      return true;
    } catch {
      return false;
    }
  }

  async unbanChatMember(chatId: number, userId: number): Promise<boolean> {
    try {
      await this.bot.api.unbanChatMember(chatId, userId);
      return true;
    } catch {
      return false;
    }
  }

  async restrictChatMember(
    chatId: number,
    userId: number,
    permissions: { canSendMessages?: boolean; canSendMedia?: boolean },
    untilDate?: number
  ): Promise<boolean> {
    try {
      await this.bot.api.restrictChatMember(chatId, userId, {
        can_send_messages: permissions.canSendMessages,
        can_send_audios: permissions.canSendMedia,
        can_send_documents: permissions.canSendMedia,
        can_send_photos: permissions.canSendMedia,
        can_send_videos: permissions.canSendMedia,
        can_send_video_notes: permissions.canSendMedia,
        can_send_voice_notes: permissions.canSendMedia,
      }, { until_date: untilDate });
      return true;
    } catch {
      return false;
    }
  }

  async setCommands(commands: Array<{ command: string; description: string }>): Promise<void> {
    await this.bot.api.setMyCommands(commands);
  }

  getBotInfo(): { id: number; username: string; firstName: string } | null {
    if (!this.bot.botInfo) return null;
    return {
      id: this.bot.botInfo.id,
      username: this.bot.botInfo.username,
      firstName: this.bot.botInfo.first_name,
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}
