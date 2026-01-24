/**
 * Debug routes - for troubleshooting production issues
 * Protected by a simple token check
 */
import { Hono } from 'hono';
import postgres from 'postgres';
import { agentOrchestrator } from '../services/agent-orchestrator';
import { elizaMigrations } from '../services/eliza-migrations';

export const debugRoutes = new Hono();

// Simple token check - not meant to be super secure, just prevent random access
const DEBUG_TOKEN = process.env.DEBUG_TOKEN || 'elizagotchi-debug-2024';

debugRoutes.use('*', async (c, next) => {
  const token = c.req.header('X-Debug-Token');
  if (token !== DEBUG_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// Get enum values from the database
debugRoutes.get('/enum-values', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    const enums = await sql`
      SELECT t.typname, e.enumlabel, e.enumsortorder
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('agent_type', 'platform_agent_type')
      ORDER BY t.typname, e.enumsortorder
    `;

    const enumsByType: Record<string, string[]> = {};
    for (const row of enums) {
      if (!enumsByType[row.typname]) {
        enumsByType[row.typname] = [];
      }
      enumsByType[row.typname].push(row.enumlabel);
    }

    await sql.end();

    return c.json({
      enums: enumsByType,
      hasLoreKeeper: enumsByType['platform_agent_type']?.includes('lore-keeper') ||
                     enumsByType['agent_type']?.includes('lore-keeper'),
      hasBugReporter: enumsByType['platform_agent_type']?.includes('bug-reporter') ||
                      enumsByType['agent_type']?.includes('bug-reporter'),
      hasChangelogWriter: enumsByType['platform_agent_type']?.includes('changelog-writer') ||
                          enumsByType['agent_type']?.includes('changelog-writer'),
    });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// Test inserting a specific agent type
debugRoutes.post('/test-insert', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const body = await c.req.json();
  const agentType = body.type as string;

  const sql = postgres(connectionString);

  try {
    // Try to insert a test record and immediately delete it
    const result = await sql`
      INSERT INTO platform_agents (user_id, name, type, config)
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'test-agent',
        ${agentType}::platform_agent_type,
        '{}'::jsonb
      )
      RETURNING id
    `.catch(async (e) => {
      // Try with agent_type enum instead
      return sql`
        INSERT INTO agents (user_id, name, type, config)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          'test-agent',
          ${agentType}::agent_type,
          '{}'::jsonb
        )
        RETURNING id
      `;
    });

    // Delete the test record
    if (result[0]?.id) {
      await sql`DELETE FROM platform_agents WHERE id = ${result[0].id}`.catch(() =>
        sql`DELETE FROM agents WHERE id = ${result[0].id}`
      );
    }

    await sql.end();
    return c.json({ success: true, message: `Type ${agentType} is valid` });
  } catch (error) {
    await sql.end();
    return c.json({
      success: false,
      error: String(error),
      type: agentType,
    }, 400);
  }
});

// Reset all agent statuses to stopped (for stale data after restart)
debugRoutes.post('/reset-agents', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    const result = await sql`
      UPDATE platform_agents
      SET status = 'stopped'
      WHERE status IN ('running', 'starting')
      RETURNING id, name
    `;

    await sql.end();

    return c.json({
      success: true,
      reset: result.length,
      agents: result.map(a => ({ id: a.id, name: a.name })),
    });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// List all agents
debugRoutes.get('/agents', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    const agents = await sql`
      SELECT id, name, type, status, user_id, created_at
      FROM platform_agents
      ORDER BY created_at DESC
    `;

    await sql.end();

    const runningCount = agents.filter(a => a.status === 'running').length;

    return c.json({
      total: agents.length,
      running: runningCount,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        userId: a.user_id,
      })),
    });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// Start a specific agent
debugRoutes.post('/agents/:id/start', async (c) => {
  const agentId = c.req.param('id');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    // Get agent details
    const agents = await sql`
      SELECT id, user_id FROM platform_agents WHERE id = ${agentId}
    `;

    if (agents.length === 0) {
      await sql.end();
      return c.json({ error: 'Agent not found' }, 404);
    }

    const agent = agents[0];
    await sql.end();

    // Start the agent
    await agentOrchestrator.startAgent(agent.id, agent.user_id);

    return c.json({ success: true, message: `Agent ${agentId} started` });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// Start all agents for a user
debugRoutes.post('/agents/start-all', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    // Get all agents that are not running
    const agents = await sql`
      SELECT id, name, user_id FROM platform_agents WHERE status != 'running'
    `;

    await sql.end();

    if (agents.length === 0) {
      return c.json({ success: true, message: 'All agents already running', started: 0 });
    }

    // Start agents sequentially with delay
    const results: { id: string; name: string; success: boolean; error?: string }[] = [];

    for (const agent of agents) {
      try {
        await agentOrchestrator.startAgent(agent.id, agent.user_id);
        results.push({ id: agent.id, name: agent.name, success: true });
        console.log(`[Debug] Started agent ${agent.name}`);
        // Small delay between starts
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        results.push({
          id: agent.id,
          name: agent.name,
          success: false,
          error: String(error),
        });
        console.error(`[Debug] Failed to start agent ${agent.name}:`, error);
      }
    }

    return c.json({
      success: true,
      started: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// Get runtime status (what's actually in memory)
debugRoutes.get('/runtime-status', async (c) => {
  const runtimeInfo = agentOrchestrator.getRunningAgentsInfo();
  return c.json({
    useElizaOS: process.env.USE_ELIZAOS,
    runtimeMode: process.env.USE_ELIZAOS !== 'false' ? 'ElizaOS' : 'Custom',
    inMemoryAgents: runtimeInfo,
    timestamp: new Date().toISOString(),
  });
});

// Chat with an agent (for testing)
debugRoutes.post('/agents/:id/chat', async (c) => {
  const agentId = c.req.param('id');
  const body = await c.req.json();
  const message = body.message as string;

  if (!message) {
    return c.json({ error: 'Message required' }, 400);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  let sql: ReturnType<typeof postgres> | null = null;

  try {
    sql = postgres(connectionString);

    // Get agent details
    const agents = await sql`
      SELECT id, user_id, status FROM platform_agents WHERE id = ${agentId}
    `;

    if (agents.length === 0) {
      await sql.end();
      return c.json({ error: 'Agent not found' }, 404);
    }

    const agent = agents[0];
    await sql.end();
    sql = null;

    if (agent.status !== 'running') {
      return c.json({ error: 'Agent is not running', status: agent.status }, 400);
    }

    console.log(`[Debug Chat] Getting runtime for agent ${agentId}`);

    // Get runtime and send message
    const runtime = await agentOrchestrator.ensureAgentRuntime(agent.id, agent.user_id);
    if (!runtime) {
      return c.json({ error: 'Agent runtime not available - could not ensure runtime' }, 500);
    }

    console.log(`[Debug Chat] Sending message to agent ${agentId}: "${message.substring(0, 50)}..."`);

    const response = await runtime.processMessage(message, {
      userId: agent.user_id,
      platform: 'debug',
    });

    console.log(`[Debug Chat] Got response from agent ${agentId}: "${response.content.substring(0, 50)}..."`);

    return c.json({
      success: true,
      response: response.content,
      timestamp: response.timestamp.toISOString(),
    });
  } catch (error) {
    console.error(`[Debug Chat] Error for agent ${agentId}:`, error);
    if (sql) {
      await sql.end().catch(() => {});
    }
    return c.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

// Manually run FK cleanup and show orphan counts
debugRoutes.post('/cleanup-orphans', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    // Count orphans before cleanup
    const beforeCounts: Record<string, number> = {};

    // Check entities table exists
    const entitiesCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'entities'
      ) as exists
    `;

    if (!entitiesCheck[0]?.exists) {
      // Entities doesn't exist - clear all orphaned data from dependent tables
      console.log('[Debug Cleanup] Entities does not exist - clearing orphaned data');

      const cleared: Record<string, string> = {};

      try {
        await sql`DELETE FROM participants WHERE entity_id IS NOT NULL`;
        cleared.participants = 'cleared';
      } catch (e) { cleared.participants = `error: ${e}`; }

      try {
        await sql`DELETE FROM memories WHERE entity_id IS NOT NULL OR agent_id IS NOT NULL`;
        cleared.memories = 'cleared';
      } catch (e) { cleared.memories = `error: ${e}`; }

      try {
        await sql`DELETE FROM logs WHERE entity_id IS NOT NULL`;
        cleared.logs = 'cleared';
      } catch (e) { cleared.logs = `error: ${e}`; }

      try {
        await sql`DELETE FROM relationships WHERE source_entity_id IS NOT NULL OR target_entity_id IS NOT NULL`;
        cleared.relationships = 'cleared';
      } catch (e) { cleared.relationships = `error: ${e}`; }

      try {
        await sql`DELETE FROM cache WHERE agent_id IS NOT NULL`;
        cleared.cache = 'cleared';
      } catch (e) { cleared.cache = `error: ${e}`; }

      await sql.end();
      return c.json({
        message: 'Entities table does not exist - cleared orphaned data',
        cleared,
        note: 'Try starting agent again',
      });
    }

    // Count orphaned participants
    try {
      const orphanedParticipants = await sql`
        SELECT COUNT(*) as count FROM participants
        WHERE entity_id IS NOT NULL
        AND entity_id NOT IN (SELECT id FROM entities)
      `;
      beforeCounts.participants_entity = Number(orphanedParticipants[0]?.count || 0);
    } catch { beforeCounts.participants_entity = -1; }

    // Count orphaned memories by entity_id
    try {
      const orphanedMemories = await sql`
        SELECT COUNT(*) as count FROM memories
        WHERE entity_id IS NOT NULL
        AND entity_id NOT IN (SELECT id FROM entities)
      `;
      beforeCounts.memories_entity = Number(orphanedMemories[0]?.count || 0);
    } catch { beforeCounts.memories_entity = -1; }

    // Count orphaned memories by agent_id
    try {
      const orphanedMemoriesAgent = await sql`
        SELECT COUNT(*) as count FROM memories
        WHERE agent_id IS NOT NULL
        AND agent_id NOT IN (SELECT id FROM entities)
      `;
      beforeCounts.memories_agent = Number(orphanedMemoriesAgent[0]?.count || 0);
    } catch { beforeCounts.memories_agent = -1; }

    await sql.end();

    // Force reset the cleanup flag and run
    (elizaMigrations as any).cleanupDone = false;
    await elizaMigrations.runPreCleanup();

    return c.json({
      success: true,
      orphanCountsBefore: beforeCounts,
      message: 'Cleanup completed - try starting agent again',
    });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// Check if specific entity/room exists
debugRoutes.get('/check-entity/:id', async (c) => {
  const entityId = c.req.param('id');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    const entities = await sql`SELECT id, agent_id, names, metadata FROM entities WHERE id = ${entityId}`;
    const rooms = await sql`SELECT id, name, source FROM rooms LIMIT 5`;
    await sql.end();

    return c.json({
      entityExists: entities.length > 0,
      entity: entities[0] || null,
      sampleRooms: rooms,
    });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error) }, 500);
  }
});

// Check current orphan counts
debugRoutes.get('/orphan-counts', async (c) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);
  const counts: Record<string, number | string> = {};

  try {
    // Check tables exist
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('entities', 'rooms', 'participants', 'memories', 'logs', 'relationships', 'cache')
    `;
    counts.tables_found = tables.map(t => t.table_name).join(', ');

    const hasEntities = tables.some(t => t.table_name === 'entities');
    const hasRooms = tables.some(t => t.table_name === 'rooms');

    if (!hasEntities) {
      await sql.end();
      return c.json({ message: 'Entities table does not exist', counts });
    }

    // Count orphaned participants by entity_id
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM participants
        WHERE entity_id IS NOT NULL AND entity_id NOT IN (SELECT id FROM entities)
      `;
      counts.participants_orphaned_entity = Number(result[0]?.count || 0);
    } catch (e) { counts.participants_orphaned_entity = `error: ${e}`; }

    // Count orphaned participants by room_id
    if (hasRooms) {
      try {
        const result = await sql`
          SELECT COUNT(*) as count FROM participants
          WHERE room_id IS NOT NULL AND room_id NOT IN (SELECT id FROM rooms)
        `;
        counts.participants_orphaned_room = Number(result[0]?.count || 0);
      } catch (e) { counts.participants_orphaned_room = `error: ${e}`; }
    }

    // Count orphaned memories by entity_id
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM memories
        WHERE entity_id IS NOT NULL AND entity_id NOT IN (SELECT id FROM entities)
      `;
      counts.memories_orphaned_entity = Number(result[0]?.count || 0);
    } catch (e) { counts.memories_orphaned_entity = `error: ${e}`; }

    // Count orphaned memories by agent_id
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM memories
        WHERE agent_id IS NOT NULL AND agent_id NOT IN (SELECT id FROM entities)
      `;
      counts.memories_orphaned_agent = Number(result[0]?.count || 0);
    } catch (e) { counts.memories_orphaned_agent = `error: ${e}`; }

    await sql.end();
    return c.json({ counts });
  } catch (error) {
    await sql.end();
    return c.json({ error: String(error), counts }, 500);
  }
});

// Restart an agent (stop then start)
debugRoutes.post('/agents/:id/restart', async (c) => {
  const agentId = c.req.param('id');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return c.json({ error: 'DATABASE_URL not set' }, 500);
  }

  const sql = postgres(connectionString);

  try {
    // Get agent details
    const agents = await sql`
      SELECT id, user_id, status FROM platform_agents WHERE id = ${agentId}
    `;

    if (agents.length === 0) {
      await sql.end();
      return c.json({ error: 'Agent not found' }, 404);
    }

    const agent = agents[0];
    await sql.end();

    console.log(`[Debug Restart] Restarting agent ${agentId}, current status: ${agent.status}`);

    // Stop the agent first (if running)
    try {
      await agentOrchestrator.stopAgent(agent.id, agent.user_id);
      console.log(`[Debug Restart] Agent ${agentId} stopped`);
    } catch (stopError) {
      console.log(`[Debug Restart] Stop error (may be expected):`, stopError);
    }

    // Small delay between stop and start
    await new Promise(r => setTimeout(r, 500));

    // Start the agent
    await agentOrchestrator.startAgent(agent.id, agent.user_id);
    console.log(`[Debug Restart] Agent ${agentId} started`);

    return c.json({ success: true, message: `Agent ${agentId} restarted` });
  } catch (error) {
    console.error(`[Debug Restart] Error restarting agent ${agentId}:`, error);
    return c.json({ error: String(error) }, 500);
  }
});
