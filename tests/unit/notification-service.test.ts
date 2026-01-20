/**
 * Unit tests for NotificationService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the bot service
vi.mock('../../apps/api/src/services/bot-service', () => ({
  botService: {
    sendDiscordDM: vi.fn().mockResolvedValue({ success: true }),
    sendDiscordWebhook: vi.fn().mockResolvedValue({ success: true }),
    sendTelegramMessage: vi.fn().mockResolvedValue({ success: true }),
    getStatus: vi.fn().mockReturnValue({ discord: true, telegram: true }),
  },
}));

// Mock database
vi.mock('@elizagotchi/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
  agents: {},
  connections: {},
  agentConnections: {},
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('send()', () => {
    it('should return success when no channels are configured', async () => {
      // Import after mocks are set up
      const { notificationService } = await import(
        '../../apps/api/src/services/notification-service'
      );

      const result = await notificationService.send({
        userId: 'user-1',
        agentId: 'agent-1',
        type: 'whale_alert',
        priority: 'high',
        title: 'Test Alert',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.sent).toEqual([]);
      expect(result.failed).toEqual([]);
    });
  });

  describe('getStatus()', () => {
    it('should return bot status', async () => {
      const { notificationService } = await import(
        '../../apps/api/src/services/notification-service'
      );

      const status = notificationService.getStatus();

      expect(status).toEqual({ discord: true, telegram: true });
    });
  });
});
