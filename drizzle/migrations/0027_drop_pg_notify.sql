-- Live updates moved to Upstash Redis. Drop Postgres NOTIFY triggers
-- so writes no longer fan out unused LISTEN payloads.

DROP TRIGGER IF EXISTS rooms_notify_mediation ON public.rooms;
DROP TRIGGER IF EXISTS room_messages_notify_mediation ON public.room_messages;
DROP TRIGGER IF EXISTS users_notify_mediation ON public.users;
DROP TRIGGER IF EXISTS user_test_completions_notify_mediation ON public.user_test_completions;
DROP FUNCTION IF EXISTS public.notify_mediation_change();
