import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { readAllBundledHelpDocuments } from "@/lib/help/bundled";
import { postgresSslOption } from "@/lib/db-ssl";

loadEnvConfig(process.cwd());

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(connectionString, {
    prepare: false,
    connect_timeout: 30,
    ssl: postgresSslOption(connectionString),
    max: 1,
  });

  try {
    const docs = readAllBundledHelpDocuments();
    for (const doc of docs) {
      const updated = await sql`
        insert into help_documents (slug, locale, title, body, updated_at)
        values (${doc.slug}, ${doc.locale}, ${doc.title}, ${doc.body}, now())
        on conflict (slug, locale) do update set
          title = excluded.title,
          body = excluded.body,
          updated_at = now()
        returning slug, locale, length(body) as body_len
      `;
      const row = updated[0];
      const hasSides =
        doc.slug === "mediator"
          ? /## 6\. Sides|## 6\. Сторони|\*\*Sides\*\*|\*\*Сторони\*\*/.test(doc.body)
          : true;
      console.log(
        `Reset ${row.slug}/${row.locale} (${row.body_len} chars)` +
          (doc.slug === "mediator" ? (hasSides ? " — Sides present" : " — Sides MISSING") : ""),
      );
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
