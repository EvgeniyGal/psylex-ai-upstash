import { z } from "zod";

const adaptedMessageSchema = z.object({
  canonicalContent: z.string(),
  partyA: z.string(),
  partyB: z.string(),
});

const adaptedQuestionSchema = adaptedMessageSchema.extend({
  addressee: z.enum(["party_a", "party_b"]),
});

export const mediationOpeningSchema = adaptedMessageSchema;
export const mediationDialogueQuestionSchema = adaptedQuestionSchema;
export const mediationRoundSummarySchema = adaptedMessageSchema;
export const mediationModerationSchema = adaptedMessageSchema;
export const mediationNudgeSchema = adaptedMessageSchema;

const questionCandidateSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== "object" || Array.isArray(val)) return val;
    const obj = val as Record<string, unknown>;
    return {
      id: obj.id ?? obj.candidateId,
      canonicalContent: obj.canonicalContent ?? obj.canonical ?? obj.content,
      partyA: obj.partyA ?? obj.party_a ?? obj.forPartyA,
      partyB: obj.partyB ?? obj.party_b ?? obj.forPartyB,
    };
  },
  z.object({
    id: z.string(),
    canonicalContent: z.string(),
    partyA: z.string(),
    partyB: z.string(),
  }),
);

const partyCandidatesBlockSchema = z.preprocess((val) => {
  if (Array.isArray(val)) return { candidates: val };
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (Array.isArray(obj.candidates)) return obj;
    if (Array.isArray(obj.questions)) return { candidates: obj.questions };
  }
  return val;
}, z.object({
  candidates: z.array(questionCandidateSchema).length(3),
}));

export const mediationQuestionCandidatesSchema = z.preprocess((val) => {
  if (!val || typeof val !== "object" || Array.isArray(val)) return val;
  const obj = val as Record<string, unknown>;
  return {
    partyA: obj.partyA ?? obj.party_a,
    partyB: obj.partyB ?? obj.party_b,
  };
}, z.object({
  partyA: partyCandidatesBlockSchema,
  partyB: partyCandidatesBlockSchema,
}));

const mediationOptionSchema = z.object({
  id: z.string(),
  canonicalDescription: z.string(),
  legalNorms: z.string(),
  fulfillmentProbability: z.string(),
  refusalRisks: z.string(),
  partyA: z.string(),
  partyB: z.string(),
});

export const mediationOptionsSchema = z.object({
  options: z.array(mediationOptionSchema).min(2).max(3),
});

export const mediationCompromiseSchema = z.object({
  option: mediationOptionSchema,
});

const draftObligationSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  deadline: z.string().nullable().optional(),
  source: z.enum(["dialogue", "option", "protective", "mediator"]).optional(),
});

export const mediationAgreementDraftSchema = z.object({
  title: z.string(),
  body: z.string(),
  /** Prefer structured obligations; terms kept for backward-compatible model output. */
  obligations: z.array(draftObligationSchema).optional(),
  terms: z.array(z.string()).optional(),
});

export type MediationOpening = z.infer<typeof mediationOpeningSchema>;
export type MediationDialogueQuestion = z.infer<typeof mediationDialogueQuestionSchema>;
export type MediationRoundSummary = z.infer<typeof mediationRoundSummarySchema>;
export type MediationQuestionCandidates = z.infer<typeof mediationQuestionCandidatesSchema>;
export type MediationOptionsOutput = z.infer<typeof mediationOptionsSchema>;
export type MediationCompromiseOutput = z.infer<typeof mediationCompromiseSchema>;
export type MediationAgreementDraft = z.infer<typeof mediationAgreementDraftSchema>;

export type MediationAgentMode =
  | "opening"
  | "dialogue_question"
  | "question_candidates"
  | "round_summary"
  | "moderation_redirect"
  | "nudge"
  | "options"
  | "compromise"
  | "agreement_draft";

export const mediationModeInstructions: Record<MediationAgentMode, string> = {
  opening:
    'Run mode "opening". Present the dispute situation to both parties with identical substance and per-party adapted text.',
  dialogue_question:
    'Run mode "dialogue_question". Ask one structured question to the addressee party. Include "addressee": "party_a" | "party_b".',
  question_candidates:
    'Run mode "question_candidates". Return JSON with this exact shape: {"partyA":{"candidates":[{"id":"a1","canonicalContent":"...","partyA":"...","partyB":"..."},{"id":"a2",...},{"id":"a3",...}]},"partyB":{"candidates":[{"id":"b1","canonicalContent":"...","partyA":"...","partyB":"..."},{"id":"b2",...},{"id":"b3",...}]}}. Generate exactly three candidates under partyA.candidates (questions intended for party_a) and exactly three under partyB.candidates (questions intended for party_b). Tailor each using psychodynamic profiles, emotional triggers, interests, and legal analysis. partyA/partyB fields on each candidate are adapted wording for each party; do not return arrays at the partyA/partyB roots.',
  round_summary:
    'Run mode "round_summary". Summarize what was heard from both parties this round.',
  moderation_redirect:
    'Run mode "moderation_redirect". Redirect the party away from personal attacks toward substance.',
  nudge: 'Run mode "nudge". Gently prompt the party to respond to the current question.',
  options:
    'Run mode "options". Generate 2-3 solution options grounded FIRST in the live dialogue transcript. Prefer proposals the parties actually discussed or confirmed in session. Do not invent options that appear only in intake/background unless restated in the dialogue. Include legal information (not advice), fulfillment probability, refusal risks, and per-party presentations for voting only.',
  compromise:
    'Run mode "compromise". Generate exactly one compromise option informed by the parties\' votes.',
  agreement_draft:
    'Run mode "agreement_draft". Produce ONE shared voluntary agreement in third person (not "I agree"). Prefer mutually confirmed terms from the dialogue transcript over option-template wording when they conflict. Return title, body (third-person narrative), and obligations: [{text, deadline|null, source:"dialogue"|"option"}]. Include deadlines when discussed. Do not invent material terms that contradict the chat or that were not grounded in this dispute.',
};
