export type ConnectionType =
  | 'discord'
  | 'telegram'
  | 'github'
  | 'twitch'
  | 'twitter'
  | 'wallet-evm'
  | 'wallet-solana';

export interface Connection {
  id: string;
  userId: string;
  type: ConnectionType;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  externalId?: string;
  externalName?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConnection {
  id: string;
  agentId: string;
  connectionId: string;
  config?: Record<string, unknown>;
  createdAt: Date;
}

export interface ConnectionWithAgent extends Connection {
  agentConnections: AgentConnection[];
}
