# Row Level Security (RLS)

PsyLex uses **NextAuth** for sessions and **Drizzle + `DATABASE_URL`** for all database reads and writes. Postgres is storage only. Live updates go through **Upstash Redis + NextAuth SSE** (`/api/realtime`).

Migration `0025_row_level_security` is defense-in-depth:

1. **Enables RLS** on every table in the `public` schema.
2. **Revokes** table access from Supabase `anon` / `authenticated` **when those roles exist**.
3. On vanilla Postgres (for example Neon), those roles are absent; RLS is still enabled and the table owner continues to serve the app via `DATABASE_URL`.

The Next.js server connects with the database owner/pooler role, which is not blocked by the deny policies.

## Apply

```bash
npm run db:migrate
```

## Tables

| Table | Server access |
|-------|----------------|
| `users` | Drizzle |
| `rooms` | Drizzle |
| `room_messages` | Drizzle |
| `user_test_completions` | Drizzle |
| `magic_tokens` | Drizzle |
| `platform_settings` | Drizzle |
| `legal_documents` | Drizzle |
| `document_chunks` | Drizzle |
| `agent_prompts` | Drizzle |
| `pipeline_event_logs` | Drizzle |
| `mediation_filing_receipts` | Drizzle |
| `help_documents` | Drizzle |

Never put database credentials or Redis tokens in the browser. Realtime authorization is enforced in `/api/realtime` middleware (session + room/user channel checks).

## New tables (Drizzle migrations)

After creating a table in a new Drizzle migration, lock it down in the same migration file:

```sql
SELECT public.psylex_lockdown_table('public.my_new_table');
```

The helper is created by `0025_row_level_security.sql`.
