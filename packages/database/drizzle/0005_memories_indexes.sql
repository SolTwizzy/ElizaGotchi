-- Add indexes for efficient chat history queries
-- This improves performance when querying memories by agent_id, room_id, and type

CREATE INDEX IF NOT EXISTS idx_memories_agent_room_type
ON memories(agent_id, room_id, type, created_at DESC);

-- Index for counting memories by agent
CREATE INDEX IF NOT EXISTS idx_memories_agent_type
ON memories(agent_id, type);
