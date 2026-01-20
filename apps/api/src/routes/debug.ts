/**
 * Debug routes - for troubleshooting production issues
 * Protected by a simple token check
 */
import { Hono } from 'hono';
import postgres from 'postgres';

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
