import "dotenv/config";
import { execSync } from "node:child_process";
import postgres from "postgres";

/**
 * Copy app data from OLD_DATABASE_URL (read-only) into DATABASE_URL.
 *
 * Never writes to the source. Target is truncated and refilled.
 *
 * Usage: node scripts/migrate-selfhosted-to-cloud.mjs
 */
const sourceUrl = (
  process.env.OLD_DATABASE_URL ??
  process.env.O_DATABASE_URL ??
  ""
).replace(/^"|"$/g, "");
const targetUrl = (process.env.DATABASE_URL ?? "").replace(/^"|"$/g, "");

// Insert order respects soft dependencies; FKs are disabled during copy.
const APP_TABLES = [
  "rooms",
  "users",
  "user_test_completions",
  "magic_tokens",
  "platform_settings",
  "legal_documents",
  "document_chunks",
  "agent_prompts",
  "pipeline_event_logs",
  "room_messages",
  "mediation_filing_receipts",
  "help_documents",
];

const TRUNCATE_ORDER = [...APP_TABLES].reverse();
const INSERT_ORDER = APP_TABLES;

function sslFor(url) {
  try {
    const host = new URL(url).hostname;
    if (
      host.includes("supabase.co") ||
      host.includes("pooler.supabase.com") ||
      host.includes("neon.tech")
    ) {
      return "require";
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function assertDifferentDatabases() {
  const sourceHost = new URL(sourceUrl).hostname;
  const targetHost = new URL(targetUrl).hostname;
  const sourcePath = new URL(sourceUrl).pathname;
  const targetPath = new URL(targetUrl).pathname;
  if (sourceHost === targetHost && sourcePath === targetPath) {
    throw new Error("OLD_DATABASE_URL and DATABASE_URL must be different databases.");
  }
}

async function probe(url, label) {
  const sql = postgres(url, {
    ssl: sslFor(url),
    prepare: false,
    connect_timeout: 20,
    max: 1,
  });
  try {
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`\n${label}: connected (${tables.length} public tables)`);
    for (const { tablename } of tables) {
      const [row] = await sql.unsafe(
        `SELECT count(*)::int AS n FROM public."${tablename}"`,
      );
      if (row.n > 0) console.log(`  ${tablename}: ${row.n}`);
    }
    return { ok: true };
  } catch (error) {
    console.error(`\n${label}: connection failed`);
    console.error(`  ${error.message}`);
    return { ok: false };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function run(cmd, env = process.env) {
  execSync(cmd, { stdio: "inherit", env, shell: true });
}

async function ensureExtensions(url) {
  const sql = postgres(url, {
    ssl: sslFor(url),
    prepare: false,
    connect_timeout: 20,
    max: 1,
  });
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    console.log("Extensions: vector, pgcrypto OK");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function tableExists(sql, table) {
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS present
  `;
  return Boolean(row.present);
}

async function copyAllData(fromUrl, toUrl) {
  const source = postgres(fromUrl, {
    ssl: sslFor(fromUrl),
    prepare: false,
    connect_timeout: 30,
    max: 1,
  });
  const target = postgres(toUrl, {
    ssl: sslFor(toUrl),
    prepare: false,
    connect_timeout: 30,
    max: 1,
  });

  try {
    const tableData = new Map();

    for (const table of APP_TABLES) {
      if (!(await tableExists(source, table))) {
        tableData.set(table, []);
        console.log(`  ${table}: missing on source (skip read)`);
        continue;
      }
      const rows = await source.unsafe(`SELECT * FROM public."${table}"`);
      tableData.set(table, rows);
      console.log(`  ${table}: read ${rows.length} rows from source`);
    }

    // Neon (and some poolers) forbid session_replication_role. Drop FKs instead.
    const foreignKeys = await target`
      SELECT
        conname,
        conrelid::regclass::text AS table_name,
        pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE contype = 'f'
        AND connamespace = 'public'::regnamespace
    `;
    for (const fk of foreignKeys) {
      await target.unsafe(
        `ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS "${fk.conname}"`,
      );
    }
    console.log(`  dropped ${foreignKeys.length} foreign keys on target`);

    for (const table of TRUNCATE_ORDER) {
      if (await tableExists(target, table)) {
        await target.unsafe(`TRUNCATE public."${table}" CASCADE`);
      }
    }

    for (const table of INSERT_ORDER) {
      const rows = tableData.get(table) ?? [];
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows (skip)`);
        continue;
      }

      console.log(`  ${table}: writing ${rows.length} rows to target...`);

      const batchSize = table === "document_chunks" ? 20 : 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await target`INSERT INTO ${target(table)} ${target(batch)}`;
      }

      console.log(`  ${table}: done`);
    }

    for (const fk of foreignKeys) {
      await target.unsafe(
        `ALTER TABLE ${fk.table_name} ADD CONSTRAINT "${fk.conname}" ${fk.def}`,
      );
    }
    console.log(`  restored ${foreignKeys.length} foreign keys on target`);
  } finally {
    await source.end({ timeout: 10 });
    await target.end({ timeout: 10 });
  }
}

async function main() {
  if (!sourceUrl) {
    console.error("OLD_DATABASE_URL is not set in .env");
    process.exit(1);
  }
  if (!targetUrl) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  assertDifferentDatabases();

  console.log("Step 1: Probing databases (source is read-only)...");
  const sourceProbe = await probe(sourceUrl, "OLD source (read-only)");
  if (!sourceProbe.ok) process.exit(1);

  const targetProbe = await probe(targetUrl, "NEW target");
  if (!targetProbe.ok) process.exit(1);

  console.log("\nStep 2: Ensuring extensions on target...");
  await ensureExtensions(targetUrl);

  console.log("\nStep 3: Applying schema migrations on target...");
  run("npx drizzle-kit migrate", { ...process.env, DATABASE_URL: targetUrl });

  console.log("\nStep 4: Copying data from source → target (source unchanged)...");
  await copyAllData(sourceUrl, targetUrl);

  console.log("\nStep 5: Verifying row counts on target...");
  await probe(targetUrl, "NEW target (after import)");

  console.log("\nMigration complete. Source database was not modified.");
  console.log("Restart the Next.js app so it uses DATABASE_URL.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
