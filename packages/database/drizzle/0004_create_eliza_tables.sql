-- Create ElizaOS required tables (v1.7.1 schema)
-- These are separate from our platform_agents tables

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ElizaOS servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ElizaOS agents table (exact v1.7.1 schema)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT true NOT NULL,
    server_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    username TEXT,
    system TEXT DEFAULT '',
    bio JSONB DEFAULT '[]'::jsonb,
    message_examples JSONB DEFAULT '[]'::jsonb NOT NULL,
    post_examples JSONB DEFAULT '[]'::jsonb NOT NULL,
    topics JSONB DEFAULT '[]'::jsonb NOT NULL,
    adjectives JSONB DEFAULT '[]'::jsonb NOT NULL,
    knowledge JSONB DEFAULT '[]'::jsonb NOT NULL,
    plugins JSONB DEFAULT '[]'::jsonb NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    style JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- ElizaOS worlds table
CREATE TABLE IF NOT EXISTS worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    metadata JSONB,
    message_server_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ElizaOS entities table
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    names TEXT[] DEFAULT '{}'::text[] NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    UNIQUE(id, agent_id)
);

-- ElizaOS rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    type TEXT NOT NULL,
    message_server_id UUID,
    world_id UUID,
    name TEXT,
    metadata JSONB,
    channel_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ElizaOS participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    room_state TEXT
);

-- ElizaOS relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tags TEXT[],
    metadata JSONB,
    UNIQUE(source_entity_id, target_entity_id, agent_id)
);

-- ElizaOS memories table
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    content JSONB NOT NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    world_id UUID,
    "unique" BOOLEAN DEFAULT true NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- ElizaOS components table
CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    source_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ElizaOS logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    body JSONB NOT NULL,
    type TEXT NOT NULL,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
);

-- ElizaOS cache table
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ElizaOS embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    dim_384 vector(384),
    dim_512 vector(512),
    dim_768 vector(768),
    dim_1024 vector(1024),
    dim_1536 vector(1536),
    dim_3072 vector(3072)
);

-- ElizaOS tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    world_id UUID,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}'::text[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Note: Indexes will be created by ElizaOS migration system
-- DO NOT create indexes here to avoid conflicts
