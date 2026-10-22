ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_refresh_requested_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "room_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL REFERENCES "rooms"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "party_role" "user_role" NOT NULL,
  "dispute_description" text,
  "dispute_priority" text,
  "dispute_acceptable_outcome" text,
  "dispute_intake_submitted_at" timestamp with time zone,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "room_participants_room_role_unique"
  ON "room_participants" ("room_id", "party_role");
CREATE UNIQUE INDEX IF NOT EXISTS "room_participants_room_user_unique"
  ON "room_participants" ("room_id", "user_id");

-- Migrate existing party users bound via users.room_id
INSERT INTO "room_participants" (
  "room_id",
  "user_id",
  "party_role",
  "dispute_description",
  "dispute_priority",
  "dispute_acceptable_outcome",
  "dispute_intake_submitted_at",
  "joined_at"
)
SELECT
  u."room_id",
  u."id",
  u."role",
  u."dispute_description",
  u."dispute_priority",
  u."dispute_acceptable_outcome",
  u."dispute_intake_submitted_at",
  COALESCE(u."dispute_intake_submitted_at", now())
FROM "users" u
WHERE u."room_id" IS NOT NULL
  AND u."role" IN ('party_a', 'party_b')
ON CONFLICT DO NOTHING;
