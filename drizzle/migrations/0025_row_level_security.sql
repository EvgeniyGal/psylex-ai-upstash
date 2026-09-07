-- Row Level Security for PsyLex (NextAuth + Drizzle server access).
--
-- Architecture:
--   - All reads/writes go through Next.js via DATABASE_URL (postgres role bypasses RLS).
--   - Optional Supabase API roles (anon / authenticated) are locked down when present.
--   - Vanilla Postgres (e.g. Neon) has no those roles; RLS is still enabled.
--
-- Helper for new tables created in later Drizzle migrations:
--   SELECT public.psylex_lockdown_table('public.my_new_table');
CREATE OR REPLACE FUNCTION public.psylex_lockdown_table(target regclass)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_anon boolean;
  has_authenticated boolean;
  policy_roles text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);

  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;
  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') INTO has_authenticated;

  IF has_anon THEN
    EXECUTE format('REVOKE ALL ON TABLE %s FROM anon', target);
  END IF;
  IF has_authenticated THEN
    EXECUTE format('REVOKE ALL ON TABLE %s FROM authenticated', target);
  END IF;

  IF has_anon OR has_authenticated THEN
    EXECUTE format('DROP POLICY IF EXISTS deny_anon_api_access ON %s', target);
    policy_roles := CASE
      WHEN has_anon AND has_authenticated THEN 'anon, authenticated'
      WHEN has_anon THEN 'anon'
      ELSE 'authenticated'
    END;
    EXECUTE format(
      'CREATE POLICY deny_anon_api_access ON %s AS RESTRICTIVE FOR ALL TO %s USING (false) WITH CHECK (false)',
      target,
      policy_roles
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.psylex_lockdown_table(regclass) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.psylex_lockdown_table(regclass) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.psylex_lockdown_table(regclass) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    GRANT EXECUTE ON FUNCTION public.psylex_lockdown_table(regclass) TO postgres;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.psylex_lockdown_table(regclass) TO service_role;
  END IF;
END $$;

-- 1. Enable RLS on every public table (including __drizzle_migrations if present).
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    PERFORM public.psylex_lockdown_table(format('public.%I', tbl)::regclass);
  END LOOP;
END $$;

-- 2. Remove remaining API role access on schema objects when those roles exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM authenticated;
  END IF;
END $$;
