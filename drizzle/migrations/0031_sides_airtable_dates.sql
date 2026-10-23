ALTER TABLE "user_test_completions"
  ADD COLUMN IF NOT EXISTS "airtable_created_at" timestamp with time zone;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "personal_bot_airtable_updated_at" timestamp with time zone;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "personal_bot_redo_after" timestamp with time zone;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "test_redo_after" jsonb DEFAULT '{}'::jsonb NOT NULL;
