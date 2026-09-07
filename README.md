# PsyLex (Upstash)

PsyLex mediation MVP with **Postgres as storage only** and **Upstash Redis** for live lobby / session updates.

Repo: [EvgeniyGal/psylex-ai-upstash](https://github.com/EvgeniyGal/psylex-ai-upstash)

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + lightweight shadcn setup
- NextAuth credentials auth (plain-text password for MVP)
- Drizzle ORM + PostgreSQL (Neon or any Postgres; no Postgres realtime / LISTEN required)
- Upstash Redis (`@upstash/realtime` + REST) for live updates and a short room-row cache

## Environment

Copy `.env.example` to `.env` and set:

| Variable | Local | Vercel production |
|----------|--------|-------------------|
| `DATABASE_URL` | Neon / Postgres pooler URI | Same (or production DB) |
| `NEXTAUTH_SECRET` | Any strong secret | Required — missing this causes `/api/auth/error` 500 |
| `NEXTAUTH_URL` | `http://localhost:3000` | Exact public origin, e.g. `https://psylex-ai-upstash.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Same as `NEXTAUTH_URL` | Same as production URL |
| `UPSTASH_REDIS_REST_URL` | From Upstash console | Same |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash console | Same |
| `OLD_DATABASE_URL` | Optional — read-only source for the copy script | Not needed at runtime |

Local `.env` is **not** deployed. Set the same keys under Vercel → Project → Settings → Environment Variables (Production), then **redeploy**.

## Local setup

```bash
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Migrations

```bash
npm run db:generate   # after schema changes
npm run db:migrate    # apply to DATABASE_URL
```

- `0025_row_level_security` — RLS when roles exist; safe on Neon. See [docs/security-rls.md](docs/security-rls.md).
- `0027_drop_pg_notify` — drops unused Postgres NOTIFY triggers (live updates are Upstash).

If you already ran the data-copy script against this `DATABASE_URL`, migrations are applied; you do not need to migrate again unless new files appear.

### Admin user (if DB is empty)

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

### Copy data from another Postgres (read-only source)

```bash
# OLD_DATABASE_URL = source (never written)
# DATABASE_URL     = target
npm run db:migrate-from-selfhosted
# or: node scripts/migrate-selfhosted-to-cloud.mjs
```

The script migrates the target schema, copies app tables (including `help_documents`), and never modifies the source.

## Live updates (Upstash)

Postgres holds all authoritative data. After mutations the server emits a small `room.change` / `user.change` ping on Redis channels. The browser listens via SSE (`/api/realtime`) and refetches state with server actions.

- **Channels:** `room-{roomId}`, `user-{userId}`
- **Auth:** NextAuth + room membership (or owning mediator / admin)
- **Fallback:** 15s polling if the Upstash connection is down
- **Cache:** short TTL Redis cache for room rows (invalidated on write); message lists always read from Postgres

On Vercel, prefer **Fluid Compute** so SSE is billed for CPU time, not connection duration.

## Deploy (Vercel)

1. Import [EvgeniyGal/psylex-ai-upstash](https://github.com/EvgeniyGal/psylex-ai-upstash).
2. Set all production env vars above (`NEXTAUTH_URL` must match the deployment host).
3. Deploy. After changing env vars, redeploy once.
4. Confirm login at `/login`. If you see `/api/auth/error` with 500, check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` first.

## Routes

- `/` — landing (EN/UK)
- `/login` — credentials login
- `/admin/rooms` — sessions / parties
- `/admin/mediators` — mediator management
- `/admin/settings` — settings, RAG, agents, help
- `/mediator/...` — mediator calendar and rooms
- `/onboarding/...`, `/dispute-intake`, `/mediation`, `/room` — participant flow
