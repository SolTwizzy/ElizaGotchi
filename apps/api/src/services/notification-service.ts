import { eq, and } from 'drizzle-orm';
import { db, agents, connections, agentConnections } from '@elizagotchi/database';
import { botService } from './bot-service';

/**
 * NotificationService - Routes alerts to user's connected notification channels
 *
 * This service provides a unified interface for sending notifications to users
 * via their connected Discord or Telegram accounts.
 */

export type NotificationType =
  | 'whale_alert'
  | 'gas_alert'
  | 'airdrop'
  | 'portfolio'
  | 'contract_event'
  | 'custom';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationPayload {
  userId: string;
  agentId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationChannel {
  type: 'discord' | 'telegram';
  connectionId: string;
  // Discord-specific
  discordUserId?: string;
  webhookUrl?: string;
  // Telegram-specific
  telegramChatId?: string;
}

/**
 * Priority colors for Discord embeds
 */
const PRIORITY_COLORS = {
  low: 0x3498db, // Blue
  medium: 0xf39c12, // Orange
  high: 0xe74c3c, // Red
};

/**
 * Priority emojis for Telegram
 */
const PRIORITY_EMOJIS = {
  low: '',
  medium: '\\u26A0\\uFE0F',
  high: '\\u26A0\\uFE0F\\u26A0\\uFE0F',
};

/**
 * Type emojis for messages
 */
const TYPE_EMOJIS: Record<NotificationType, string> = {
  whale_alert: '\\ud83d\\udc0b',
  gas_alert: '\\u26FD',
  airdrop: '\\ud83c\\udf81',
  portfolio: '\\ud83d\\udcca',
  contract_event: '\\ud83d\\udcdd',
  custom: '\\ud83d\\udd14',
};

class NotificationService {
  /**
   * Send a notification to all connected channels for an agent
   */
  async send(payload: NotificationPayload): Promise<{
    success: boolean;
    sent: string[];
    failed: string[];
  }> {
    const channels = await this.getChannelsForAgent(payload.agentId);

    const sent: string[] = [];
    const failed: string[] = [];

    for (const channel of channels) {
      try {
        const result = await this.sendToChannel(channel, payload);
        if (result.success) {
          sent.push(`${channel.type}:${channel.connectionId}`);
        } else {
          failed.push(`${channel.type}:${channel.connectionId} - ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push(`${channel.type}:${channel.connectionId} - ${errorMessage}`);
      }
    }

    return {
      success: failed.length === 0,
      sent,
      failed,
    };
  }

  /**
   * Send notifications to multiple users/agents in batch
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<{
    total: number;
    successful: number;
    failed: number;
  }> {
    let successful = 0;
    let failedCount = 0;

    for (const payload of payloads) {
      const result = await this.send(payload);
      if (result.success) {
        successful++;
      } else {
        failedCount++;
      }
    }

    return {
      total: payloads.length,
      successful,
      failed: failedCount,
    };
  }

  /**
   * Get all notification channels connected to an agent
   */
  private async getChannelsForAgent(agentId: string): Promise<NotificationChannel[]> {
    // Get all connections linked to this agent
    const linkedConnections = await db
      .select({
        connectionId: agentConnections.connectionId,
        connectionType: connections.type,
        externalId: connections.externalId,
        metadata: connections.metadata,
        config: agentConnections.config,
      })
      .from(agentConnections)
      .innerJoin(connections, eq(agentConnections.connectionId, connections.id))
      .where(eq(agentConnections.agentId, agentId));

    const channels: NotificationChannel[] = [];

    for (const conn of linkedConnections) {
      if (conn.connectionType === 'discord') {
        const metadata = conn.metadata as Record<string, unknown> | null;
        const config = conn.config as Record<string, unknown> | null;

        channels.push({
          type: 'discord',
          connectionId: conn.connectionId,
          discordUserId: conn.externalId || undefined,
          webhookUrl: (config?.webhookUrl as string) || undefined,
        });
      } else if (conn.connectionType === 'telegram') {
        const metadata = conn.metadata as Record<string, unknown> | null;

        channels.push({
          type: 'telegram',
          connectionId: conn.connectionId,
          telegramChatId: (metadata?.chatId as string) || conn.externalId || undefined,
        });
      }
    }

    return channels;
  }

  /**
   * Send notification to a specific channel
   */
  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (channel.type === 'discord') {
      return this.sendDiscordNotification(channel, payload);
    } else if (channel.type === 'telegram') {
      return this.sendTelegramNotification(channel, payload);
    }

    return { success: false, error: 'Unknown channel type' };
  }

  /**
   * Send Discord notification (DM or webhook)
   */
  private async sendDiscordNotification(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    const embed = {
      title: `${TYPE_EMOJIS[payload.type]} ${payload.title}`,
      description: payload.message,
      color: PRIORITY_COLORS[payload.priority],
      fields: payload.data
        ? Object.entries(payload.data)
            .slice(0, 5) // Max 5 fields
            .map(([key, value]) => ({
              name: key,
              value: String(value),
              inline: true,
            }))
        : undefined,
    };

    // Try webhook first if available
    if (channel.webhookUrl) {
      return botService.sendDiscordWebhook(channel.webhookUrl, '', embed);
    }

    // Otherwise try DM
    if (channel.discordUserId) {
      return botService.sendDiscordDM(channel.discordUserId, '', embed);
    }

    return { success: false, error: 'No Discord destination configured' };
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!channel.telegramChatId) {
      return { success: false, error: 'No Telegram chat ID configured' };
    }

    // Format message for Telegram with Markdown
    const priorityEmoji = PRIORITY_EMOJIS[payload.priority];
    const typeEmoji = TYPE_EMOJIS[payload.type];

    let message = `${priorityEmoji}${typeEmoji} *${payload.title}*\n\n${payload.message}`;

    // Add data fields if present
    if (payload.data && Object.keys(payload.data).length > 0) {
      message += '\n\n*Details:*';
      for (const [key, value] of Object.entries(payload.data).slice(0, 5)) {
        message += `\n- ${key}: \`${value}\``;
      }
    }

    return botService.sendTelegramMessage(channel.telegramChatId, message, {
      parseMode: 'Markdown',
    });
  }

  /**
   * Test notification channels for an agent
   */
  async testChannels(agentId: string): Promise<{
    channels: Array<{
      type: string;
      connectionId: string;
      status: 'ok' | 'error';
      error?: string;
    }>;
  }> {
    const channels = await this.getChannelsForAgent(agentId);
    const results: Array<{
      type: string;
      connectionId: string;
      status: 'ok' | 'error';
      error?: string;
    }> = [];

    for (const channel of channels) {
      const testPayload: NotificationPayload = {
        userId: '',
        agentId,
        type: 'custom',
        priority: 'low',
        title: 'Test Notification',
        message: 'This is a test notification from ElizaGotchi OS. If you receive this, your notification channel is working correctly!',
      };

      const result = await this.sendToChannel(channel, testPayload);
      results.push({
        type: channel.type,
        connectionId: channel.connectionId,
        status: result.success ? 'ok' : 'error',
        error: result.error,
      });
    }

    return { channels: results };
  }

  /**
   * Get notification status for health checks
   */
  getStatus(): { discord: boolean; telegram: boolean } {
    return botService.getStatus();
  }
}

// Singleton instance
export const notificationService = new NotificationService();
