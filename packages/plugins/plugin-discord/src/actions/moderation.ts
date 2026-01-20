import type { DiscordClient } from '../client';

export interface TimeoutInput {
  guildId: string;
  userId: string;
  durationMinutes: number;
  reason?: string;
}

export interface BanInput {
  guildId: string;
  userId: string;
  reason?: string;
  deleteMessageDays?: number;
}

export interface KickInput {
  guildId: string;
  userId: string;
  reason?: string;
}

export interface RoleInput {
  guildId: string;
  userId: string;
  roleId: string;
}

export interface ModerationResult {
  success: boolean;
  error?: string;
}

export function createModerationAction(client: DiscordClient) {
  return {
    name: 'moderation',
    description: 'Moderation actions for Discord servers',

    async timeout(input: TimeoutInput): Promise<ModerationResult> {
      const durationMs = input.durationMinutes * 60 * 1000;
      const success = await client.timeoutMember(
        input.guildId,
        input.userId,
        durationMs,
        input.reason
      );

      if (!success) {
        return { success: false, error: 'Failed to timeout user. Check permissions.' };
      }

      return { success: true };
    },

    async removeTimeout(guildId: string, userId: string): Promise<ModerationResult> {
      // Setting timeout to null removes it
      const success = await client.timeoutMember(guildId, userId, 0);

      if (!success) {
        return { success: false, error: 'Failed to remove timeout.' };
      }

      return { success: true };
    },

    async kick(input: KickInput): Promise<ModerationResult> {
      const success = await client.kickMember(input.guildId, input.userId, input.reason);

      if (!success) {
        return { success: false, error: 'Failed to kick user. Check permissions.' };
      }

      return { success: true };
    },

    async ban(input: BanInput): Promise<ModerationResult> {
      const success = await client.banMember(
        input.guildId,
        input.userId,
        input.reason,
        input.deleteMessageDays
      );

      if (!success) {
        return { success: false, error: 'Failed to ban user. Check permissions.' };
      }

      return { success: true };
    },

    async unban(guildId: string, userId: string): Promise<ModerationResult> {
      const success = await client.unbanMember(guildId, userId);

      if (!success) {
        return { success: false, error: 'Failed to unban user.' };
      }

      return { success: true };
    },

    async assignRole(input: RoleInput): Promise<ModerationResult> {
      const success = await client.assignRole(input.guildId, input.userId, input.roleId);

      if (!success) {
        return { success: false, error: 'Failed to assign role. Check permissions.' };
      }

      return { success: true };
    },

    async removeRole(input: RoleInput): Promise<ModerationResult> {
      const success = await client.removeRole(input.guildId, input.userId, input.roleId);

      if (!success) {
        return { success: false, error: 'Failed to remove role. Check permissions.' };
      }

      return { success: true };
    },

    // Bulk moderation
    async bulkTimeout(
      guildId: string,
      userIds: string[],
      durationMinutes: number,
      reason?: string
    ): Promise<{ successful: string[]; failed: string[] }> {
      const successful: string[] = [];
      const failed: string[] = [];

      for (const userId of userIds) {
        const result = await this.timeout({ guildId, userId, durationMinutes, reason });
        if (result.success) {
          successful.push(userId);
        } else {
          failed.push(userId);
        }
      }

      return { successful, failed };
    },

    async bulkAssignRole(
      guildId: string,
      userIds: string[],
      roleId: string
    ): Promise<{ successful: string[]; failed: string[] }> {
      const successful: string[] = [];
      const failed: string[] = [];

      for (const userId of userIds) {
        const result = await this.assignRole({ guildId, userId, roleId });
        if (result.success) {
          successful.push(userId);
        } else {
          failed.push(userId);
        }
      }

      return { successful, failed };
    },
  };
}

export type ModerationAction = ReturnType<typeof createModerationAction>;
