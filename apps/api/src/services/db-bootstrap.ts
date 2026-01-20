/**
 * Database bootstrap service
 * Ensures database schema is up to date, including enum values
 */
import postgres from 'postgres';

const expectedEnumValues = [
  'community-manager',
  'portfolio-tracker',
  'whale-watcher',
  'airdrop-hunter',
  'gas-monitor',
  'treasury-watcher',
  'contract-monitor',
  'market-scanner',
  'trend-spotter',
  'reading-list-manager',
  'github-issue-triager',
  'devops-monitor',
  'api-helper',
  'bug-reporter',
  'changelog-writer',
  'lore-keeper',
  'stream-assistant',
];

export async function bootstrapDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[DB Bootstrap] DATABASE_URL not set, skipping bootstrap');
    return;
  }

  const sql = postgres(connectionString);

  try {
    console.log('[DB Bootstrap] Checking agent type enum values...');

    // Get current enum values
    const enums = await sql`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('agent_type', 'platform_agent_type')
      ORDER BY t.typname, e.enumsortorder
    `;

    // Group by type name
    const enumsByType: Record<string, string[]> = {};
    for (const row of enums) {
      if (!enumsByType[row.typname]) {
        enumsByType[row.typname] = [];
      }
      enumsByType[row.typname].push(row.enumlabel);
    }

    // Determine which enum type exists
    const enumTypeName = enumsByType['platform_agent_type']
      ? 'platform_agent_type'
      : 'agent_type';
    const currentValues = enumsByType[enumTypeName] || [];

    // Find missing values
    const missingValues = expectedEnumValues.filter(
      (v) => !currentValues.includes(v)
    );

    if (missingValues.length === 0) {
      console.log('[DB Bootstrap] All enum values present');
      await sql.end();
      return;
    }

    console.log(
      `[DB Bootstrap] Adding ${missingValues.length} missing enum values: ${missingValues.join(', ')}`
    );

    // Add missing values
    for (const value of missingValues) {
      try {
        await sql.unsafe(
          `ALTER TYPE ${enumTypeName} ADD VALUE IF NOT EXISTS '${value}'`
        );
        console.log(`[DB Bootstrap] Added: ${value}`);
      } catch (error) {
        console.error(`[DB Bootstrap] Failed to add ${value}:`, error);
      }
    }

    console.log('[DB Bootstrap] Complete');
  } catch (error) {
    console.error('[DB Bootstrap] Error:', error);
  } finally {
    await sql.end();
  }
}
