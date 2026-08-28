import { readFileSync } from "node:fs";
import path from "node:path";
import type { Locale } from "@/lib/i18n";
import { HELP_SLUGS, type HelpDocument, type HelpSlug } from "@/lib/help/types";

const FILE_BY_SLUG: Record<HelpSlug, string> = {
  overview: "overview.md",
  parties: "parties.md",
  mediator: "mediator.md",
  admin: "admin.md",
};

export function extractMarkdownTitle(body: string, fallback: string): string {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

export function bundledHelpPath(slug: HelpSlug, locale: Locale): string {
  return path.join(process.cwd(), "instruction", locale, FILE_BY_SLUG[slug]);
}

export function readBundledHelpDocument(slug: HelpSlug, locale: Locale): HelpDocument {
  const body = readFileSync(bundledHelpPath(slug, locale), "utf8");
  return {
    slug,
    locale,
    title: extractMarkdownTitle(body, slug),
    body,
  };
}

export function readAllBundledHelpDocuments(): HelpDocument[] {
  const docs: HelpDocument[] = [];
  for (const locale of ["en", "uk"] as const) {
    for (const slug of HELP_SLUGS) {
      docs.push(readBundledHelpDocument(slug, locale));
    }
  }
  return docs;
}
