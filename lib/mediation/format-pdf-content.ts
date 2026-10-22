import type { Locale } from "@/lib/i18n";
import { partyRoleLabel } from "@/lib/party-labels";
import type { PartyRole } from "@/lib/participant-roles";
import type { PsychodynamicProfile, LegalAnalysis } from "@/lib/pipeline/schemas";
import type { users as usersTable } from "@/drizzle/schema";

type UserRow = typeof usersTable.$inferSelect;

export const psychodynamicProfileLabels: Record<
  Locale,
  {
    unavailable: string;
    traits: string;
    attachment: string;
    defense: string;
    relational: string;
  }
> = {
  en: {
    unavailable: "(not available)",
    traits: "Traits",
    attachment: "Attachment style",
    defense: "Defense mechanisms",
    relational: "Relational patterns",
  },
  uk: {
    unavailable: "(недоступно)",
    traits: "Риси",
    attachment: "Тип прив'язаності",
    defense: "Захисні механізми",
    relational: "Стосункові патерни",
  },
};

const profileLabels = psychodynamicProfileLabels;

export function formatPsychodynamicProfile(
  profile: PsychodynamicProfile | null | undefined,
  partyLabel: string,
  locale: Locale,
): string {
  const labels = profileLabels[locale];
  if (!profile) {
    return `${partyLabel}\n${labels.unavailable}`;
  }

  const lines = [partyLabel, profile.summary];
  if (profile.traits.length > 0) {
    lines.push(`${labels.traits}: ${profile.traits.join(", ")}`);
  }
  if (profile.attachmentStyle) {
    lines.push(`${labels.attachment}: ${profile.attachmentStyle}`);
  }
  if (profile.defenseMechanisms && profile.defenseMechanisms.length > 0) {
    lines.push(`${labels.defense}: ${profile.defenseMechanisms.join(", ")}`);
  }
  if (profile.relationalPatterns && profile.relationalPatterns.length > 0) {
    lines.push(`${labels.relational}: ${profile.relationalPatterns.join(", ")}`);
  }
  return lines.join("\n");
}

export function formatViewerPsychodynamicProfile(
  viewerRole: PartyRole,
  partyA: UserRow,
  partyB: UserRow,
  locale: Locale,
): string {
  const viewer = viewerRole === "party_a" ? partyA : partyB;
  return formatPsychodynamicProfile(
    viewer.psychodynamicProfile as PsychodynamicProfile | null,
    partyRoleLabel(viewerRole, locale),
    locale,
  );
}

export function formatPartyPsychodynamicProfiles(
  partyA: UserRow,
  partyB: UserRow,
  locale: Locale,
): string {
  return [
    formatPsychodynamicProfile(
      partyA.psychodynamicProfile as PsychodynamicProfile | null,
      partyRoleLabel("party_a", locale),
      locale,
    ),
    "",
    formatPsychodynamicProfile(
      partyB.psychodynamicProfile as PsychodynamicProfile | null,
      partyRoleLabel("party_b", locale),
      locale,
    ),
  ].join("\n");
}

export function formatLegalAnalysis(
  analysis: LegalAnalysis | null | undefined,
  locale: Locale = "en",
): string {
  if (!analysis) return "";

  const summary =
    typeof analysis.analysis === "string" ? analysis.analysis.trim() : "";

  if (analysis.status === "not_found") {
    return summary;
  }

  const parts: string[] = [];
  if (summary) {
    parts.push(summary);
  }
  const relevanceLabel = locale === "uk" ? "Релевантність" : "Relevance";
  const sourceLabel = locale === "uk" ? "Джерело" : "Source";
  for (const law of analysis.applicableLaws ?? []) {
    parts.push(`${law.name}\n${law.summary}\n${relevanceLabel}: ${law.relevance}`);
  }
  for (const regulation of analysis.regulations ?? []) {
    parts.push(`${regulation.name}\n${regulation.summary}`);
  }
  for (const citation of analysis.citations ?? []) {
    const source = citation.sourceUrl ? `\n${sourceLabel}: ${citation.sourceUrl}` : "";
    parts.push(`${citation.documentName}\n${citation.excerpt}${source}`);
  }
  return parts.join("\n\n");
}
