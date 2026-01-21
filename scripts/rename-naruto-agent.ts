/**
 * Script to rename "Naruto Lore Keeper" agent to "Anime Lore Keeper"
 *
 * Usage: bun run scripts/rename-naruto-agent.ts
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Connecting to database...');

  const { Client } = await import('pg');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('Looking for "Naruto Lore Keeper" agents...');

  const result = await client.query(`
    UPDATE agents
    SET
      name = 'Anime Lore Keeper',
      config = '{"universe": "Anime & Manga", "knowledgeBase": "https://myanimelist.net", "spoilerWarnings": true}'::jsonb,
      updated_at = NOW()
    WHERE name = 'Naruto Lore Keeper'
    RETURNING id, name
  `);

  if (result.rowCount === 0) {
    console.log('No agents named "Naruto Lore Keeper" found.');
  } else {
    console.log(`Updated ${result.rowCount} agent(s):`);
    result.rows.forEach((agent: { id: string; name: string }) => {
      console.log(`  - ${agent.id}: renamed to "${agent.name}"`);
    });
  }

  await client.end();
  console.log('Done!');
}

main().catch(console.error);
