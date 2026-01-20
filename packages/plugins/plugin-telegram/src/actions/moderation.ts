import type { TelegramClient } from '../client';

export interface ModerationResult {
  success: boolean;
  error?: string;
}

export function createModerationAction(client: TelegramClient) {
  return {
    name: 'moderation',
    description: 'Moderation actions for Telegram groups',

    async kick(chatId: number, userId: number): Promise<ModerationResult> {
      const success = await client.kickChatMember(chatId, userId);
      if (!success) {
        return { success: false, error: 'Failed to kick user. Check bot permissions.' };
      }
      // Immediately unban so they can rejoin
      await client.unbanChatMember(chatId, userId);
      return { success: true };
    },

    async ban(chatId: number, userId: number): Promise<ModerationResult> {
      const success = await client.kickChatMember(chatId, userId);
      if (!success) {
        return { success: false, error: 'Failed to ban user. Check bot permissions.' };
      }
      return { success: true };
    },

    async unban(chatId: number, userId: number): Promise<ModerationResult> {
      const success = await client.unbanChatMember(chatId, userId);
      if (!success) {
        return { success: false, error: 'Failed to unban user.' };
      }
      return { success: true };
    },

    async mute(
      chatId: number,
      userId: number,
      durationSeconds?: number
    ): Promise<ModerationResult> {
      const untilDate = durationSeconds
        ? Math.floor(Date.now() / 1000) + durationSeconds
        : undefined;

      const success = await client.restrictChatMember(
        chatId,
        userId,
        { canSendMessages: false, canSendMedia: false },
        untilDate
      );

      if (!success) {
        return { success: false, error: 'Failed to mute user. Check bot permissions.' };
      }
      return { success: true };
    },

    async unmute(chatId: number, userId: number): Promise<ModerationResult> {
      const success = await client.restrictChatMember(
        chatId,
        userId,
        { canSendMessages: true, canSendMedia: true }
      );

      if (!success) {
        return { success: false, error: 'Failed to unmute user.' };
      }
      return { success: true };
    },

    async restrictMedia(
      chatId: number,
      userId: number,
      durationSeconds?: number
    ): Promise<ModerationResult> {
      const untilDate = durationSeconds
        ? Math.floor(Date.now() / 1000) + durationSeconds
        : undefined;

      const success = await client.restrictChatMember(
        chatId,
        userId,
        { canSendMessages: true, canSendMedia: false },
        untilDate
      );

      if (!success) {
        return { success: false, error: 'Failed to restrict user. Check bot permissions.' };
      }
      return { success: true };
    },

    async isAdmin(chatId: number, userId: number): Promise<boolean> {
      const member = await client.getChatMember(chatId, userId);
      return member.isAdmin;
    },

    async getMemberStatus(chatId: number, userId: number): Promise<{
      status: string;
      isAdmin: boolean;
    }> {
      return client.getChatMember(chatId, userId);
    },

    // Delete a message
    async deleteMessage(chatId: number, messageId: number): Promise<ModerationResult> {
      try {
        await client.deleteMessage(chatId, messageId);
        return { success: true };
      } catch {
        return { success: false, error: 'Failed to delete message.' };
      }
    },

    // Warn user (sends a warning message)
    async warnUser(
      chatId: number,
      userId: number,
      reason?: string
    ): Promise<{ success: boolean; messageId?: number }> {
      const text = `⚠️ <b>Warning</b>\n\nUser <a href="tg://user?id=${userId}">mentioned</a> has been warned.${reason ? `\n\nReason: ${reason}` : ''}`;

      const messageId = await client.sendMessage(chatId, {
        text,
        parseMode: 'HTML',
      });

      return { success: true, messageId };
    },
  };
}

export type ModerationAction = ReturnType<typeof createModerationAction>;
