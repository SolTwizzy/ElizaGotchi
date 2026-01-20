import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  text,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// Renamed to platform_* to avoid conflict with ElizaOS 'agents' table
export const platformAgentTypeEnum = pgEnum('platform_agent_type', [
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
]);

export const platformAgentStatusEnum = pgEnum('platform_agent_status', [
  'pending',
  'configuring',
  'starting',
  'running',
  'paused',
  'error',
  'stopped',
]);

// Backward compatibility aliases
export const agentTypeEnum = platformAgentTypeEnum;
export const agentStatusEnum = platformAgentStatusEnum;

export type AgentCustomization = {
  name?: string;
  personality?: string;
  rules?: string[];
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
};

// Platform agents table (renamed from 'agents' to avoid ElizaOS conflict)
export const platformAgents = pgTable('platform_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: platformAgentTypeEnum('type').notNull(),
  status: platformAgentStatusEnum('status').default('pending').notNull(),
  customization: jsonb('customization').$type<AgentCustomization>(),
  config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  containerId: varchar('container_id', { length: 100 }),
  lastHeartbeat: timestamp('last_heartbeat'),
  errorMessage: text('error_message'),
  messagesThisMonth: integer('messages_this_month').default(0),
  messagesTotal: integer('messages_total').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Platform agent logs table
export const platformAgentLogs = pgTable('platform_agent_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => platformAgents.id, { onDelete: 'cascade' }),
  level: varchar('level', { length: 20 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Backward compatibility aliases
export const agents = platformAgents;
export const agentLogs = platformAgentLogs;
