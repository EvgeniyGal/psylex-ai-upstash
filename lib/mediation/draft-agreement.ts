import { randomUUID } from "crypto";
import type { DraftAgreement, DraftObligation } from "@/lib/mediation/types";
import {
  PROTECTIVE_CLAUSES,
  inferDisputeTags,
  protectiveClauseText,
  suggestedProtectiveClauseIds,
  type ProtectiveClause,
} from "@/lib/mediation/protective-clauses";

export function obligationsToTerms(obligations: DraftObligation[]): string[] {
  return obligations.map((o) =>
    o.deadline?.trim() ? `${o.text.trim()} (${o.deadline.trim()})` : o.text.trim(),
  );
}

type RawDraftInput = {
  title: string;
  body: string;
  terms?: string[];
  obligations?: Array<{
    id?: string;
    text: string;
    deadline?: string | null;
    source?: DraftObligation["source"];
  }>;
  protectiveClauseIds?: string[];
  status?: DraftAgreement["status"];
  publishedAt?: string;
  generatedAt?: string;
};

export function normalizeDraftAgreement(
  raw: RawDraftInput,
  options?: { suggestProtectiveIds?: string[] },
): DraftAgreement {
  const obligations: DraftObligation[] =
    raw.obligations && raw.obligations.length > 0
      ? raw.obligations.map((o) => ({
          id: o.id || randomUUID(),
          text: o.text,
          deadline: o.deadline ?? null,
          source: o.source ?? "dialogue",
        }))
      : (raw.terms ?? []).map((text) => ({
          id: randomUUID(),
          text,
          deadline: null as string | null,
          source: "option" as const,
        }));

  const protectiveClauseIds = raw.protectiveClauseIds ?? options?.suggestProtectiveIds ?? [];

  return {
    title: raw.title,
    body: raw.body,
    obligations,
    terms: obligationsToTerms(obligations),
    protectiveClauseIds,
    status: raw.status ?? "draft",
    publishedAt: raw.publishedAt,
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  };
}

export function mergeProtectiveClausesIntoDraft(
  draft: DraftAgreement,
  selectedIds: string[],
  locale: "en" | "uk" = "en",
): DraftAgreement {
  const withoutProtective = draft.obligations.filter((o) => o.source !== "protective");
  const selected = new Set(selectedIds);
  const added: DraftObligation[] = PROTECTIVE_CLAUSES.filter((c) => selected.has(c.id)).map(
    (clause) => ({
      id: `protective-${clause.id}`,
      text: protectiveClauseText(clause, locale),
      deadline: null,
      source: "protective" as const,
    }),
  );

  const obligations = [...withoutProtective, ...added];
  return {
    ...draft,
    protectiveClauseIds: selectedIds,
    obligations,
    terms: obligationsToTerms(obligations),
  };
}

export function listProtectiveClauses(): ProtectiveClause[] {
  return PROTECTIVE_CLAUSES;
}

export function defaultSuggestedProtectiveIds(roomText: string | null | undefined) {
  return suggestedProtectiveClauseIds(inferDisputeTags(roomText));
}
