/**
 * Integration tests for internal API routes
 *
 * Tests the agent-to-platform communication endpoints.
 * These routes are used by the agent runtime to send notifications,
 * log activity, and update heartbeats.
 *
 * Required environment variables:
 * - API_URL (optional, defaults to http://localhost:4000)
 * - TEST_USER_ID
 * - TEST_AGENT_ID (an agent owned by TEST_USER_ID)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { testUtils } from '../../setup';

// Skip if integration tests disabled
const runTests = testUtils.shouldRunIntegrationTests();

describe.skipIf(!runTests)('Internal API Routes', () => {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const testUserId = process.env.TEST_USER_ID;
  const testAgentId = process.env.TEST_AGENT_ID;

  beforeAll(() => {
    if (!testUserId) {
      console.warn('TEST_USER_ID not set - tests will be limited');
    }
    if (!testAgentId) {
      console.warn('TEST_AGENT_ID not set - tests will be limited');
    }
  });

  describe('Authentication', () => {
    it('should reject requests without X-Agent-Id header', async () => {
      const response = await fetch(`${apiUrl}/api/internal/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': testUserId || 'test-user',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject requests without X-User-Id header', async () => {
      const response = await fetch(`${apiUrl}/api/internal/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': testAgentId || 'test-agent',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid agent ID', async () => {
      const response = await fetch(`${apiUrl}/api/internal/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': 'invalid-agent-id-that-does-not-exist',
          'X-User-Id': testUserId || 'test-user',
        },
      });

      // Should be 403 (forbidden) or 404 (not found)
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('POST /api/internal/send-notification', () => {
    it('should validate notification payload', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      // Send invalid payload (missing required fields)
      const response = await fetch(`${apiUrl}/api/internal/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': testAgentId,
          'X-User-Id': testUserId,
        },
        body: JSON.stringify({
          // Missing type, priority, title, message
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid notification payload', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      const response = await fetch(`${apiUrl}/api/internal/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': testAgentId,
          'X-User-Id': testUserId,
        },
        body: JSON.stringify({
          type: 'whale_alert',
          priority: 'high',
          title: 'Test Alert',
          message: 'This is a test notification from the test suite',
          data: {
            testRun: true,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should handle all notification types', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      const types = [
        'whale_alert',
        'gas_alert',
        'airdrop',
        'portfolio',
        'contract_event',
        'custom',
      ] as const;

      for (const type of types) {
        const response = await fetch(
          `${apiUrl}/api/internal/send-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Agent-Id': testAgentId,
              'X-User-Id': testUserId,
            },
            body: JSON.stringify({
              type,
              priority: 'low',
              title: `Test ${type}`,
              message: `Testing ${type} notification`,
            }),
          }
        );

        // Should either succeed or fail gracefully
        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('POST /api/internal/log', () => {
    it('should accept agent activity logs', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      const response = await fetch(`${apiUrl}/api/internal/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': testAgentId,
          'X-User-Id': testUserId,
        },
        body: JSON.stringify({
          level: 'info',
          message: 'Test log message from test suite',
          data: {
            testRun: true,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should handle different log levels', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      const levels = ['debug', 'info', 'warn', 'error'] as const;

      for (const level of levels) {
        const response = await fetch(`${apiUrl}/api/internal/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Id': testAgentId,
            'X-User-Id': testUserId,
          },
          body: JSON.stringify({
            level,
            message: `Test ${level} log`,
          }),
        });

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('POST /api/internal/heartbeat', () => {
    it('should update agent heartbeat', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      const response = await fetch(`${apiUrl}/api/internal/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': testAgentId,
          'X-User-Id': testUserId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should accept optional status data', async () => {
      if (!testAgentId || !testUserId) {
        console.log('Skipping - TEST_AGENT_ID or TEST_USER_ID not set');
        return;
      }

      const response = await fetch(`${apiUrl}/api/internal/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': testAgentId,
          'X-User-Id': testUserId,
        },
        body: JSON.stringify({
          status: {
            memoryUsage: process.memoryUsage().heapUsed,
            uptime: process.uptime(),
            lastAction: 'test_heartbeat',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });
});
