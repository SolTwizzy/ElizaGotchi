import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db, agents, orbitItems } from '@elizagotchi/database';
import { requireAuth } from '../middleware/auth';
import { agentOrchestrator } from '../services/agent-orchestrator';
import type { AuthenticatedContext } from '../types';

export const orbitRoutes = new Hono<AuthenticatedContext>();

// Require auth for all orbit routes
orbitRoutes.use('*', requireAuth);

// Max visible orbit items before auto-archiving
const MAX_VISIBLE_ORBIT_ITEMS = 15;

// Validation schemas
const createOrbitItemSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['chat', 'task', 'monitor']),
  roomId: z.string().uuid().optional(),
  snapshotData: z
    .object({
      messages: z.array(
        z.object({
          id: z.string(),
          role: z.enum(['user', 'assistant']),
          content: z.string(),
          timestamp: z.string(),
        })
      ),
      context: z.record(z.unknown()).optional(),
    })
    .optional(),
  taskConfig: z
    .object({
      taskType: z.string(),
      params: z.record(z.unknown()),
    })
    .optional(),
});

const updateOrbitItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isArchived: z.boolean().optional(),
});

const suggestNameSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

// Helper to verify agent ownership
async function verifyAgentOwnership(agentId: string, userId: string) {
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }
  return agent;
}

// Helper to auto-archive old items when limit is reached
async function autoArchiveOldItems(agentId: string, userId: string) {
  // Count non-archived items
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orbitItems)
    .where(
      and(
        eq(orbitItems.agentId, agentId),
        eq(orbitItems.userId, userId),
        eq(orbitItems.isArchived, false)
      )
    );

  const count = countResult[0]?.count || 0;

  if (count >= MAX_VISIBLE_ORBIT_ITEMS) {
    // Archive oldest items to make room
    const itemsToArchive = count - MAX_VISIBLE_ORBIT_ITEMS + 1;

    // Get the oldest non-archived items
    const oldestItems = await db
      .select({ id: orbitItems.id })
      .from(orbitItems)
      .where(
        and(
          eq(orbitItems.agentId, agentId),
          eq(orbitItems.userId, userId),
          eq(orbitItems.isArchived, false)
        )
      )
      .orderBy(asc(orbitItems.createdAt))
      .limit(itemsToArchive);

    // Archive them
    for (const item of oldestItems) {
      await db
        .update(orbitItems)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(orbitItems.id, item.id));
    }
  }
}

