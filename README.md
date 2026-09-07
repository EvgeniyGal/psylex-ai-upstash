# PsyLex MVP First Look

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + lightweight shadcn setup
- NextAuth credentials auth (plain-text password for MVP)
- Drizzle ORM + PostgreSQL (Neon or any Postgres; no realtime features required)
- Upstash Redis for mediation / lobby live updates and a short room cache

## Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `DATABASE_URL` — Postgres connection string (session pooler or Neon pooler)
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Upstash console
3. Install dependencies:

```bash
npm install
```

4. Generate migration files:

```bash
npm run db:generate
```

5. Apply migrations:

```bash
npm run db:migrate
```

Migration `0025_row_level_security` enables RLS on public tables when present. See [docs/security-rls.md](docs/security-rls.md).  
Migration `0027_drop_pg_notify` removes unused Postgres LISTEN/NOTIFY triggers (live updates are Upstash).

6. Create admin user manually in DB (example):

```sql
INSERT INTO users (id, login, password, role, title, description, room_id)
VALUES (
  gen_random_uuid(),
  'psylex_550e8400-e29b-41d4-a716-446655440000',
  'change-me',
  'admin',
  'Admin',
  'System administrator',
  NULL
);
```

7. Run app:

```bash
npm run dev
```

### Copying data from another Postgres

Keep the old DB URL as `OLD_DATABASE_URL` (read-only). Set the destination as `DATABASE_URL`, then:

```bash
node scripts/migrate-selfhosted-to-cloud.mjs
```

The script never writes to the source. It migrates schema on the target, copies app tables, then restores foreign keys.

## Live updates (Upstash)

Postgres is storage only. After writes, the server emits a tiny `room.change` / `user.change` ping on per-entity Redis channels. The browser subscribes via SSE (`/api/realtime`) and refetches authoritative state through server actions.

- **Channels:** `room-{roomId}`, `user-{userId}`
- **Auth:** NextAuth session + room membership (or mediator owner / admin)
- **Fallback:** 15s polling if the Upstash connection is down
- **Cache:** 30s Redis cache for room rows and message lists, invalidated on emit

On Vercel, enable Fluid Compute so SSE connections are billed for CPU time, not connection duration.

## Routes

- `/` landing page (EN/UK with localStorage persistence)
- `/login` admin login
- `/admin/settings` settings placeholder
- `/admin/sessions` sessions + plaintiff/defendant management
- `/admin/mediators` mediator management
