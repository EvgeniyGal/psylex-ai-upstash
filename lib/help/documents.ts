import { and, eq } from "drizzle-orm";
import { helpDocuments } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { allowedHelpSlugs } from "@/lib/help/access";
import { readAllBundledHelpDocuments, readBundledHelpDocument } from "@/lib/help/bundled";
import { HELP_SLUGS, type HelpDocument, type HelpSlug, type HelpViewerRole } from "@/lib/help/types";
import type { Locale } from "@/lib/i18n";

let seedPromise: Promise<void> | null = null;

async function seedIfEmpty() {
  const existing = await db.select({ id: helpDocuments.id }).from(helpDocuments).limit(1);
  if (existing.length > 0) return;

  const bundled = readAllBundledHelpDocuments();
  await db.insert(helpDocuments).values(
    bundled.map((doc) => ({
      slug: doc.slug,
      locale: doc.locale,
      title: doc.title,
      body: doc.body,
    })),
  );
}

export async function ensureHelpDocumentsSeeded() {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  await seedPromise;
}

function toHelpDocument(row: {
  slug: string;
  locale: string;
  title: string;
  body: string;
  updatedAt: Date;
}): HelpDocument {
  return {
    slug: row.slug as HelpSlug,
    locale: row.locale as Locale,
    title: row.title,
    body: row.body,
    updatedAt: row.updatedAt,
  };
}

export async function listHelpDocuments(locale: Locale, role: HelpViewerRole): Promise<HelpDocument[]> {
  await ensureHelpDocumentsSeeded();
  const slugs = allowedHelpSlugs(role);
  const rows = await db
    .select()
    .from(helpDocuments)
    .where(eq(helpDocuments.locale, locale));

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return slugs.map((slug) => {
    const row = bySlug.get(slug);
    if (row) return toHelpDocument(row);
    return readBundledHelpDocument(slug, locale);
  });
}

export async function listAllHelpDocuments(): Promise<HelpDocument[]> {
  await ensureHelpDocumentsSeeded();
  const rows = await db.select().from(helpDocuments);
  const found = new Set(rows.map((row) => `${row.slug}:${row.locale}`));
  const docs = rows.map(toHelpDocument);

  for (const locale of ["en", "uk"] as const) {
    for (const slug of HELP_SLUGS) {
      if (!found.has(`${slug}:${locale}`)) {
        docs.push(readBundledHelpDocument(slug, locale));
      }
    }
  }

  return docs.sort((a, b) => {
    const slugDiff = HELP_SLUGS.indexOf(a.slug) - HELP_SLUGS.indexOf(b.slug);
    if (slugDiff !== 0) return slugDiff;
    return a.locale.localeCompare(b.locale);
  });
}

export async function getHelpDocument(
  slug: HelpSlug,
  locale: Locale,
): Promise<HelpDocument | null> {
  await ensureHelpDocumentsSeeded();
  const [row] = await db
    .select()
    .from(helpDocuments)
    .where(and(eq(helpDocuments.slug, slug), eq(helpDocuments.locale, locale)))
    .limit(1);

  if (row) return toHelpDocument(row);
  try {
    return readBundledHelpDocument(slug, locale);
  } catch {
    return null;
  }
}

export async function saveHelpDocument(params: {
  slug: HelpSlug;
  locale: Locale;
  title: string;
  body: string;
}) {
  const [existing] = await db
    .select({ id: helpDocuments.id })
    .from(helpDocuments)
    .where(and(eq(helpDocuments.slug, params.slug), eq(helpDocuments.locale, params.locale)))
    .limit(1);

  if (existing) {
    await db
      .update(helpDocuments)
      .set({
        title: params.title,
        body: params.body,
        updatedAt: new Date(),
      })
      .where(eq(helpDocuments.id, existing.id));
    return;
  }

  await db.insert(helpDocuments).values({
    slug: params.slug,
    locale: params.locale,
    title: params.title,
    body: params.body,
  });
}

export async function resetHelpDocument(slug: HelpSlug, locale: Locale): Promise<HelpDocument> {
  const bundled = readBundledHelpDocument(slug, locale);
  await saveHelpDocument(bundled);
  return bundled;
}
