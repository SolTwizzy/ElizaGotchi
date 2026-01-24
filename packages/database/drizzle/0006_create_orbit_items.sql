-- Create orbit_item_type enum
DO $$ BEGIN
 CREATE TYPE "public"."orbit_item_type" AS ENUM('chat', 'task', 'monitor');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create orbit_items table
CREATE TABLE IF NOT EXISTS "orbit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "orbit_item_type" NOT NULL,
	"snapshot_data" jsonb,
	"task_config" jsonb,
	"task_snapshot" jsonb,
	"task_snapshot_at" timestamp,
	"room_id" uuid,
	"is_archived" boolean DEFAULT false NOT NULL,
	"orbit_position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "orbit_items" ADD CONSTRAINT "orbit_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orbit_items" ADD CONSTRAINT "orbit_items_agent_id_platform_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."platform_agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "orbit_items_agent_id_idx" ON "orbit_items" ("agent_id");
CREATE INDEX IF NOT EXISTS "orbit_items_user_id_idx" ON "orbit_items" ("user_id");
CREATE INDEX IF NOT EXISTS "orbit_items_is_archived_idx" ON "orbit_items" ("is_archived");
