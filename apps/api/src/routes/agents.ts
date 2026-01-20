import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { db, agents } from '@elizagotchi/database';
import { AGENT_TYPES, PLANS } from '@elizagotchi/shared';
import { requireAuth } from '../middleware/auth';
import { agentOrchestrator } from '../services/agent-orchestrator';
import type { AuthenticatedContext } from '../types';
import { generateId } from 'lucia';

export const agentRoutes = new Hono<AuthenticatedContext>();

// Require auth for all agent routes
agentRoutes.use('*', requireAuth);

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(Object.keys(AGENT_TYPES) as [string, ...string[]]),
  config: z.record(z.unknown()).optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
});

// List user's agents
agentRoutes.get('/', async (c) => {
  const user = c.get('user');

  const userAgents = await db.query.agents.findMany({
    where: eq(agents.userId, user.id),
    orderBy: [desc(agents.createdAt)],
  });

  return c.json({ agents: userAgents });
});

// Get agent types
agentRoutes.get('/types', async (c) => {
  return c.json({ types: AGENT_TYPES });
});

// Get single agent
agentRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
  });

  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }

  return c.json({ agent });
});

// Create agent
agentRoutes.post('/', zValidator('json', createAgentSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  // Check agent limit based on plan
  const userPlan = (user as { plan?: string }).plan || 'free';
  const plan = PLANS[userPlan as keyof typeof PLANS] || PLANS.free;
  const currentAgentCount = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, user.id))
    .then((rows) => rows.length);

  if (currentAgentCount >= plan.maxAgents) {
    throw new HTTPException(403, {
      message: `Agent limit reached. Your ${userPlan} plan allows ${plan.maxAgents} agents.`,
    });
  }

  const agentId = generateId(15);

  const [agent] = await db
    .insert(agents)
    .values({
      id: agentId,
      userId: user.id,
      name: body.name,
      type: body.type as keyof typeof AGENT_TYPES,
      config: body.config || {},
      status: 'pending',
    })
    .returning();

  return c.json({ agent }, 201);
});

// Update agent
agentRoutes.patch('/:id', zValidator('json', updateAgentSchema), async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');
  const body = c.req.valid('json');

  const existingAgent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
  });

  if (!existingAgent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }

  // Cannot update while running
  if (existingAgent.status === 'running') {
    throw new HTTPException(400, {
      message: 'Cannot update a running agent. Stop it first.',
    });
  }

  const [updatedAgent] = await db
    .update(agents)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(agents.id, agentId), eq(agents.userId, user.id)))
    .returning();

  return c.json({ agent: updatedAgent });
});

// Delete agent
agentRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
  });

  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }

  // Stop if running
  if (agent.status === 'running' || agent.status === 'paused') {
    await agentOrchestrator.stopAgent(agentId, user.id);
  }

  await db.delete(agents).where(eq(agents.id, agentId));

  return c.json({ success: true });
});

// Start agent
agentRoutes.post('/:id/start', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  try {
    await agentOrchestrator.startAgent(agentId, user.id);
    return c.json({ success: true, status: 'running' });
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : 'Failed to start agent',
    });
  }
});

// Stop agent
agentRoutes.post('/:id/stop', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  try {
    await agentOrchestrator.stopAgent(agentId, user.id);
    return c.json({ success: true, status: 'stopped' });
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : 'Failed to stop agent',
    });
  }
});

// Pause agent
agentRoutes.post('/:id/pause', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  try {
    await agentOrchestrator.pauseAgent(agentId, user.id);
    return c.json({ success: true, status: 'paused' });
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : 'Failed to pause agent',
    });
  }
});

// Resume agent
agentRoutes.post('/:id/resume', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  try {
    await agentOrchestrator.resumeAgent(agentId, user.id);
    return c.json({ success: true, status: 'running' });
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : 'Failed to resume agent',
    });
  }
});

// Restart agent
agentRoutes.post('/:id/restart', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  try {
    await agentOrchestrator.restartAgent(agentId, user.id);
    return c.json({ success: true, status: 'running' });
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : 'Failed to restart agent',
    });
  }
});

// Get agent logs
agentRoutes.get('/:id/logs', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  try {
    const logs = await agentOrchestrator.getAgentLogs(agentId, user.id, limit, offset);
    return c.json({ logs });
  } catch (error) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }
});

// Get agent status
agentRoutes.get('/:id/status', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');

  // Verify ownership
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
    columns: { status: true },
  });

  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }

  return c.json({ status: agent.status });
});
