import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { generateState } from 'arctic';
import { github, discord } from '../lib/auth';
import { requireAuth } from '../middleware/auth';
import { connectionManager } from '../services/connection-manager';
import { botService } from '../services/bot-service';
import { notificationService } from '../services/notification-service';
import type { AuthenticatedContext } from '../types';

export const connectionRoutes = new Hono<AuthenticatedContext>();

connectionRoutes.use('*', requireAuth);

// List user connections
connectionRoutes.get('/', async (c) => {
  const user = c.get('user');

  const connections = await connectionManager.getUserConnections(user.id);

  // Remove sensitive token data and map to frontend expected field names
  const sanitized = connections.map((conn) => ({
    id: conn.id,
    provider: conn.type, // Frontend expects 'provider' not 'type'
    providerId: conn.externalId, // Frontend expects 'providerId' not 'externalId'
    expiresAt: conn.tokenExpiresAt, // Frontend expects 'expiresAt' not 'tokenExpiresAt'
    metadata: conn.metadata,
    createdAt: conn.createdAt,
  }));

  return c.json({ connections: sanitized });
});

// Delete connection
connectionRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const connectionId = c.req.param('id');

  await connectionManager.deleteConnection(user.id, connectionId);

  return c.json({ success: true });
});

// Validate connection
connectionRoutes.get('/:id/validate', async (c) => {
  const user = c.get('user');
  const connectionId = c.req.param('id');

  const isValid = await connectionManager.validateConnection(user.id, connectionId);

  return c.json({ valid: isValid });
});

// Refresh connection token
connectionRoutes.post('/:id/refresh', async (c) => {
  const user = c.get('user');
  const connectionId = c.req.param('id');

  const refreshed = await connectionManager.refreshToken(user.id, connectionId);

  if (!refreshed) {
    throw new HTTPException(400, { message: 'Failed to refresh token' });
  }

  return c.json({
    success: true,
    tokenExpiresAt: refreshed.tokenExpiresAt,
  });
});

// Connect GitHub (for agent usage, separate from auth)
connectionRoutes.get('/github/connect', async (c) => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, [
    'user:email',
    'repo',
    'read:org',
  ]);

  c.header(
    'Set-Cookie',
    `github_connect_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );

  return c.redirect(url.toString());
});

connectionRoutes.get('/github/callback', async (c) => {
  const user = c.get('user');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = c.req
    .header('Cookie')
    ?.match(/github_connect_state=([^;]+)/)?.[1];

  if (!code || !state || state !== storedState) {
    throw new HTTPException(400, { message: 'Invalid OAuth state' });
  }

  const tokens = await github.validateAuthorizationCode(code);

  // Get GitHub user info
  const githubUserResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  });
  const githubUser = (await githubUserResponse.json()) as {
    id: number;
    login: string;
  };

  await connectionManager.createConnection(
    user.id,
    'github',
    String(githubUser.id),
    {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      expiresAt: tokens.accessTokenExpiresAt(),
    },
    { username: githubUser.login }
  );

  return c.redirect(
    `${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/connections?connected=github`
  );
});

// Connect Discord
connectionRoutes.get('/discord/connect', async (c) => {
  const state = generateState();
  const url = discord.createAuthorizationURL(state, [
    'identify',
    'guilds',
    'bot',
  ]);

  c.header(
    'Set-Cookie',
    `discord_connect_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );

  return c.redirect(url.toString());
});

connectionRoutes.get('/discord/callback', async (c) => {
  const user = c.get('user');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = c.req
    .header('Cookie')
    ?.match(/discord_connect_state=([^;]+)/)?.[1];

  if (!code || !state || state !== storedState) {
    throw new HTTPException(400, { message: 'Invalid OAuth state' });
  }

  const tokens = await discord.validateAuthorizationCode(code);

  const discordUserResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  });
  const discordUser = (await discordUserResponse.json()) as {
    id: string;
    username: string;
  };

  await connectionManager.createConnection(
    user.id,
    'discord',
    discordUser.id,
    {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      expiresAt: tokens.accessTokenExpiresAt(),
    },
    { username: discordUser.username }
  );

  return c.redirect(
    `${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/connections?connected=discord`
  );
});

// Link/unlink connection to agent
const linkSchema = z.object({
  agentId: z.string(),
  config: z.record(z.unknown()).optional(),
});

connectionRoutes.post(
  '/:id/link',
  zValidator('json', linkSchema),
  async (c) => {
    const user = c.get('user');
    const connectionId = c.req.param('id');
    const { agentId, config } = c.req.valid('json');

    // Validate ownership of both connection and agent
    const connection = await connectionManager.getConnection(user.id, connectionId);
    if (!connection) {
      throw new HTTPException(404, { message: 'Connection not found' });
    }

    await connectionManager.linkConnectionToAgent(agentId, connectionId, config || {});

    return c.json({ success: true });
  }
);

connectionRoutes.post('/:id/unlink', zValidator('json', z.object({ agentId: z.string() })), async (c) => {
  const connectionId = c.req.param('id');
  const { agentId } = c.req.valid('json');

  await connectionManager.unlinkConnectionFromAgent(agentId, connectionId);

  return c.json({ success: true });
});

// Add wallet connection (manual)
const walletSchema = z.object({
  address: z.string(),
  chain: z.enum(['ethereum', 'solana', 'polygon', 'arbitrum', 'optimism', 'base']),
  label: z.string().optional(),
});

