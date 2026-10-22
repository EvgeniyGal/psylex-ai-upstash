ALTER TABLE "room_messages" ADD COLUMN IF NOT EXISTS "source_locale" "preferred_locale";
ALTER TABLE "room_messages" ADD COLUMN IF NOT EXISTS "translations" jsonb;
