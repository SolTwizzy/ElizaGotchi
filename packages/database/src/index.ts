import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Only load dotenv in development (Railway injects env vars directly)
if (process.env.NODE_ENV !== 'production') {
  const { config } = require('dotenv');
  const { resolve } = require('path');
  config({ path: resolve(__dirname, '../../../.env') });
}

export * from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')));
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export type Database = typeof db;
