import { DiscordClient } from '@elizagotchi/plugin-discord';
import { TelegramClient } from '@elizagotchi/plugin-telegram';

/**
 * BotService - Manages shared Discord and Telegram bot instances
 *
 * This service initializes the bots on API startup and provides
 * methods to send notifications to users via their connected accounts.
 */
class BotService {
  private discordClient: DiscordClient | null = null;
  private telegramClient: TelegramClient | null = null;
  private initialized = false;

  /**
   * Initialize both bots if tokens are configured
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const discordToken = process.env.DISCORD_BOT_TOKEN;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

    // Initialize Discord bot
    if (discordToken) {
      try {
        this.discordClient = new DiscordClient({ token: discordToken });
        await this.discordClient.connect();
        console.log('[BotService] Discord bot connected');
      } catch (error) {
        console.error('[BotService] Failed to connect Discord bot:', error);
        this.discordClient = null;
      }
    } else {
      console.warn('[BotService] DISCORD_BOT_TOKEN not set - Discord DMs disabled');
    }

    // Initialize Telegram bot for sending notifications only
    // Command handling is done by telegram-bot.ts via webhook
    if (telegramToken) {
      try {
        this.telegramClient = new TelegramClient({ token: telegramToken });
        // Don't call connect() - we use webhook mode via telegram-bot.ts for commands
        // This client is only used for sending outbound notifications
        console.log('[BotService] Telegram client initialized (notification mode only)');
      } catch (error) {
        console.error('[BotService] Failed to initialize Telegram client:', error);
        this.telegramClient = null;
      }
    } else {
      console.warn('[BotService] TELEGRAM_BOT_TOKEN not set - Telegram notifications disabled');
    }

    this.initialized = true;
  }

  /**
   * Shutdown both bots gracefully
   */
  async shutdown(): Promise<void> {
    if (this.discordClient) {
      await this.discordClient.disconnect();
      this.discordClient = null;
    }
    if (this.telegramClient) {
      await this.telegramClient.disconnect();
      this.telegramClient = null;
    }
    this.initialized = false;
  }

  /**
   * Send a Discord DM to a user
   * @param discordUserId - The user's Discord ID (snowflake)
   * @param message - The message content
   * @param embed - Optional embed data
   */
  async sendDiscordDM(
    discordUserId: string,
    message: string,
    embed?: {
      title: string;
      description: string;
      color: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.discordClient) {
      return { success: false, error: 'Discord bot not initialized' };
    }

    try {
      // Get the Discord client's underlying client to create DM channel
      const client = this.discordClient.getClient();
      const user = await client.users.fetch(discordUserId);
      const dmChannel = await user.createDM();

      // Send message with optional embed
      if (embed) {
        await this.discordClient.sendMessage(dmChannel.id, {
          content: message || undefined,
          embeds: [embed],
        });
      } else {
        await this.discordClient.sendMessage(dmChannel.id, {
          content: message,
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BotService] Discord DM failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send a Discord message via webhook
   * @param webhookUrl - The Discord webhook URL
   * @param message - The message content
   * @param embed - Optional embed data
   */
  async sendDiscordWebhook(
    webhookUrl: string,
    message: string,
    embed?: {
      title: string;
      description: string;
      color: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const body: Record<string, unknown> = {};

      if (message) {
        body.content = message;
      }

      if (embed) {
        body.embeds = [{
          title: embed.title,
          description: embed.description,
          color: embed.color,
          fields: embed.fields || [],
          timestamp: new Date().toISOString(),
        }];
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send a Telegram message
   * @param chatId - The Telegram chat ID (user DM or group)
   * @param message - The message content (supports Markdown)
   */
  async sendTelegramMessage(
    chatId: number | string,
    message: string,
    options?: {
      parseMode?: 'Markdown' | 'HTML';
      keyboard?: Array<Array<{ text: string; callbackData?: string; url?: string }>>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.telegramClient) {
      return { success: false, error: 'Telegram bot not initialized' };
    }

    try {
      const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;

      await this.telegramClient.sendMessage(numericChatId, {
        text: message,
        parseMode: options?.parseMode || 'Markdown',
        keyboard: options?.keyboard,
        keyboardType: options?.keyboard ? 'inline' : undefined,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BotService] Telegram message failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify a Telegram linking code and return the chat ID
   * @param code - The base64 encoded linking code
   * @returns The userId and chatId if valid
   */
  verifyTelegramLinkingCode(code: string): { userId: string; chatId: string } | null {
    try {
      const decoded = Buffer.from(code, 'base64').toString('utf8');
      const [userId, chatId] = decoded.split(':');

      if (!userId || !chatId) {
        return null;
      }

      return { userId, chatId };
    } catch {
      return null;
    }
  }

  /**
   * Check if Discord bot is available
   */
  isDiscordAvailable(): boolean {
    return this.discordClient !== null && this.discordClient.isConnected();
  }

  /**
   * Check if Telegram bot is available
   */
  isTelegramAvailable(): boolean {
    return this.telegramClient !== null;
  }

  /**
   * Get bot status for health checks
   */
  getStatus(): { discord: boolean; telegram: boolean } {
    return {
      discord: this.isDiscordAvailable(),
      telegram: this.isTelegramAvailable(),
    };
  }
}

// Singleton instance
export const botService = new BotService();
