ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model_dialogue" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model_artifacts" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model_fast" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model_pipeline" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model_rag_chat" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_model_help" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "platform_settings"
  ADD COLUMN IF NOT EXISTS "openai_embedding_model" text NOT NULL DEFAULT 'text-embedding-3-small';
