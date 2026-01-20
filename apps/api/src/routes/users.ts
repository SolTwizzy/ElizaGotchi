import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db, users, subscriptions, agents } from '@elizagotchi/database';
import { generateTelegramLinkCode } from '../services/telegram-bot';
import { PLANS } from '@elizagotchi/shared';
import { requireAuth } from '../middleware/auth';
import { lucia } from '../lib/auth';
import type { AuthenticatedContext } from '../types';

export const userRoutes = new Hono<AuthenticatedContext>();

userRoutes.use('*', requireAuth);

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateNotificationSettingsSchema = z.object({
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().max(100).optional(),
  discordEnabled: z.boolean().optional(),
  discordWebhook: z.string().url().max(500).optional(),
});

// Get current user profile
userRoutes.get('/me', async (c) => {
  const user = c.get('user');

  const fullUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      telegramEnabled: true,
      telegramChatId: true,
      discordEnabled: true,
      discordWebhook: true,
      createdAt: true,
    },
  });

  if (!fullUser) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  // Get user's subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  const plan = subscription?.plan || 'free';

  // Get agent count
  const agentCount = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, user.id))
    .then((rows) => rows.length);

  const planDetails = PLANS[plan as keyof typeof PLANS] || PLANS.free;

  return c.json({
    user: { ...fullUser, plan },
    subscription: subscription || null,
    usage: {
      agents: agentCount,
      agentsLimit: planDetails?.maxAgents || 1,
    },
  });
});

// Update user profile
userRoutes.patch('/me', zValidator('json', updateProfileSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  const [updatedUser] = await db
    .update(users)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
    });

  // Get plan from subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  return c.json({ user: { ...updatedUser, plan: subscription?.plan || 'free' } });
});

// Delete user account
userRoutes.delete('/me', async (c) => {
  const user = c.get('user');
  const session = c.get('session');

  // Invalidate all sessions
  await lucia.invalidateUserSessions(user.id);

  // Delete user (cascades to agents, connections, etc.)
  await db.delete(users).where(eq(users.id, user.id));

  // Clear session cookie
  const blankCookie = lucia.createBlankSessionCookie();
  c.header('Set-Cookie', blankCookie.serialize());

  return c.json({ success: true });
});

// Get user's subscription details
userRoutes.get('/subscription', async (c) => {
  const user = c.get('user');

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  const plan = subscription?.plan || 'free';
  const planDetails = PLANS[plan as keyof typeof PLANS] || PLANS.free;

  return c.json({
    subscription: subscription || null,
    plan: {
      id: plan,
      ...planDetails,
    },
  });
});

// Get available plans
userRoutes.get('/plans', async (c) => {
  return c.json({ plans: PLANS });
});

// Get user's API usage stats
userRoutes.get('/usage', async (c) => {
  const user = c.get('user');

  // Get subscription to find plan
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  const plan = subscription?.plan || 'free';

  // Get agent count
  const userAgents = await db.query.agents.findMany({
    where: eq(agents.userId, user.id),
    columns: {
      id: true,
      status: true,
    },
  });

  const planDetails = PLANS[plan as keyof typeof PLANS] || PLANS.free;

  return c.json({
    agents: {
      total: userAgents.length,
      running: userAgents.filter((a) => a.status === 'running').length,
      limit: planDetails?.maxAgents || 1,
    },
    plan: plan,
  });
});

// Get notification settings
userRoutes.get('/notifications', async (c) => {
  const user = c.get('user');

  const settings = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      telegramEnabled: true,
      telegramChatId: true,
      discordEnabled: true,
      discordWebhook: true,
    },
  });

  return c.json({
    telegram: {
      enabled: settings?.telegramEnabled ?? false,
      chatId: settings?.telegramChatId ?? null,
    },
    discord: {
      enabled: settings?.discordEnabled ?? false,
      webhookUrl: settings?.discordWebhook ?? null,
    },
  });
});

// Generate Telegram link code
userRoutes.post('/notifications/telegram/link-code', async (c) => {
  const user = c.get('user');
  const code = generateTelegramLinkCode(user.id);

  return c.json({
    code,
    expiresIn: 600, // 10 minutes in seconds
    instructions: `Send this to @elizagotchi_bot: /link ${code}`,
  });
});

// Update notification settings
userRoutes.patch('/notifications', zValidator('json', updateNotificationSettingsSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.telegramEnabled !== undefined) updateData.telegramEnabled = body.telegramEnabled;
  if (body.telegramChatId !== undefined) updateData.telegramChatId = body.telegramChatId || null;
  if (body.discordEnabled !== undefined) updateData.discordEnabled = body.discordEnabled;
  if (body.discordWebhook !== undefined) updateData.discordWebhook = body.discordWebhook || null;

  await db.update(users).set(updateData).where(eq(users.id, user.id));

  const settings = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      telegramEnabled: true,
      telegramChatId: true,
      discordEnabled: true,
      discordWebhook: true,
    },
  });

  return c.json({
    telegram: {
      enabled: settings?.telegramEnabled ?? false,
      chatId: settings?.telegramChatId ?? null,
    },
    discord: {
      enabled: settings?.discordEnabled ?? false,
      webhookUrl: settings?.discordWebhook ?? null,
    },
  });
});
