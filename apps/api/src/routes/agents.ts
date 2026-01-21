import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { db, agents } from '@elizagotchi/database';
import { AGENT_TYPES } from '@elizagotchi/shared';
import { requireAuth } from '../middleware/auth';
import { agentOrchestrator } from '../services/agent-orchestrator';
import type { AuthenticatedContext } from '../types';

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

const chatMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  roomId: z.string().optional(),
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

  // Check agent limit (flat 20 agents per user)
  const MAX_AGENTS = 20;
  const currentAgentCount = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, user.id))
    .then((rows) => rows.length);

  if (currentAgentCount >= MAX_AGENTS) {
    throw new HTTPException(403, {
      message: `Agent limit reached (${MAX_AGENTS} max).`,
    });
  }

  const agentId = crypto.randomUUID();

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

  // Auto-start the agent immediately after creation
  try {
    await agentOrchestrator.startAgent(agentId, user.id);
    // Fetch updated agent with running status
    const updatedAgent = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });
    return c.json({ agent: updatedAgent || agent }, 201);
  } catch (error) {
    // If auto-start fails, still return the created agent (in pending state)
    console.error('Failed to auto-start agent:', error);
    return c.json({ agent }, 201);
  }
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

// Send chat message to agent
agentRoutes.post('/:id/chat', zValidator('json', chatMessageSchema), async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');
  const { content, roomId } = c.req.valid('json');

  // Verify ownership
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
  });

  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }

  // Check agent is running (allow 'starting' too as we may auto-recover)
  if (agent.status !== 'running' && agent.status !== 'starting') {
    throw new HTTPException(400, { message: 'Agent is not running. Start the agent to chat.' });
  }

  // Get runtime, auto-recovering if necessary (handles server restart case)
  const runtime = await agentOrchestrator.ensureAgentRuntime(agentId, user.id);
  if (!runtime) {
    throw new HTTPException(500, { message: 'Agent runtime not available. The agent may have encountered an error. Try restarting the agent.' });
  }

  try {
    // Process message through the runtime
    const response = await runtime.processMessage(content, {
      userId: user.id,
      roomId: roomId || `chat-${user.id}`,
      platform: 'web',
    });

    return c.json({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.content,
      timestamp: response.timestamp.toISOString(),
      metadata: {
        agentId,
        ...response.metadata,
      },
    });
  } catch (error) {
    console.error(`Chat error for agent ${agentId}:`, error);
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Failed to process message',
    });
  }
});

// Get chat history
agentRoutes.get('/:id/chat/history', async (c) => {
  const user = c.get('user');
  const agentId = c.req.param('id');
  const roomId = c.req.query('roomId') || `chat-${user.id}`;
  const limit = parseInt(c.req.query('limit') || '50', 10);

  // Verify ownership
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.userId, user.id)),
  });

  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' });
  }

  // For now, return empty history - ElizaOS memories table integration can be added later
  // This allows the chat to work without requiring ElizaOS memory persistence to be fully configured
  return c.json({
    messages: [],
    hasMore: false,
  });
});
