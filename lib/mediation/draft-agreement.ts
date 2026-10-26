import { randomUUID } from "crypto";
import type { DraftAgreement, DraftObligation } from "@/lib/mediation/types";

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

export function normalizeDraftAgreement(raw: RawDraftInput): DraftAgreement {
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

  return {
    title: raw.title,
    body: raw.body,
    obligations,
    terms: obligationsToTerms(obligations),
    // Kept for backward compatibility with existing room JSON; no catalog merge.
    protectiveClauseIds: raw.protectiveClauseIds ?? [],
    status: raw.status ?? "draft",
    publishedAt: raw.publishedAt,
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  };
}
