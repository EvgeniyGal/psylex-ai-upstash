import { isPartyRole } from "@/lib/participant-roles";
import { HELP_SLUGS, type HelpSlug, type HelpViewerRole } from "@/lib/help/types";

export function allowedHelpSlugs(role: HelpViewerRole): HelpSlug[] {
  if (role === "admin") return [...HELP_SLUGS];
  if (role === "mediator") return ["overview", "parties", "mediator"];
  if (role && isPartyRole(role)) return ["overview", "parties"];
  return ["overview", "parties"];
}

export function canAccessHelpSlug(role: HelpViewerRole, slug: HelpSlug): boolean {
  return allowedHelpSlugs(role).includes(slug);
}
