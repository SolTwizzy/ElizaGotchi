import { relations } from 'drizzle-orm';

// Export all tables
export * from './users';
export * from './agents';
export * from './connections';
export * from './subscriptions';
export * from './orbit';

// Import tables for relations
import { users, sessions, oauthAccounts } from './users';
import { agents, agentLogs } from './agents';
import { connections, agentConnections } from './connections';
import { subscriptions } from './subscriptions';
import { orbitItems } from './orbit';

// Define all relations in one place to avoid circular dependencies
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  agents: many(agents),
  connections: many(connections),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  orbitItems: many(orbitItems),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  logs: many(agentLogs),
  agentConnections: many(agentConnections),
  orbitItems: many(orbitItems),
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  agent: one(agents, {
    fields: [agentLogs.agentId],
    references: [agents.id],
  }),
}));

export const connectionsRelations = relations(connections, ({ one, many }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
  agentConnections: many(agentConnections),
}));

export const agentConnectionsRelations = relations(agentConnections, ({ one }) => ({
  agent: one(agents, {
    fields: [agentConnections.agentId],
    references: [agents.id],
  }),
  connection: one(connections, {
    fields: [agentConnections.connectionId],
    references: [connections.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const orbitItemsRelations = relations(orbitItems, ({ one }) => ({
  user: one(users, {
    fields: [orbitItems.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [orbitItems.agentId],
    references: [agents.id],
  }),
}));
