import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db, agents } from '@elizagotchi/database';
import { notificationService } from '../services/notification-service';
import type { NotificationType, NotificationPriority } from '../services/notification-service';
import { botService } from '../services/bot-service';
import type { InternalContext } from '../types';

/**
 * Internal API routes for agent-to-platform communication
 *
 * These routes are called by agent runtimes, not by frontend clients.
 * Authentication is via X-Agent-Id and X-User-Id headers.
 */

export const internalRoutes = new Hono<InternalContext>();

// UUID regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Middleware to validate internal agent calls
internalRoutes.use('*', async (c, next) => {
  const agentId = c.req.header('X-Agent-Id');
  const userId = c.req.header('X-User-Id');

  if (!agentId || !userId) {
    throw new HTTPException(401, { message: 'Missing agent credentials' });
  }

  // Validate UUID format before querying database
  if (!UUID_REGEX.test(agentId) || !UUID_REGEX.test(userId)) {
    throw new HTTPException(403, { message: 'Invalid agent credentials' });
  }

  // Verify the agent exists and belongs to the user
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });

  if (!agent || agent.userId !== userId) {
    throw new HTTPException(403, { message: 'Invalid agent credentials' });
  }

  // Store agent info in context
  c.set('agentId', agentId);
  c.set('userId', userId);

  await next();
});

// Schema for notification payload
const notificationSchema = z.object({
  userId: z.string().uuid(),
  agentId: z.string().uuid(),
  type: z.enum(['whale_alert', 'gas_alert', 'airdrop', 'portfolio', 'contract_event', 'custom']),
  priority: z.enum(['low', 'medium', 'high']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
});

/**
 * Send notification from an agent
 * POST /api/internal/send-notification
 */
internalRoutes.post(
  '/send-notification',
  zValidator('json', notificationSchema),
  async (c) => {
    const payload = c.req.valid('json');

    // Validate that the payload matches the authenticated agent
    const agentId = c.get('agentId') as string;
    const userId = c.get('userId') as string;

    if (payload.agentId !== agentId || payload.userId !== userId) {
      throw new HTTPException(403, { message: 'Agent ID mismatch' });
    }

    const result = await notificationService.send({
      userId: payload.userId,
      agentId: payload.agentId,
      type: payload.type as NotificationType,
      priority: payload.priority as NotificationPriority,
      title: payload.title,
      message: payload.message,
      data: payload.data,
    });

    return c.json(result);
  }
);

/**
 * Log agent activity
 * POST /api/internal/log
 */
const logSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

internalRoutes.post(
  '/log',
  zValidator('json', logSchema),
  async (c) => {
    const agentId = c.get('agentId') as string;
    const { level, message, metadata } = c.req.valid('json');

    // Import agent_logs and insert
    const { agentLogs } = await import('@elizagotchi/database');

    await db.insert(agentLogs).values({
      agentId,
      level,
      message,
      metadata: metadata || {},
    });

    return c.json({ success: true });
  }
);

/**
 * Update agent heartbeat
 * POST /api/internal/heartbeat
 */
internalRoutes.post('/heartbeat', async (c) => {
  const agentId = c.get('agentId') as string;

  await db
    .update(agents)
    .set({ lastHeartbeat: new Date() })
    .where(eq(agents.id, agentId));

  return c.json({ success: true });
});

/**
 * Get notification service status
 * GET /api/internal/notification-status
 */
internalRoutes.get('/notification-status', (c) => {
  return c.json(botService.getStatus());
});
