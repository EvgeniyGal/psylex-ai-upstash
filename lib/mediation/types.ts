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

export type MediationOptionLocaleFields = {
  canonicalDescription: string;
  legalNorms: string;
  fulfillmentProbability: string;
  refusalRisks: string;
  partyA: string;
  partyB: string;
};

export type MediationOption = MediationOptionLocaleFields & {
  id: string;
  /** Localized copies when parties (or downloads) use different UI languages. */
  byLocale?: Partial<Record<"en" | "uk", MediationOptionLocaleFields>>;
};

export type DraftObligationSource = "dialogue" | "option" | "protective" | "mediator";

export type DraftObligation = {
  id: string;
  text: string;
  deadline: string | null;
  source: DraftObligationSource;
};

export type DraftAgreementStatus = "draft" | "published" | "accepted" | "rejected";

export type DraftAgreementLocaleFields = {
  title: string;
  body: string;
  obligations: DraftObligation[];
  terms: string[];
};

export type DraftAgreement = DraftAgreementLocaleFields & {
  protectiveClauseIds: string[];
  status: DraftAgreementStatus;
  publishedAt?: string;
  generatedAt: string;
  byLocale?: Partial<Record<"en" | "uk", DraftAgreementLocaleFields>>;
};

export type MediationTurn = PartyRole | null;
