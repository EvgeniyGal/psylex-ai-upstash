import type { PartyRole } from "@/lib/participant-roles";

export type MediationPhase =
  | "opening"
  | "dialogue"
  | "generating_options"
  | "voting"
  | "voting_discrepancy"
  | "agreement"
  | "completed";

export const MEDIATION_PHASES: MediationPhase[] = [
  "opening",
  "dialogue",
  "generating_options",
  "voting",
  "voting_discrepancy",
  "agreement",
  "completed",
];

export const REPLY_TIMEOUT_MS = 5 * 60_000;
export const MAX_DIALOGUE_ROUNDS = 3;

export type MediationMessageKind =
  | "mediation_opening"
  | "mediation_question"
  | "mediation_summary"
  | "mediation_moderation"
  | "mediation_options"
  | "mediation_system"
  | "mediation_nudge";

export type PartyAdaptations = {
  party_a: string;
  party_b: string;
};

export type MediationOption = {
  id: string;
  canonicalDescription: string;
  legalNorms: string;
  fulfillmentProbability: string;
  refusalRisks: string;
  partyA: string;
  partyB: string;
};

export type DraftObligationSource = "dialogue" | "option" | "protective" | "mediator";

export type DraftObligation = {
  id: string;
  text: string;
  deadline: string | null;
  source: DraftObligationSource;
};

export type DraftAgreementStatus = "draft" | "published" | "accepted" | "rejected";

export type DraftAgreement = {
  title: string;
  body: string;
  /** Structured obligations (preferred). */
  obligations: DraftObligation[];
  /** Derived from obligations for legacy consumers. */
  terms: string[];
  protectiveClauseIds: string[];
  status: DraftAgreementStatus;
  publishedAt?: string;
  generatedAt: string;
};

export type MediationTurn = PartyRole | null;
