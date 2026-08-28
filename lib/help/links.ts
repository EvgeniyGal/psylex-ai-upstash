import { HELP_SLUGS, type HelpSlug } from "@/lib/help/types";

const FILE_ALIASES: Record<string, HelpSlug> = {
  "overview.md": "overview",
  "readme.md": "overview",
  "parties.md": "parties",
  "storona-a-b.md": "parties",
  "mediator.md": "mediator",
  "admin.md": "admin",
};

export function helpSlugFromHref(href: string | undefined): HelpSlug | null {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) {
    return null;
  }

  const path = href.split(/[?#]/)[0] ?? "";
  const filename = path.split("/").pop()?.toLowerCase() ?? "";
  const aliased = FILE_ALIASES[filename];
  if (aliased) return aliased;

  const slug = filename.replace(/\.md$/, "");
  return HELP_SLUGS.includes(slug as HelpSlug) ? (slug as HelpSlug) : null;
}
