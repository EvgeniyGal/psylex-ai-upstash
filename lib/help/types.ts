import type { Locale } from "@/lib/i18n";

export const HELP_SLUGS = ["overview", "parties", "mediator", "admin"] as const;

export type HelpSlug = (typeof HELP_SLUGS)[number];

export type HelpDocument = {
  slug: HelpSlug;
  locale: Locale;
  title: string;
  body: string;
  updatedAt?: Date;
};

export type HelpViewerRole = "admin" | "mediator" | "party_a" | "party_b" | null;
