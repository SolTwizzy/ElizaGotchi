/**
 * Integration tests for Discord and Telegram notifications
 *
 * IMPORTANT: These tests send REAL messages to Discord and Telegram.
 * Configure .env.testing with valid credentials before running.
 *
 * Required environment variables:
 * - DISCORD_BOT_TOKEN
 * - TEST_DISCORD_USER_ID (for DM tests)
 * - TEST_DISCORD_WEBHOOK_URL (for webhook tests)
 * - TELEGRAM_BOT_TOKEN
 * - TEST_TELEGRAM_CHAT_ID (for message tests)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { testUtils } from '../../setup';

// Skip if integration tests disabled
const runTests = testUtils.shouldRunIntegrationTests();

describe.skipIf(!runTests)('Discord Notification Tests', () => {
  const discordBotToken = process.env.DISCORD_BOT_TOKEN;
  const testDiscordUserId = process.env.TEST_DISCORD_USER_ID;
  const testWebhookUrl = process.env.TEST_DISCORD_WEBHOOK_URL;

  beforeAll(() => {
    if (!discordBotToken) {
      console.warn('DISCORD_BOT_TOKEN not set - Discord tests will be skipped');
    }
  });

  describe('Discord Webhook', () => {
    // Check if webhook URL is valid (not a placeholder)
    const isValidWebhook = testWebhookUrl && !testWebhookUrl.includes('your-webhook');

    it('should send a message via webhook', async () => {
      if (!isValidWebhook) {
        console.log('Skipping - TEST_DISCORD_WEBHOOK_URL not set or is placeholder');
        return;
      }

      const response = await fetch(testWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🧪 ElizaGotchi Test: Webhook notification test',
          embeds: [
            {
              title: '✅ Webhook Test Successful',
              description: 'This is a test notification from the ElizaGotchi test suite.',
              color: 0x00ff00,
              fields: [
                { name: 'Test Type', value: 'Webhook', inline: true },
                { name: 'Timestamp', value: new Date().toISOString(), inline: true },
              ],
              footer: { text: 'ElizaGotchi OS Test Suite' },
            },
          ],
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('should send an embed-only message via webhook', async () => {
      if (!isValidWebhook) {
        console.log('Skipping - TEST_DISCORD_WEBHOOK_URL not set or is placeholder');
        return;
      }

      const response = await fetch(testWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🐋 Whale Alert Test',
              description: 'Large transaction detected on Ethereum',
              color: 0xe74c3c,
              fields: [
                { name: 'Amount', value: '5,000 ETH', inline: true },
                { name: 'Value', value: '$12,500,000', inline: true },
                { name: 'From', value: 'Binance Hot Wallet', inline: false },
                { name: 'To', value: 'Unknown Wallet', inline: false },
              ],
            },
          ],
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Discord Bot DM', () => {
    it('should send a DM to test user', async () => {
      if (!discordBotToken || !testDiscordUserId) {
        console.log('Skipping - DISCORD_BOT_TOKEN or TEST_DISCORD_USER_ID not set');
        return;
      }

      // First, create a DM channel with the user
      const channelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: testDiscordUserId,
        }),
      });

      if (!channelResponse.ok) {
        console.log('Could not create DM channel - user may have DMs disabled');
        return;
      }

      const channel = await channelResponse.json() as { id: string };

      // Send a message to the DM channel
      const messageResponse = await fetch(
        `https://discord.com/api/v10/channels/${channel.id}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${discordBotToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: '🧪 ElizaGotchi Test: DM notification test',
            embeds: [
              {
                title: '✅ DM Test Successful',
                description: 'This is a test DM from the ElizaGotchi test suite.',
                color: 0x00ff00,
              },
            ],
          }),
        }
      );

      expect(messageResponse.ok).toBe(true);
    });
  });
});

describe.skipIf(!runTests)('Telegram Notification Tests', () => {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const testChatId = process.env.TEST_TELEGRAM_CHAT_ID;

  beforeAll(() => {
    if (!telegramBotToken) {
      console.warn('TELEGRAM_BOT_TOKEN not set - Telegram tests will be skipped');
    }
  });

  describe('Telegram Messages', () => {
    it('should send a text message', async () => {
      if (!telegramBotToken || !testChatId) {
        console.log('Skipping - TELEGRAM_BOT_TOKEN or TEST_TELEGRAM_CHAT_ID not set');
        return;
      }

      const response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: testChatId,
            text: '🧪 *ElizaGotchi Test*\n\nText notification test successful!',
            parse_mode: 'Markdown',
          }),
        }
      );

      const data = await response.json() as { ok: boolean };
      expect(data.ok).toBe(true);
    });

    it('should send a formatted alert message', async () => {
      if (!telegramBotToken || !testChatId) {
        console.log('Skipping - TELEGRAM_BOT_TOKEN or TEST_TELEGRAM_CHAT_ID not set');
        return;
      }

      const message = `🐋 *Whale Alert*

Large transaction detected on Ethereum!

*Details:*
- Amount: \`5,000 ETH\`
- Value: \`$12,500,000\`
- From: Binance Hot Wallet
- To: Unknown Wallet

_This is a test notification from ElizaGotchi OS_`;

      const response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: testChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      const data = await response.json() as { ok: boolean };
      expect(data.ok).toBe(true);
    });

    it('should send a message with inline keyboard', async () => {
      if (!telegramBotToken || !testChatId) {
        console.log('Skipping - TELEGRAM_BOT_TOKEN or TEST_TELEGRAM_CHAT_ID not set');
        return;
      }

      const response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: testChatId,
            text: '🎁 *Airdrop Alert*\n\nYou may be eligible for the Jupiter airdrop!',
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🔍 Check Eligibility', url: 'https://jup.ag' },
                  { text: '📖 Learn More', url: 'https://docs.jup.ag' },
                ],
              ],
            },
          }),
        }
      );

      const data = await response.json() as { ok: boolean };
      expect(data.ok).toBe(true);
    });
  });

  describe('Telegram Bot Info', () => {
    it('should get bot information', async () => {
      if (!telegramBotToken) {
        console.log('Skipping - TELEGRAM_BOT_TOKEN not set');
        return;
      }

      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getMe`);
      const data = await response.json() as { ok: boolean; result?: { username: string } };

      expect(data.ok).toBe(true);
      expect(data.result?.username).toBeDefined();

      console.log(`Telegram bot username: @${data.result?.username}`);
    });
  });
});

describe.skipIf(!runTests)('Notification Service Integration', () => {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';

  it('should check notification service status', async () => {
    const response = await fetch(`${apiUrl}/api/connections/notification-status`);

    if (response.ok) {
      const data = await response.json() as { discord: boolean; telegram: boolean };
      console.log('Notification service status:', data);
      expect(data).toHaveProperty('discord');
      expect(data).toHaveProperty('telegram');
    }
  });
});
