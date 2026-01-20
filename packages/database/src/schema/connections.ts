import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  boolean,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { agents } from './agents';

export const connectionTypeEnum = pgEnum('connection_type', [
  'discord',
  'telegram',
  'github',
  'twitch',
  'twitter',
  'wallet-evm',
  'wallet-solana',
]);

export const connections = pgTable('connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: connectionTypeEnum('type').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  externalId: varchar('external_id', { length: 255 }),
  externalName: varchar('external_name', { length: 255 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Platform agent connections (renamed for ElizaOS compatibility)
export const platformAgentConnections = pgTable('platform_agent_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  connectionId: uuid('connection_id')
    .notNull()
    .references(() => connections.id, { onDelete: 'cascade' }),
  config: jsonb('config').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Backward compatibility alias
export const agentConnections = platformAgentConnections;
