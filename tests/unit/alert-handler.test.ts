/**
 * Unit tests for AlertHandler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AlertHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAlertHandler()', () => {
    it('should create an AlertHandler instance', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      expect(handler).toBeDefined();
      expect(typeof handler.sendAlert).toBe('function');
      expect(typeof handler.whaleAlert).toBe('function');
      expect(typeof handler.gasAlert).toBe('function');
    });
  });

  describe('sendAlert()', () => {
    it('should send alert to API endpoint', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      const result = await handler.sendAlert({
        type: 'whale_alert',
        priority: 'high',
        title: 'Whale Alert',
        message: 'Large transaction detected',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/internal/send-notification',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Agent-Id': 'agent-123',
            'X-User-Id': 'user-456',
          }),
        })
      );

      expect(result.success).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      const result = await handler.sendAlert({
        type: 'whale_alert',
        priority: 'high',
        title: 'Test',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      const result = await handler.sendAlert({
        type: 'whale_alert',
        priority: 'high',
        title: 'Test',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('convenience methods', () => {
    it('should send whale alert with correct type', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      await handler.whaleAlert('Whale Detected', '5,000 ETH moved', {
        chain: 'ethereum',
        amount: '5000',
        token: 'ETH',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('whale_alert');
      expect(callBody.priority).toBe('high');
      expect(callBody.data.chain).toBe('ethereum');
    });

    it('should send gas alert with correct type', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      await handler.gasAlert('Gas Low', 'Ethereum gas is at 10 gwei', {
        chain: 'ethereum',
        gasPrice: '10',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('gas_alert');
      expect(callBody.priority).toBe('medium');
    });

    it('should send airdrop alert with correct type', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      await handler.airdropAlert('New Airdrop', 'You may be eligible', {
        protocol: 'Jupiter',
        estimatedValue: '$500',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('airdrop');
      expect(callBody.priority).toBe('high');
    });

    it('should send portfolio alert with correct type', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      await handler.portfolioAlert('Portfolio Update', 'Value changed by 5%', {
        change: '+5%',
        currentValue: '$10,000',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('portfolio');
      expect(callBody.priority).toBe('low'); // Portfolio alerts are low priority by design
    });

    it('should send contract alert with correct type', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      await handler.contractAlert('Contract Event', 'Swap executed', {
        contract: 'Uniswap V2',
        event: 'Swap',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('contract_event');
      expect(callBody.priority).toBe('medium');
    });

    it('should send custom alert with specified priority', async () => {
      const { createAlertHandler } = await import(
        '../../packages/agent-runtime/src/alert-handler'
      );

      const handler = createAlertHandler({
        agentId: 'agent-123',
        userId: 'user-456',
        apiUrl: 'http://localhost:4000',
      });

      await handler.customAlert('Custom Alert', 'Custom message', 'low', {
        custom: 'data',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.type).toBe('custom');
      expect(callBody.priority).toBe('low');
    });
  });
});