// Helper to assign orbit position
async function getNextOrbitPosition(agentId: string, userId: string): Promise<number> {
  const maxPositionResult = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(orbit_position), -1)::int` })
    .from(orbitItems)
    .where(
      and(
        eq(orbitItems.agentId, agentId),
        eq(orbitItems.userId, userId),
        eq(orbitItems.isArchived, false)
      )
    );

  const maxPos = maxPositionResult[0]?.maxPos ?? -1;
  return (maxPos + 1) % 20; // Wrap around at 20 positions
}

// POST /api/agents/:agentId/orbit - Create orbit item
orbitRoutes.post('/:agentId/orbit', zValidator('json', createOrbitItemSchema), async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('agentId');
  const body = c.req.valid('json');

  await verifyAgentOwnership(agentId, user.id);

  // Auto-archive old items if needed
  await autoArchiveOldItems(agentId, user.id);

  // Get next orbit position
  const orbitPosition = await getNextOrbitPosition(agentId, user.id);

  const [item] = await db
    .insert(orbitItems)
    .values({
      userId: user.id,
      agentId,
      name: body.name,
      type: body.type,
      roomId: body.roomId,
      snapshotData: body.snapshotData,
      taskConfig: body.taskConfig,
      orbitPosition,
    })
    .returning();

  return c.json({ item }, 201);
});

// GET /api/agents/:agentId/orbit - List orbit items
orbitRoutes.get('/:agentId/orbit', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('agentId');
  const includeArchived = c.req.query('includeArchived') === 'true';

  await verifyAgentOwnership(agentId, user.id);

  const whereConditions = [eq(orbitItems.agentId, agentId), eq(orbitItems.userId, user.id)];

  if (!includeArchived) {
    whereConditions.push(eq(orbitItems.isArchived, false));
  }

  const items = await db
    .select()
    .from(orbitItems)
    .where(and(...whereConditions))
    .orderBy(desc(orbitItems.createdAt));

  return c.json({ items });
});

// GET /api/agents/:agentId/orbit/:itemId - Get single orbit item
orbitRoutes.get('/:agentId/orbit/:itemId', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('agentId');
  const itemId = c.req.param('itemId');

  await verifyAgentOwnership(agentId, user.id);

  const item = await db.query.orbitItems.findFirst({
    where: and(
      eq(orbitItems.id, itemId),
      eq(orbitItems.agentId, agentId),
      eq(orbitItems.userId, user.id)
    ),
  });

  if (!item) {
    throw new HTTPException(404, { message: 'Orbit item not found' });
  }

  return c.json({ item });
});

// GET /api/agents/:agentId/orbit/:itemId/live - Get live task data (not snapshot)
orbitRoutes.get('/:agentId/orbit/:itemId/live', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('agentId');
  const itemId = c.req.param('itemId');

  await verifyAgentOwnership(agentId, user.id);

  const item = await db.query.orbitItems.findFirst({
    where: and(
      eq(orbitItems.id, itemId),
      eq(orbitItems.agentId, agentId),
      eq(orbitItems.userId, user.id)
    ),
  });

  if (!item) {
    throw new HTTPException(404, { message: 'Orbit item not found' });
  }

  if (item.type !== 'task' && item.type !== 'monitor') {
    throw new HTTPException(400, { message: 'Live refresh only available for task/monitor types' });
  }

  // TODO: Implement live task data fetching based on taskConfig
  // For now, return the snapshot with a note that live refresh isn't implemented yet
  return c.json({
    item,
    liveData: null,
    message: 'Live refresh not yet implemented for this task type',
  });
});

// PATCH /api/agents/:agentId/orbit/:itemId - Update orbit item
orbitRoutes.patch(
  '/:agentId/orbit/:itemId',
  zValidator('json', updateOrbitItemSchema),
  async (c) => {
    const user = c.get('user');
    const agentId = c.req.param('agentId');
    const itemId = c.req.param('itemId');
    const body = c.req.valid('json');

    await verifyAgentOwnership(agentId, user.id);

    const existingItem = await db.query.orbitItems.findFirst({
      where: and(
        eq(orbitItems.id, itemId),
        eq(orbitItems.agentId, agentId),
        eq(orbitItems.userId, user.id)
      ),
    });

    if (!existingItem) {
      throw new HTTPException(404, { message: 'Orbit item not found' });
    }

    const [updatedItem] = await db
      .update(orbitItems)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(orbitItems.id, itemId))
      .returning();

    return c.json({ item: updatedItem });
  }
);

// DELETE /api/agents/:agentId/orbit/:itemId - Delete orbit item
orbitRoutes.delete('/:agentId/orbit/:itemId', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('agentId');
  const itemId = c.req.param('itemId');

  await verifyAgentOwnership(agentId, user.id);

  const existingItem = await db.query.orbitItems.findFirst({
    where: and(
      eq(orbitItems.id, itemId),
      eq(orbitItems.agentId, agentId),
      eq(orbitItems.userId, user.id)
    ),
  });

  if (!existingItem) {
    throw new HTTPException(404, { message: 'Orbit item not found' });
  }

  await db.delete(orbitItems).where(eq(orbitItems.id, itemId));

  return c.json({ success: true });
});

// POST /api/agents/:agentId/orbit/suggest-name - AI-generated name suggestion
orbitRoutes.post(
  '/:agentId/orbit/suggest-name',
  zValidator('json', suggestNameSchema),
  async (c) => {
    const user = c.get('user');
    const agentId = c.req.param('agentId');
    const { messages } = c.req.valid('json');

    const agent = await verifyAgentOwnership(agentId, user.id);

    // Try to get the agent runtime for AI-powered name suggestion
    const runtime = await agentOrchestrator.ensureAgentRuntime(agentId, user.id);

    if (runtime) {
      try {
        // Create a summarization prompt
        const conversationText = messages
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');

        const prompt = `Summarize this conversation in exactly 3-5 words as a catchy title. Only respond with the title, nothing else:\n\n${conversationText}`;

        const response = await runtime.processMessage(prompt, {
          userId: user.id,
          roomId: `name-suggestion-${Date.now()}`,
          platform: 'system',
        });

        // Clean up the response - take first line, remove quotes, trim
        let suggestedName = response.content
          .split('\n')[0]
          .replace(/^["']|["']$/g, '')
          .trim();

        // Ensure it's not too long
        if (suggestedName.length > 50) {
          suggestedName = suggestedName.substring(0, 47) + '...';
        }

        return c.json({ suggestedName });
      } catch (error) {
        console.error('AI name suggestion failed:', error);
        // Fall through to fallback
      }
    }

    // Fallback: Simple name generation based on first user message
    const firstUserMessage = messages.find((m) => m.role === 'user');
    let suggestedName = 'Chat Session';

    if (firstUserMessage) {
      const words = firstUserMessage.content.split(/\s+/).slice(0, 5);
      suggestedName = words.join(' ');
      if (suggestedName.length > 30) {
        suggestedName = suggestedName.substring(0, 27) + '...';
      }
    }

    return c.json({ suggestedName });
  }
);
