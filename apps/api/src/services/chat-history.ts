/**
 * Chat History Service
 *
 * Queries ElizaOS memories table to retrieve chat history.
 * Uses raw postgres queries since ElizaOS tables are managed separately from Drizzle.
 */

import postgres from 'postgres';
import { v5 as uuidv5 } from 'uuid';

// Deterministic UUID namespace for room IDs
const ROOM_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

interface MemoryRow {
  id: string;
  type: string;
  created_at: Date;
  content: { text?: string; source?: string; [key: string]: unknown };
  entity_id: string | null;
  agent_id: string;
  room_id: string | null;
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface ChatHistoryOptions {
  limit?: number;
  before?: string; // ISO timestamp cursor
}

/**
 * Generate a deterministic UUID for a room based on agentId and userId.
 * This ensures the same room is always used for the same agent-user pair.
 */
export function generateRoomId(agentId: string, userId: string): string {
  return uuidv5(`${agentId}-${userId}`, ROOM_NAMESPACE);
}

class ChatHistoryService {
  private sql: ReturnType<typeof postgres> | null = null;

  private getConnection(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL not set');
      }
      this.sql = postgres(connectionString);
    }
    return this.sql;
  }

  /**
   * Get chat history for an agent-user conversation.
   *
   * @param agentId - The agent's UUID
   * @param userId - The user's UUID (used to generate roomId)
   * @param options - Pagination options
   */
  async getChatHistory(
    agentId: string,
    userId: string,
    options: ChatHistoryOptions = {}
  ): Promise<ChatHistoryResponse> {
    const sql = this.getConnection();
    const limit = Math.min(options.limit || 50, 100);
    const roomId = generateRoomId(agentId, userId);

    try {
      // Query memories table for messages
      // Note: We query for limit + 1 to check if there are more messages
      let memories: MemoryRow[];

      if (options.before) {
        memories = await sql<MemoryRow[]>`
          SELECT id, type, created_at, content, entity_id, agent_id, room_id, metadata
          FROM memories
          WHERE agent_id = ${agentId}::uuid
            AND room_id = ${roomId}::uuid
            AND type = 'message'
            AND created_at < ${options.before}::timestamp
          ORDER BY created_at DESC
          LIMIT ${limit + 1}
        `;
      } else {
        memories = await sql<MemoryRow[]>`
          SELECT id, type, created_at, content, entity_id, agent_id, room_id, metadata
          FROM memories
          WHERE agent_id = ${agentId}::uuid
            AND room_id = ${roomId}::uuid
            AND type = 'message'
          ORDER BY created_at DESC
          LIMIT ${limit + 1}
        `;
      }

      const hasMore = memories.length > limit;
      const results = memories.slice(0, limit);

      // Transform to chat message format
      const messages: ChatMessage[] = results.map((m) => ({
        id: m.id,
        // Determine role: if entity_id is NULL or equals agent_id, it's an assistant message
        role: m.entity_id === null || m.entity_id === m.agent_id ? 'assistant' : 'user',
        content: m.content?.text || '',
        timestamp: m.created_at.toISOString(),
        metadata: m.metadata,
      }));

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      return { messages, hasMore };
    } catch (error) {
      console.error(`[ChatHistory] Error fetching history for agent ${agentId}:`, error);
      // Graceful degradation - return empty on error
      return { messages: [], hasMore: false };
    }
  }

  /**
   * Check if any memories exist for an agent (useful for debugging).
   */
  async getMemoryCount(agentId: string): Promise<number> {
    const sql = this.getConnection();

    try {
      const result = await sql<{ count: string }[]>`
        SELECT COUNT(*) as count
        FROM memories
        WHERE agent_id = ${agentId}::uuid
          AND type = 'message'
      `;
      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      console.error(`[ChatHistory] Error counting memories:`, error);
      return 0;
    }
  }

  /**
   * Get all room IDs for an agent (useful for debugging).
   */
  async getRoomIds(agentId: string): Promise<string[]> {
    const sql = this.getConnection();

    try {
      const result = await sql<{ room_id: string }[]>`
        SELECT DISTINCT room_id
        FROM memories
        WHERE agent_id = ${agentId}::uuid
          AND room_id IS NOT NULL
      `;
      return result.map((r) => r.room_id);
    } catch (error) {
      console.error(`[ChatHistory] Error fetching room IDs:`, error);
      return [];
    }
  }

  /**
   * Close the database connection.
   */
  async shutdown(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      this.sql = null;
    }
  }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
