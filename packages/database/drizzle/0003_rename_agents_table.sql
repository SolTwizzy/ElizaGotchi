-- Rename agents table to platform_agents to avoid conflict with ElizaOS
-- ElizaOS requires its own 'agents' table with a different schema

-- Step 1: Rename enum types first
DO $$ BEGIN
    ALTER TYPE agent_type RENAME TO platform_agent_type;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE agent_status RENAME TO platform_agent_status;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Step 2: Rename tables
ALTER TABLE IF EXISTS agents RENAME TO platform_agents;
ALTER TABLE IF EXISTS agent_logs RENAME TO platform_agent_logs;
ALTER TABLE IF EXISTS agent_connections RENAME TO platform_agent_connections;
