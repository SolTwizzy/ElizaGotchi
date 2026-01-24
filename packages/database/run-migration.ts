import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env from root
config({ path: resolve(__dirname, '../../.env') });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    console.log('Running orbit_items migration...');

    const migrationPath = resolve(__dirname, 'drizzle/0006_create_orbit_items.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and run each statement
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log('Executing:', statement.slice(0, 60) + '...');
      await sql.unsafe(statement);
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
