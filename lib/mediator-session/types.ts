import type { Locale } from "@/lib/i18n";
import type { MediationOption } from "@/lib/mediation/types";
import type { PartyRole } from "@/lib/participant-roles";

export type QuestionCandidateLocaleFields = {
  canonicalContent: string;
  partyA: string;
  partyB: string;
};

export type QuestionCandidate = QuestionCandidateLocaleFields & {
  id: string;
  byLocale?: Partial<Record<Locale, QuestionCandidateLocaleFields>>;
};

export type MediatorQuestionCandidates = {
  party_a: QuestionCandidate[];
  party_b: QuestionCandidate[];
};

export type PartyNotificationType =
  | "session_scheduled"
  | "start_window_open"
  | "peer_ready"
  | "session_started"
  | "question_received"
  | "options_ready"
  | "compromise_pending"
  | "compromise_ready"
  | "compromise_rejected"
  | "agreement_ready"
  | "session_time_up"
  | "session_completed";

export type PartyNotification = {
  id: string;
  type: PartyNotificationType;
  targetRole?: PartyRole | "all";
  at: string;
  payload?: Record<string, unknown>;
};

export type MediatorCompromiseDraft = MediationOption;
