import { eq, and } from 'drizzle-orm';
import { db, connections, agentConnections } from '@elizagotchi/database';
import { encrypt, decrypt } from '@elizagotchi/shared';
import { github, discord } from '../lib/auth';
import { setCache, getCache, deleteCache } from '../lib/redis';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || process.env.AUTH_SECRET || 'dev-secret-change-in-prod';

// Must match connectionTypeEnum in database schema
export type ConnectionType = 'discord' | 'telegram' | 'github' | 'twitch' | 'twitter' | 'wallet-evm' | 'wallet-solana';

interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

interface ConnectionData {
  id: string;
  type: ConnectionType;
  externalId: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

class ConnectionManager {
  async createConnection(
    userId: string,
    type: ConnectionType,
    externalId: string,
    tokens: TokenSet,
    metadata: Record<string, unknown> = {}
  ): Promise<ConnectionData> {
    // Encrypt tokens before storage
    const encryptedAccessToken = encrypt(tokens.accessToken, ENCRYPTION_SECRET);
    const encryptedRefreshToken = tokens.refreshToken
      ? encrypt(tokens.refreshToken, ENCRYPTION_SECRET)
      : null;

    const [connection] = await db
      .insert(connections)
      .values({
        userId,
        type,
        externalId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokens.expiresAt ?? null,
        metadata,
      })
      .onConflictDoUpdate({
        target: [connections.userId, connections.type, connections.externalId],
        set: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: tokens.expiresAt ?? null,
          metadata,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Invalidate cache
    await deleteCache(`connections:${userId}`);

    return {
      ...connection,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
    };
  }

  async getConnection(
    userId: string,
    connectionId: string
  ): Promise<ConnectionData | null> {
    const connection = await db.query.connections.findFirst({
      where: and(
        eq(connections.id, connectionId),
        eq(connections.userId, userId)
      ),
    });

    if (!connection) return null;

    return {
      ...connection,
      accessToken: decrypt(connection.accessToken!, ENCRYPTION_SECRET),
      refreshToken: connection.refreshToken
        ? decrypt(connection.refreshToken!, ENCRYPTION_SECRET)
        : null,
    };
  }

  async getUserConnections(userId: string): Promise<ConnectionData[]> {
    // Check cache
    const cached = await getCache<ConnectionData[]>(`connections:${userId}`);
    if (cached) return cached;

    const userConnections = await db.query.connections.findMany({
      where: eq(connections.userId, userId),
    });

    const decryptedConnections = userConnections.map((conn) => ({
      ...conn,
      accessToken: decrypt(conn.accessToken!, ENCRYPTION_SECRET),
      refreshToken: conn.refreshToken ? decrypt(conn.refreshToken!, ENCRYPTION_SECRET) : null,
    }));

    // Cache for 5 minutes
    await setCache(`connections:${userId}`, decryptedConnections, 300);

    return decryptedConnections;
  }

  async deleteConnection(userId: string, connectionId: string): Promise<void> {
    // First, remove any agent connections
    await db
      .delete(agentConnections)
      .where(eq(agentConnections.connectionId, connectionId));

    // Then delete the connection
    await db
      .delete(connections)
      .where(
        and(eq(connections.id, connectionId), eq(connections.userId, userId))
      );

    // Invalidate cache
    await deleteCache(`connections:${userId}`);
  }

  async refreshToken(
    userId: string,
    connectionId: string
  ): Promise<ConnectionData | null> {
    const connection = await this.getConnection(userId, connectionId);
    if (!connection || !connection.refreshToken) {
      return null;
    }

    let newTokens: TokenSet | null = null;

    try {
      switch (connection.type) {
        case 'github':
          newTokens = await this.refreshGitHubToken(connection.refreshToken);
          break;
        case 'discord':
          newTokens = await this.refreshDiscordToken(connection.refreshToken);
          break;
        default:
          return null;
      }

      if (!newTokens) return null;

      // Update connection with new tokens
      return this.createConnection(
        userId,
        connection.type,
        connection.externalId!,
        newTokens,
        connection.metadata ?? {}
      );
    } catch (error) {
      console.error(`Failed to refresh ${connection.type} token:`, error);
      return null;
    }
  }

  private async refreshGitHubToken(refreshToken: string): Promise<TokenSet> {
    const tokens = await github.refreshAccessToken(refreshToken);
    return {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      expiresAt: tokens.accessTokenExpiresAt(),
    };
  }

  private async refreshDiscordToken(refreshToken: string): Promise<TokenSet> {
    const tokens = await discord.refreshAccessToken(refreshToken);
    return {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      expiresAt: tokens.accessTokenExpiresAt(),
    };
  }

  async linkConnectionToAgent(
    agentId: string,
    connectionId: string,
    config: Record<string, unknown> = {}
  ): Promise<void> {
    await db
      .insert(agentConnections)
      .values({
        agentId,
        connectionId,
        config,
      })
      .onConflictDoNothing();
  }

  async unlinkConnectionFromAgent(
    agentId: string,
    connectionId: string
  ): Promise<void> {
    await db
      .delete(agentConnections)
      .where(
        and(
          eq(agentConnections.agentId, agentId),
          eq(agentConnections.connectionId, connectionId)
        )
      );
  }

  async getAgentConnections(agentId: string): Promise<ConnectionData[]> {
    const agentConns = await db.query.agentConnections.findMany({
      where: eq(agentConnections.agentId, agentId),
      with: {
        connection: true,
      },
    });

    return agentConns.map((ac) => ({
      ...ac.connection,
      accessToken: decrypt(ac.connection.accessToken!, ENCRYPTION_SECRET),
      refreshToken: ac.connection.refreshToken
        ? decrypt(ac.connection.refreshToken!, ENCRYPTION_SECRET)
        : null,
    }));
  }

  async validateConnection(
    userId: string,
    connectionId: string
  ): Promise<boolean> {
    const connection = await this.getConnection(userId, connectionId);
    if (!connection) return false;

    // Check if token is expired
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      // Try to refresh
      const refreshed = await this.refreshToken(userId, connectionId);
      return refreshed !== null;
    }

    return true;
  }
}

export const connectionManager = new ConnectionManager();
