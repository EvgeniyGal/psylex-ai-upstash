ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model" text NOT NULL DEFAULT 'gpt-4o-mini';
