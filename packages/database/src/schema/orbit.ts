import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { platformAgents } from './agents';

// Orbit item types
export const orbitItemTypeEnum = pgEnum('orbit_item_type', [
  'chat',
  'task',
  'monitor',
]);

// Types for JSONB columns
export type OrbitSnapshotData = {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  context?: Record<string, unknown>;
};

export type OrbitTaskConfig = {
  taskType: string;
  params: Record<string, unknown>;
};

export type OrbitTaskSnapshot = {
  results: unknown;
  status: string;
};

// Orbit items table - stores conversations and tasks orbiting around agent planets
export const orbitItems = pgTable('orbit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => platformAgents.id, { onDelete: 'cascade' }),

  // Content
  name: text('name').notNull(), // User-editable title
  type: orbitItemTypeEnum('type').notNull(), // 'chat' | 'task' | 'monitor'

  // For chats: snapshot of conversation
  snapshotData: jsonb('snapshot_data').$type<OrbitSnapshotData>(),

  // For tasks/monitors: reference + snapshot
  taskConfig: jsonb('task_config').$type<OrbitTaskConfig>(),
  taskSnapshot: jsonb('task_snapshot').$type<OrbitTaskSnapshot>(),
  taskSnapshotAt: timestamp('task_snapshot_at'),

  // Room reference for retrieving live chat history
  roomId: uuid('room_id'),

  // Metadata
  isArchived: boolean('is_archived').default(false).notNull(),
  orbitPosition: integer('orbit_position'), // Visual ordering (0-19)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type OrbitItem = typeof orbitItems.$inferSelect;
export type NewOrbitItem = typeof orbitItems.$inferInsert;