connectionRoutes.post('/wallet', zValidator('json', walletSchema), async (c) => {
  const user = c.get('user');
  const { address, chain, label } = c.req.valid('json');

  // For wallets, we don't have OAuth tokens, just store the address
  const walletType = chain === 'solana' ? 'wallet-solana' : 'wallet-evm';
  await connectionManager.createConnection(
    user.id,
    walletType,
    `${chain}:${address}`,
    {
      accessToken: 'readonly', // Placeholder - wallets are read-only
    },
    { address, chain, label }
  );

  return c.json({ success: true });
});

// =============================================================================
// TELEGRAM LINKING
// =============================================================================

/**
 * Link Telegram account using a code from the bot
 *
 * Flow:
 * 1. User messages @ElizaGotchiBot with /start
 * 2. Bot sends back a linking code (base64 encoded userId:chatId)
 * 3. User pastes code into dashboard
 * 4. This endpoint validates and creates the connection
 */
const telegramLinkSchema = z.object({
  code: z.string().min(10, 'Invalid linking code'),
});

connectionRoutes.post(
  '/telegram/link',
  zValidator('json', telegramLinkSchema),
  async (c) => {
    const user = c.get('user');
    const { code } = c.req.valid('json');

    // Verify the linking code
    const linkData = botService.verifyTelegramLinkingCode(code);
    if (!linkData) {
      throw new HTTPException(400, { message: 'Invalid or expired linking code' });
    }

    const { userId: telegramUserId, chatId } = linkData;

    // Create the Telegram connection
    await connectionManager.createConnection(
      user.id,
      'telegram',
      telegramUserId,
      {
        accessToken: 'linked', // Telegram doesn't use OAuth tokens
      },
      {
        chatId,
        telegramUserId,
        linkedAt: new Date().toISOString(),
      }
    );

    // Send confirmation message to user's Telegram
    await botService.sendTelegramMessage(chatId,
      `\\u2705 *Account linked successfully!*\n\nYour Telegram is now connected to ElizaGotchi OS. You'll receive notifications for your agents here.\n\nManage your notifications in the dashboard.`,
      { parseMode: 'Markdown' }
    );

    return c.json({
      success: true,
      telegramUserId,
      chatId,
    });
  }
);

/**
 * Add Discord webhook for notifications
 */
const webhookSchema = z.object({
  webhookUrl: z.string().url().refine(
    (url) => url.startsWith('https://discord.com/api/webhooks/'),
    'Must be a valid Discord webhook URL'
  ),
  label: z.string().optional(),
});

connectionRoutes.post(
  '/discord/webhook',
  zValidator('json', webhookSchema),
  async (c) => {
    const user = c.get('user');
    const { webhookUrl, label } = c.req.valid('json');

    // Extract webhook ID from URL for externalId
    const webhookId = webhookUrl.split('/webhooks/')[1]?.split('/')[0] || 'webhook';

    await connectionManager.createConnection(
      user.id,
      'discord',
      `webhook:${webhookId}`,
      {
        accessToken: 'webhook', // Webhooks don't use OAuth tokens
      },
      {
        webhookUrl,
        label: label || 'Discord Webhook',
        isWebhook: true,
      }
    );

    return c.json({ success: true });
  }
);

// =============================================================================
// NOTIFICATION TESTING
// =============================================================================

/**
 * Test notifications for a specific connection
 */
connectionRoutes.post('/:id/test-notification', async (c) => {
  const user = c.get('user');
  const connectionId = c.req.param('id');

  // Verify ownership
  const connection = await connectionManager.getConnection(user.id, connectionId);
  if (!connection) {
    throw new HTTPException(404, { message: 'Connection not found' });
  }

  // Send test notification based on connection type
  if (connection.type === 'discord') {
    const metadata = connection.metadata as Record<string, unknown> | null;

    if (metadata?.isWebhook && metadata?.webhookUrl) {
      const result = await botService.sendDiscordWebhook(
        metadata.webhookUrl as string,
        '',
        {
          title: '\\ud83d\\udd14 Test Notification',
          description: 'This is a test notification from ElizaGotchi OS. If you see this, your webhook is working!',
          color: 0x00ff00,
        }
      );
      return c.json({ success: result.success, error: result.error });
    } else if (connection.externalId) {
      const result = await botService.sendDiscordDM(
        connection.externalId,
        '',
        {
          title: '\\ud83d\\udd14 Test Notification',
          description: 'This is a test notification from ElizaGotchi OS. If you see this, your Discord DMs are working!',
          color: 0x00ff00,
        }
      );
      return c.json({ success: result.success, error: result.error });
    }
  } else if (connection.type === 'telegram') {
    const metadata = connection.metadata as Record<string, unknown> | null;
    const chatId = (metadata?.chatId as string) || connection.externalId;

    if (chatId) {
      const result = await botService.sendTelegramMessage(
        chatId,
        '\\ud83d\\udd14 *Test Notification*\n\nThis is a test notification from ElizaGotchi OS. If you see this, your Telegram notifications are working!',
        { parseMode: 'Markdown' }
      );
      return c.json({ success: result.success, error: result.error });
    }
  }

  throw new HTTPException(400, { message: 'Connection type does not support notifications' });
});

/**
 * Test all notification channels for an agent
 */
connectionRoutes.post('/test-agent/:agentId', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('agentId');

  const result = await notificationService.testChannels(agentId);
  return c.json(result);
});

/**
 * Get notification service status
 */
connectionRoutes.get('/notification-status', async (c) => {
  const status = notificationService.getStatus();
  return c.json(status);
});
