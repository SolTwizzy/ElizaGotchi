/**
 * ElizaOS Migration Runner
 *
 * Pre-runs ElizaOS database migrations ONCE at server startup.
 * This prevents multiple agents from competing for migration locks
 * which causes the 30-second timeout errors.
 *
 * After this runs, each agent's SQL plugin will see "no changes needed"
 * and complete quickly instead of waiting for locks.
 */

import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

class ElizaMigrationRunner {
  private hasRun = false;
  private runPromise: Promise<void> | null = null;
  private cleanupDone = false;

  /**
   * Run before migrations to clean orphaned FK references.
   * This prevents "FK constraint violation" errors when plugin-sql
   * tries to add foreign key constraints on tables with orphaned data.
   */
  async runPreCleanup(): Promise<void> {
    if (this.cleanupDone) {
      console.log('[ElizaMigrations] Cleanup already complete, skipping');
      return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn('[ElizaMigrations] DATABASE_URL not set, skipping cleanup');
      return;
    }

    console.log('[ElizaMigrations] Running pre-cleanup for orphaned data...');

    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
    });
    const db = drizzle(client);

    try {
      // Check if entities table exists
      const entitiesCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'entities'
        ) as exists
      `);

      const entitiesExists = entitiesCheck[0]?.exists === true;

      // If entities doesn't exist but dependent tables do, clear all their data
      // since it's all orphaned by definition
      if (!entitiesExists) {
        console.log('[ElizaMigrations] Entities table does not exist - clearing orphaned dependent tables');

        // Clear participants with entity_id (all orphaned since entities doesn't exist)
        try {
          await db.execute(sql`DELETE FROM participants WHERE entity_id IS NOT NULL`);
          console.log('[ElizaMigrations] Cleared all participants with entity_id');
        } catch (e) {
          console.log('[ElizaMigrations] Participants clear skipped:', (e as Error).message?.slice(0, 100));
        }

        // Clear memories with entity_id or agent_id
        try {
          await db.execute(sql`DELETE FROM memories WHERE entity_id IS NOT NULL OR agent_id IS NOT NULL`);
          console.log('[ElizaMigrations] Cleared all memories with entity references');
        } catch (e) {
          console.log('[ElizaMigrations] Memories clear skipped:', (e as Error).message?.slice(0, 100));
        }

        // Clear logs with entity_id
        try {
          await db.execute(sql`DELETE FROM logs WHERE entity_id IS NOT NULL`);
          console.log('[ElizaMigrations] Cleared all logs with entity_id');
        } catch (e) {
          console.log('[ElizaMigrations] Logs clear skipped:', (e as Error).message?.slice(0, 100));
        }

        // Clear relationships
        try {
          await db.execute(sql`DELETE FROM relationships WHERE source_entity_id IS NOT NULL OR target_entity_id IS NOT NULL`);
          console.log('[ElizaMigrations] Cleared all relationships');
        } catch (e) {
          console.log('[ElizaMigrations] Relationships clear skipped:', (e as Error).message?.slice(0, 100));
        }

        // Clear cache with agent_id
        try {
          await db.execute(sql`DELETE FROM cache WHERE agent_id IS NOT NULL`);
          console.log('[ElizaMigrations] Cleared all cache with agent_id');
        } catch (e) {
          console.log('[ElizaMigrations] Cache clear skipped:', (e as Error).message?.slice(0, 100));
        }

        this.cleanupDone = true;
        console.log('[ElizaMigrations] Pre-cleanup complete (entities missing case)');
        return;
      }

      // Check if rooms table exists
      const roomsCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'rooms'
        ) as exists
      `);
      const roomsExists = roomsCheck[0]?.exists === true;

      // Clean orphaned participants (entity_id -> entities.id, room_id -> rooms.id)
      try {
        await db.execute(sql`
          DELETE FROM participants
          WHERE entity_id IS NOT NULL
          AND entity_id NOT IN (SELECT id FROM entities)
        `);
        if (roomsExists) {
          await db.execute(sql`
            DELETE FROM participants
            WHERE room_id IS NOT NULL
            AND room_id NOT IN (SELECT id FROM rooms)
          `);
        }
        console.log('[ElizaMigrations] Cleaned orphaned participants');
      } catch (e) {
        console.log('[ElizaMigrations] Participants cleanup skipped:', (e as Error).message?.slice(0, 100));
      }

      // Clean orphaned memories (entity_id -> entities.id, room_id -> rooms.id, agent_id -> entities.id)
      try {
        await db.execute(sql`
          DELETE FROM memories
          WHERE entity_id IS NOT NULL
          AND entity_id NOT IN (SELECT id FROM entities)
        `);
        await db.execute(sql`
          DELETE FROM memories
          WHERE agent_id IS NOT NULL
          AND agent_id NOT IN (SELECT id FROM entities)
        `);
        if (roomsExists) {
          await db.execute(sql`
            DELETE FROM memories
            WHERE room_id IS NOT NULL
            AND room_id NOT IN (SELECT id FROM rooms)
          `);
        }
        console.log('[ElizaMigrations] Cleaned orphaned memories');
      } catch (e) {
        console.log('[ElizaMigrations] Memories cleanup skipped:', (e as Error).message?.slice(0, 100));
      }

      // Clean orphaned logs (entity_id -> entities.id, room_id -> rooms.id)
      try {
        await db.execute(sql`
          DELETE FROM logs
          WHERE entity_id IS NOT NULL
          AND entity_id NOT IN (SELECT id FROM entities)
        `);
        if (roomsExists) {
          await db.execute(sql`
            DELETE FROM logs
            WHERE room_id IS NOT NULL
            AND room_id NOT IN (SELECT id FROM rooms)
          `);
        }
        console.log('[ElizaMigrations] Cleaned orphaned logs');
      } catch (e) {
        console.log('[ElizaMigrations] Logs cleanup skipped:', (e as Error).message?.slice(0, 100));
      }

      // Clean orphaned relationships (source_entity_id, target_entity_id -> entities.id)
      try {
        await db.execute(sql`
          DELETE FROM relationships
          WHERE source_entity_id IS NOT NULL
          AND source_entity_id NOT IN (SELECT id FROM entities)
        `);
        await db.execute(sql`
          DELETE FROM relationships
          WHERE target_entity_id IS NOT NULL
          AND target_entity_id NOT IN (SELECT id FROM entities)
        `);
        console.log('[ElizaMigrations] Cleaned orphaned relationships');
      } catch (e) {
        console.log('[ElizaMigrations] Relationships cleanup skipped:', (e as Error).message?.slice(0, 100));
      }

      // Clean orphaned cache entries (agent_id -> entities.id)
      try {
        await db.execute(sql`
          DELETE FROM cache
          WHERE agent_id IS NOT NULL
          AND agent_id NOT IN (SELECT id FROM entities)
        `);
        console.log('[ElizaMigrations] Cleaned orphaned cache');
      } catch (e) {
        console.log('[ElizaMigrations] Cache cleanup skipped:', (e as Error).message?.slice(0, 100));
      }

      this.cleanupDone = true;
      console.log('[ElizaMigrations] Pre-cleanup complete');
    } catch (error) {
      console.warn('[ElizaMigrations] Cleanup warning:', error);
      // Don't throw - let migrations attempt to run
      this.cleanupDone = true;
    } finally {
      await client.end();
    }
  }

  /**
   * Run ElizaOS migrations once before any agents start.
   * Safe to call multiple times - only runs once.
   */
  async runMigrations(): Promise<void> {
    if (this.hasRun) {
      console.log('[ElizaMigrations] Already complete, skipping');
      return;
    }

    if (this.runPromise) {
      console.log('[ElizaMigrations] Already in progress, waiting...');
      return this.runPromise;
    }

    this.runPromise = this._doRunMigrations();
    await this.runPromise;
  }

  private async _doRunMigrations(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn('[ElizaMigrations] DATABASE_URL not set, skipping');
      this.hasRun = true;
      return;
    }

    console.log('[ElizaMigrations] Pre-running ElizaOS migrations...');

    let client: ReturnType<typeof postgres> | null = null;

    try {
      client = postgres(databaseUrl, {
        max: 1,
        idle_timeout: 10,
        connect_timeout: 10,
      });
      const db = drizzle(client);

      // Create the migrations schema used by @elizaos/plugin-sql
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS migrations`);

      // Create migration tracking tables
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS migrations._migrations (
          id SERIAL PRIMARY KEY,
          plugin_name TEXT NOT NULL,
          hash TEXT NOT NULL,
          created_at BIGINT NOT NULL
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS migrations._journal (
          id SERIAL PRIMARY KEY,
          plugin_name TEXT NOT NULL UNIQUE,
          version TEXT NOT NULL,
          dialect TEXT NOT NULL,
          entries JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS migrations._snapshots (
          id SERIAL PRIMARY KEY,
          plugin_name TEXT NOT NULL,
          idx INTEGER NOT NULL,
          snapshot JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(plugin_name, idx)
        )
      `);

      this.hasRun = true;
      console.log('[ElizaMigrations] Migration tracking tables ready');
    } catch (error) {
      console.error('[ElizaMigrations] Migration error:', error);
      this.hasRun = true; // Mark as run so we don't retry
    } finally {
      if (client) {
        await client.end().catch(() => {});
      }
    }
  }
}

export const elizaMigrations = new ElizaMigrationRunner();
