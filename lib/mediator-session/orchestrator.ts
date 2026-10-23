import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import {
  assembleMediationContext,
  isAttackHeuristic,
  partyRoleFromUser,
} from "@/lib/mediation/assemble-input";
import {
  dedupeConsecutiveViewerMessages,
  insertAgentMessage,
  insertParticipantMessage,
  insertSystemMessage,
  isMessageVisibleToViewer,
  isSharedBroadcastAgentMessage,
  latestUnansweredQuestionForParty,
  listRoomMessages,
  partyHasUnansweredQuestion,
  resolveAgentMessageTargetUserId,
  resolveMessageViewForViewer,
  toPartyAdaptations,
} from "@/lib/mediation/messages";
import { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";
import type { MessageTranslations } from "@/lib/mediation/translate";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { runMediationAgent } from "@/lib/mediation/run-agent";
import {
  mediationAgreementDraftSchema,
  mediationCompromiseSchema,
  mediationModerationSchema,
  mediationOptionsSchema,
  mediationQuestionCandidatesSchema,
} from "@/lib/mediation/schemas";
import { buildMediationResultsSummary } from "@/lib/mediation/results-summary";
import type {
  DraftAgreement,
  MediationOption,
  MediationPhase,
  PartyAdaptations,
} from "@/lib/mediation/types";
import { setPartyNotification } from "@/lib/mediator-session/notifications";
import {
  isMediatorFacilitatedRoom,
  isMediatorSessionEnded,
} from "@/lib/mediator-session/room-mode";
import type {
  MediatorQuestionCandidates,
  QuestionCandidate,
} from "@/lib/mediator-session/types";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { getRoomPartiesForPipeline, isPostIntakePipelineComplete } from "@/lib/pipeline/gate";
import type { PartyRole } from "@/lib/participant-roles";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/portal-i18n";
import { notifyRoom } from "@/lib/realtime/notify";

type RoomRow = typeof rooms.$inferSelect;

const agentWork = new Set<string>();

async function loadRoom(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  return room ?? null;
}

async function setPhase(roomId: string, phase: MediationPhase, payload?: Record<string, unknown>) {
  await db.update(rooms).set({ mediationPhase: phase }).where(eq(rooms.id, roomId));
  notifyRoom(roomId);
  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "mediation_phase_changed",
    payload: { phase, mode: "mediator_facilitated", ...payload },
  });
}

async function buildContext(room: RoomRow) {
  const { partyA, partyB } = await getRoomPartiesForPipeline(room.id);
  if (!partyA || !partyB) throw new Error("Room parties missing.");

  const messages = await listRoomMessages(room.id);
  const ctx = assembleMediationContext({
    room,
    partyA,
    partyB,
    messages: messages.map((m) => ({
      content: m.canonicalContent ?? m.content,
      senderType: m.senderType,
      messageKind: m.messageKind,
      createdAt: m.createdAt,
    })),
  });

  return { partyA, partyB, ctx };
}

export async function startMediatorSession(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room?.mediationStartedAt || !isMediatorFacilitatedRoom(room)) return;
  if (room.mediationPhase) return;

  const complete = await isPostIntakePipelineComplete(roomId);
  if (!complete) return;

  const [claimed] = await db
    .update(rooms)
    .set({ mediationPhase: "dialogue", mediationRound: 0 })
    .where(and(eq(rooms.id, roomId), isNull(rooms.mediationPhase)))
    .returning({ id: rooms.id });

  if (!claimed) return;

  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  const partyALocale: Locale = partyA?.preferredLocale === "uk" ? "uk" : "en";
  const partyBLocale: Locale = partyB?.preferredLocale === "uk" ? "uk" : "en";
  const canonical = portalCopy.en.modeBSessionStarted;

  await insertSystemMessage({
    roomId,
    content: canonical,
    canonicalContent: canonical,
    adaptations: {
      party_a: portalCopy[partyALocale].modeBSessionStarted,
      party_b: portalCopy[partyBLocale].modeBSessionStarted,
    },
  });

  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "agent_started",
    payload: { step: "mediator_session_start" },
  });
}

export async function generateQuestionCandidates(roomId: string, mediatorUserId: string) {
  const room = await assertMediatorOwnsRoom(roomId, mediatorUserId);
  if (!room.mediationStartedAt) throw new Error("Session has not started.");
  if (room.mediationPhase !== "dialogue" && room.mediationPhase !== "opening") {
    throw new Error("Questions can only be generated during dialogue.");
  }

  if (agentWork.has(roomId)) throw new Error("Generation already in progress.");
  agentWork.add(roomId);
  try {
    const { ctx } = await buildContext(room);
    const result = await runMediationAgent({
      mode: "question_candidates",
      context: ctx,
      schema: mediationQuestionCandidatesSchema,
    });

    const candidates: MediatorQuestionCandidates = {
      party_a: result.partyA.candidates.map((c) => ({
        id: c.id,
        canonicalContent: c.canonicalContent,
        partyA: c.partyA,
        partyB: c.partyB,
      })),
      party_b: result.partyB.candidates.map((c) => ({
        id: c.id,
        canonicalContent: c.canonicalContent,
        partyA: c.partyA,
        partyB: c.partyB,
      })),
    };

    await db
      .update(rooms)
      .set({ mediatorQuestionCandidates: candidates })
      .where(eq(rooms.id, roomId));

    await logPipelineEvent({
      roomId,
      agentKey: "mediation",
      eventType: "agent_completed",
      payload: { step: "question_candidates" },
    });

    return candidates;
  } finally {
    agentWork.delete(roomId);
  }
}

export type MediatorAudience = PartyRole | "both";

async function deliverMediatorQuestion(params: {
  roomId: string;
  audience: MediatorAudience;
  mediatorUserId: string;
  canonicalContent: string;
  adaptations: PartyAdaptations;
  /** UI / authoring locale for free-text translation. */
  sourceLocale?: Locale | null;
  /** False for LLM candidates (adaptations already localized per party). */
  translate?: boolean;
  translations?: MessageTranslations | null;
}) {
  const { partyA, partyB } = await getRoomPartiesForPipeline(params.roomId);
  if (!partyA || !partyB) throw new Error("Party not found.");

  const isBoth = params.audience === "both";
  const addressee = isBoth
    ? null
    : params.audience === "party_a"
      ? partyA
      : partyB;
  if (!isBoth && !addressee) throw new Error("Party not found.");

  await insertAgentMessage({
    roomId: params.roomId,
    canonicalContent: params.canonicalContent,
    adaptations: params.adaptations,
    messageKind: "mediation_question",
    addresseeUserId: addressee?.id ?? null,
    channel: isBoth ? "shared" : "private",
    senderUserId: params.mediatorUserId,
    sourceLocale: params.sourceLocale,
    translate: params.translate,
    translations: params.translations,
  });

  await db
    .update(rooms)
    .set({
      // Mode B: parties answer independently — do not lock a single active party.
      mediationTurnDeadlineAt: null,
      mediationTurnNudged: false,
    })
    .where(eq(rooms.id, params.roomId));

  await setPartyNotification({
    roomId: params.roomId,
    type: "question_received",
    targetRole: isBoth ? "all" : (params.audience as PartyRole),
  });
}

function assertCanGenerateQuestions(phase: string | null) {
  if (phase !== "dialogue" && phase !== "opening") {
    throw new Error("Dialogue is not active.");
  }
}

function assertSessionAllowsMediatorSend(phase: string | null) {
  if (phase === "completed" || phase === "agreement") {
    throw new Error("Session already ended.");
  }
  if (!phase) {
    throw new Error("Session has not started.");
  }
}

export async function sendMediatorQuestion(params: {
  roomId: string;
  mediatorUserId: string;
  partyRole: PartyRole;
  candidateId: string;
  editedText?: string;
  /** Mediator UI locale — required when the candidate text was edited. */
  sourceLocale?: Locale;
}) {
  const room = await assertMediatorOwnsRoom(params.roomId, params.mediatorUserId);
  assertCanGenerateQuestions(room.mediationPhase);

  const stored = (room.mediatorQuestionCandidates as MediatorQuestionCandidates | null) ?? {
    party_a: [],
    party_b: [],
  };
  const list = params.partyRole === "party_a" ? stored.party_a : stored.party_b;
  const candidate = list.find((c) => c.id === params.candidateId);
  if (!candidate) throw new Error("Candidate not found.");

  const baseline =
    params.partyRole === "party_a" ? candidate.partyA.trim() : candidate.partyB.trim();
  const edited = params.editedText?.trim();
  // UI always prefills the textarea — only treat as free-text when it differs.
  const isFreeTextEdit = !!edited && edited !== baseline;

  let canonicalContent = candidate.canonicalContent;
  let adaptations: PartyAdaptations =
    params.partyRole === "party_a"
      ? { party_a: candidate.partyA, party_b: candidate.partyB }
      : { party_a: candidate.partyA, party_b: candidate.partyB };
  let sourceLocale: Locale | null = null;
  let translations: MessageTranslations | null = null;
  let translate = false;

  if (isFreeTextEdit && edited) {
    const { bilingualTranslationsFromContent } = await import("@/lib/mediation/translate");
    const bilingual = await bilingualTranslationsFromContent({
      content: edited,
      hint: params.sourceLocale,
    });
    sourceLocale = bilingual.sourceLocale;
    translations = bilingual.translations;
    canonicalContent = edited;
    const { partyA, partyB } = await getRoomPartiesForPipeline(params.roomId);
    const partyALocale = normalizeLocale(partyA?.preferredLocale);
    const partyBLocale = normalizeLocale(partyB?.preferredLocale);
    adaptations = {
      party_a: translations[partyALocale] ?? edited,
      party_b: translations[partyBLocale] ?? edited,
    };
    translate = false; // translations already built
  }

  await deliverMediatorQuestion({
    roomId: params.roomId,
    audience: params.partyRole,
    mediatorUserId: params.mediatorUserId,
    canonicalContent,
    adaptations,
    sourceLocale,
    translate,
    translations,
  });

  const nextCandidates: MediatorQuestionCandidates = {
    party_a: params.partyRole === "party_a" ? [] : stored.party_a,
    party_b: params.partyRole === "party_b" ? [] : stored.party_b,
  };

  await db
    .update(rooms)
    .set({ mediatorQuestionCandidates: nextCandidates })
    .where(eq(rooms.id, params.roomId));
}

export async function sendCustomMediatorQuestion(params: {
  roomId: string;
  mediatorUserId: string;
  audience: MediatorAudience;
  text: string;
  /** Locale the mediator typed in (UI locale). */
  sourceLocale: Locale;
}) {
  const room = await assertMediatorOwnsRoom(params.roomId, params.mediatorUserId);
  assertSessionAllowsMediatorSend(room.mediationPhase);

  const text = params.text.trim();
  if (!text) throw new Error("Question cannot be empty.");

  const { bilingualTranslationsFromContent } = await import("@/lib/mediation/translate");
  const { sourceLocale, translations } = await bilingualTranslationsFromContent({
    content: text,
    hint: params.sourceLocale,
  });

  const { partyA, partyB } = await getRoomPartiesForPipeline(params.roomId);
  if (!partyA || !partyB) throw new Error("Party not found.");

  const partyALocale = normalizeLocale(partyA.preferredLocale);
  const partyBLocale = normalizeLocale(partyB.preferredLocale);

  await deliverMediatorQuestion({
    roomId: params.roomId,
    audience: params.audience,
    mediatorUserId: params.mediatorUserId,
    canonicalContent: text,
    adaptations: {
      party_a: translations[partyALocale] ?? text,
      party_b: translations[partyBLocale] ?? text,
    },
    sourceLocale,
    translate: false,
    translations,
  });
}

export async function submitMediatorPartyReply(userId: string, content: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || !isMediatorFacilitatedRoom(room)) throw new Error("Not a mediator room.");
  assertSessionAllowsMediatorSend(room.mediationPhase);

  const role = partyRoleFromUser(participant.user);
  const { partyA, partyB } = await getRoomPartiesForPipeline(room.id);
  if (!partyA || !partyB) throw new Error("Parties not found.");

  const messages = await listRoomMessages(room.id);
  const pendingQuestion = latestUnansweredQuestionForParty(
    messages,
    userId,
    partyA.id,
    partyB.id,
  );
  if (!pendingQuestion) {
    throw new Error("No open question to answer.");
  }

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Reply cannot be empty.");

  if (isAttackHeuristic(trimmed)) {
    const { ctx } = await buildContext(room);
    const redirect = await runMediationAgent({
      mode: "moderation_redirect",
      context: ctx,
      schema: mediationModerationSchema,
      extraInstruction: `Redirect ${role} after a personal attack.`,
    });

    await insertAgentMessage({
      roomId: room.id,
      canonicalContent: redirect.canonicalContent,
      adaptations: toPartyAdaptations(redirect),
      messageKind: "mediation_moderation",
      addresseeUserId: userId,
      channel: "private",
    });

    return { moderated: true as const };
  }

  const replyChannel =
    pendingQuestion.channel === "private" || pendingQuestion.participantUserId
      ? "private"
      : "shared";

  await insertParticipantMessage({
    roomId: room.id,
    userId,
    content: trimmed,
    channel: replyChannel,
  });

  return { moderated: false as const };
}

export async function generateMediatorOptions(roomId: string, mediatorUserId: string) {
  const room = await assertMediatorOwnsRoom(roomId, mediatorUserId);
  if (!room.mediationStartedAt) throw new Error("Session has not started.");
  if (room.mediationPhase === "completed" || room.mediationPhase === "agreement") {
    throw new Error("Cannot generate options after agreement.");
  }

  if (agentWork.has(roomId)) throw new Error("Generation already in progress.");
  agentWork.add(roomId);
  try {
    await setPhase(roomId, "generating_options", { reason: "mediator_requested" });

    const fresh = (await loadRoom(roomId)) ?? room;
    const { ctx, partyA, partyB } = await buildContext(fresh);
    const { generateLocalizedOptions } = await import("@/lib/mediation/generate-localized");
    const options = await generateLocalizedOptions({
      context: ctx,
      partyALocale: partyA?.preferredLocale,
      partyBLocale: partyB?.preferredLocale,
    });

    await db
      .update(rooms)
      .set({
        mediationOptions: options,
        mediationPhase: "voting",
        partyAVoteOptionId: null,
        partyBVoteOptionId: null,
        compromiseOption: null,
        mediatorCompromiseDraft: null,
        partyACompromiseVote: null,
        partyBCompromiseVote: null,
        selectedOptionId: null,
        mediationActiveParty: null,
      })
      .where(eq(rooms.id, roomId));

    await logPipelineEvent({
      roomId,
      agentKey: "mediation",
      eventType: "options_published",
      payload: {
        options: options.map((o) => ({
          id: o.id,
          canonicalDescription: o.canonicalDescription,
        })),
      },
    });

    await setPartyNotification({
      roomId,
      type: "options_ready",
      targetRole: "all",
    });

    return options;
  } finally {
    agentWork.delete(roomId);
  }
}

async function generateCompromiseDraft(room: RoomRow) {
  if (room.mediationPhase !== "voting_discrepancy") return;
  if (room.mediatorCompromiseDraft || room.compromiseOption) return;
  if (!room.partyAVoteOptionId || !room.partyBVoteOptionId) return;
  if (agentWork.has(room.id)) return;

  agentWork.add(room.id);
  try {
    const fresh = await loadRoom(room.id);
    if (!fresh || fresh.mediatorCompromiseDraft || fresh.compromiseOption) return;

    const { ctx, partyA, partyB } = await buildContext(fresh);
    const { generateLocalizedCompromise } = await import("@/lib/mediation/generate-localized");
    const draft = await generateLocalizedCompromise({
      context: ctx,
      partyALocale: partyA?.preferredLocale,
      partyBLocale: partyB?.preferredLocale,
      extraInstruction: `Party A voted ${fresh.partyAVoteOptionId}, Party B voted ${fresh.partyBVoteOptionId}.`,
    });

    await db
      .update(rooms)
      .set({ mediatorCompromiseDraft: draft })
      .where(eq(rooms.id, room.id));
  } finally {
    agentWork.delete(room.id);
  }
}

export async function publishMediatorCompromise(params: {
  roomId: string;
  mediatorUserId: string;
  draft: MediationOption;
}) {
  const room = await assertMediatorOwnsRoom(params.roomId, params.mediatorUserId);
  if (room.mediationPhase !== "voting_discrepancy") {
    throw new Error("Compromise publishing is not available.");
  }

  const existing =
    (room.mediatorCompromiseDraft as MediationOption | null) ??
    (room.compromiseOption as MediationOption | null);
  const [mediatorRow] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, params.mediatorUserId))
    .limit(1);
  const mediatorLocale: Locale = mediatorRow?.preferredLocale === "uk" ? "uk" : "en";
  const otherLocale: Locale = mediatorLocale === "uk" ? "en" : "uk";
  const {
    optionFieldsFrom,
    mergeOptionLocales,
    repairOptionFieldsLocale,
  } = await import("@/lib/mediation/localize-artifacts");
  const { translateText } = await import("@/lib/mediation/translate");

  const editedFields = await repairOptionFieldsLocale(
    optionFieldsFrom(params.draft),
    mediatorLocale,
  );
  const existingOther = existing?.byLocale?.[otherLocale];
  let otherFields = existingOther ? optionFieldsFrom(existingOther) : null;
  if (!otherFields) {
    const keys = [
      "canonicalDescription",
      "legalNorms",
      "fulfillmentProbability",
      "refusalRisks",
      "partyA",
      "partyB",
    ] as const;
    const translated = await Promise.all(
      keys.map(async (key) => [
        key,
        await translateText({
          text: editedFields[key],
          from: mediatorLocale,
          to: otherLocale,
        }),
      ]),
    );
    otherFields = Object.fromEntries(translated) as typeof editedFields;
  }

  const merged = mergeOptionLocales("en", {
    [mediatorLocale]: { id: params.draft.id, ...editedFields },
    [otherLocale]: { id: params.draft.id, ...otherFields },
  });

  await db
    .update(rooms)
    .set({
      compromiseOption: merged,
      mediatorCompromiseDraft: merged,
      partyACompromiseVote: null,
      partyBCompromiseVote: null,
    })
    .where(eq(rooms.id, params.roomId));

  await setPartyNotification({
    roomId: params.roomId,
    type: "compromise_ready",
    targetRole: "all",
  });

  await logPipelineEvent({
    roomId: params.roomId,
    agentKey: "mediation",
    eventType: "compromise_published",
    payload: {
      optionId: merged.id,
      canonicalDescription: merged.canonicalDescription,
      byLocaleKeys: Object.keys(merged.byLocale ?? {}),
    },
  });

  return getMediatorConsoleSessionState(params.mediatorUserId, params.roomId);
}

export async function castMediatorPartyVote(userId: string, optionId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || !isMediatorFacilitatedRoom(room) || room.mediationPhase !== "voting") {
    throw new Error("Voting is not open.");
  }

  const options = (room.mediationOptions as MediationOption[] | null) ?? [];
  if (!options.some((option) => option.id === optionId)) throw new Error("Invalid option.");

  const role = partyRoleFromUser(participant.user);
  const patch =
    role === "party_a" ? { partyAVoteOptionId: optionId } : { partyBVoteOptionId: optionId };

  const votedOption = options.find((o) => o.id === optionId);
  await db.update(rooms).set(patch).where(eq(rooms.id, room.id));
  notifyRoom(room.id);

  await logPipelineEvent({
    roomId: room.id,
    agentKey: "mediation",
    eventType: "option_vote_cast",
    payload: {
      partyRole: role,
      optionId,
      canonicalDescription: votedOption?.canonicalDescription ?? null,
    },
  });

  const updated = await loadRoom(room.id);
  if (!updated?.partyAVoteOptionId || !updated.partyBVoteOptionId) return updated;

  if (updated.partyAVoteOptionId === updated.partyBVoteOptionId) {
    await db
      .update(rooms)
      .set({
        selectedOptionId: updated.partyAVoteOptionId,
        mediationPhase: "agreement",
      })
      .where(eq(rooms.id, room.id));
    await ensureDraftAgreement(room.id, updated.partyAVoteOptionId);
    // Parties are notified when the mediator publishes the draft.
    notifyRoom(room.id);
    return loadRoom(room.id);
  }

  await setPhase(room.id, "voting_discrepancy");
  await db
    .update(rooms)
    .set({
      compromiseOption: null,
      mediatorCompromiseDraft: null,
      partyACompromiseVote: null,
      partyBCompromiseVote: null,
    })
    .where(eq(rooms.id, room.id));

  await setPartyNotification({
    roomId: room.id,
    type: "compromise_pending",
    targetRole: "all",
  });

  const discrepancyRoom = await loadRoom(room.id);
  if (discrepancyRoom) await generateCompromiseDraft(discrepancyRoom);
  return loadRoom(room.id);
}

export async function castMediatorCompromiseVote(userId: string, accepted: boolean) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || !isMediatorFacilitatedRoom(room) || room.mediationPhase !== "voting_discrepancy") {
    throw new Error("Compromise vote is not open.");
  }
  if (!room.compromiseOption) throw new Error("Compromise has not been published yet.");

  const role = partyRoleFromUser(participant.user);
  const patch =
    role === "party_a" ? { partyACompromiseVote: accepted } : { partyBCompromiseVote: accepted };

  await db.update(rooms).set(patch).where(eq(rooms.id, room.id));
  notifyRoom(room.id);
  const updated = await loadRoom(room.id);
  if (!updated) return null;

  if (updated.partyACompromiseVote === null || updated.partyBCompromiseVote === null) {
    return updated;
  }

  if (updated.partyACompromiseVote && updated.partyBCompromiseVote) {
    const compromise = updated.compromiseOption as MediationOption | null;
    if (!compromise) throw new Error("Compromise option missing.");

    await db
      .update(rooms)
      .set({
        selectedOptionId: compromise.id,
        mediationPhase: "agreement",
      })
      .where(eq(rooms.id, room.id));

    await ensureDraftAgreement(room.id, compromise.id);
    notifyRoom(room.id);
    return loadRoom(room.id);
  }

  await db
    .update(rooms)
    .set({
      mediationPhase: "completed",
      mediationCompletedAt: new Date(),
    })
    .where(eq(rooms.id, room.id));

  await logPipelineEvent({
    roomId: room.id,
    agentKey: "mediation",
    eventType: "session_ended_without_agreement",
    payload: { reason: "compromise_rejected" },
  });

  await setPartyNotification({
    roomId: room.id,
    type: "session_completed",
    targetRole: "all",
  });

  return loadRoom(room.id);
}

/** Mediator force-end: same outcome as no mutual agreement (phase completed). */
export async function endMediatorSession(mediatorUserId: string, roomId: string) {
  const room = await loadRoom(roomId);
  if (!room || !isMediatorFacilitatedRoom(room) || room.createdByUserId !== mediatorUserId) {
    throw new Error("Unauthorized");
  }
  if (!room.mediationStartedAt) {
    throw new Error("Session has not started.");
  }
  if (isMediatorSessionEnded(room.mediationPhase) || room.mediationCompletedAt) {
    throw new Error("Session already ended.");
  }

  await db
    .update(rooms)
    .set({
      mediationPhase: "completed",
      mediationCompletedAt: new Date(),
    })
    .where(eq(rooms.id, roomId));
  notifyRoom(roomId);

  await setPartyNotification({
    roomId,
    type: "session_completed",
    targetRole: "all",
  });

  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "session_ended_without_agreement",
    payload: { reason: "mediator_ended" },
  });

  return getMediatorConsoleSessionState(mediatorUserId, roomId);
}

export async function saveMediatorDraftAgreement(
  mediatorUserId: string,
  roomId: string,
  draft: DraftAgreement,
) {
  const room = await assertMediatorOwnsRoom(roomId, mediatorUserId);
  if (room.mediationPhase !== "agreement") {
    throw new Error("Agreement draft can only be edited in the agreement phase.");
  }

  const { mergeProtectiveClausesIntoDraft, normalizeDraftAgreement, obligationsToTerms } =
    await import("@/lib/mediation/draft-agreement");

  let next = normalizeDraftAgreement({
    title: draft.title,
    body: draft.body,
    terms: draft.terms,
    obligations: draft.obligations,
    protectiveClauseIds: draft.protectiveClauseIds,
    status: draft.status === "published" ? "published" : "draft",
    publishedAt: draft.status === "published" ? draft.publishedAt : undefined,
    generatedAt: draft.generatedAt || new Date().toISOString(),
  });
  const [mediatorRow] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, mediatorUserId))
    .limit(1);
  const mediatorLocale: Locale = mediatorRow?.preferredLocale === "uk" ? "uk" : "en";
  const otherLocale: Locale = mediatorLocale === "uk" ? "en" : "uk";
  next = mergeProtectiveClausesIntoDraft(next, next.protectiveClauseIds, mediatorLocale);

  const existing = room.draftAgreement as DraftAgreement | null;
  const editedSlot = {
    title: next.title,
    body: next.body,
    obligations: next.obligations,
    terms: next.terms,
  };
  const priorByLocale = draft.byLocale ?? existing?.byLocale ?? {};
  let otherSlot = priorByLocale[otherLocale] ?? null;
  if (!otherSlot) {
    const { translateText } = await import("@/lib/mediation/translate");
    otherSlot = {
      title: await translateText({ text: next.title, from: mediatorLocale, to: otherLocale }),
      body: await translateText({ text: next.body, from: mediatorLocale, to: otherLocale }),
      obligations: await Promise.all(
        next.obligations.map(async (o) => ({
          ...o,
          text: await translateText({ text: o.text, from: mediatorLocale, to: otherLocale }),
        })),
      ),
      terms: [],
    };
    otherSlot.terms = obligationsToTerms(otherSlot.obligations);
  }
  next = {
    ...next,
    byLocale: {
      ...priorByLocale,
      [mediatorLocale]: editedSlot,
      [otherLocale]: otherSlot,
    },
    terms: obligationsToTerms(next.obligations),
  };

  await db.update(rooms).set({ draftAgreement: next }).where(eq(rooms.id, roomId));
  notifyRoom(roomId);
  return getMediatorConsoleSessionState(mediatorUserId, roomId);
}

export async function publishMediatorDraftAgreement(mediatorUserId: string, roomId: string) {
  const room = await assertMediatorOwnsRoom(roomId, mediatorUserId);
  if (room.mediationPhase !== "agreement") {
    throw new Error("Nothing to publish.");
  }
  const existing = room.draftAgreement as DraftAgreement | null;
  if (!existing) throw new Error("Draft agreement missing.");

  const { normalizeDraftAgreement, obligationsToTerms } = await import(
    "@/lib/mediation/draft-agreement"
  );
  const published = {
    ...normalizeDraftAgreement({
      title: existing.title,
      body: existing.body,
      obligations: existing.obligations,
      protectiveClauseIds: existing.protectiveClauseIds,
      status: "published",
      publishedAt: new Date().toISOString(),
      generatedAt: existing.generatedAt,
      terms: obligationsToTerms(existing.obligations ?? []),
    }),
    // Preserve bilingual copies — normalizeDraftAgreement drops byLocale.
    ...(existing.byLocale ? { byLocale: existing.byLocale } : {}),
  };

  await db.update(rooms).set({ draftAgreement: published }).where(eq(rooms.id, roomId));
  await setPartyNotification({
    roomId,
    type: "agreement_ready",
    targetRole: "all",
  });
  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "agreement_published",
    payload: {
      title: published.title,
      terms: published.terms,
    },
  });
  return getMediatorConsoleSessionState(mediatorUserId, roomId);
}

export async function returnMediatorSessionToDialogue(mediatorUserId: string, roomId: string) {
  await assertMediatorOwnsRoom(roomId, mediatorUserId);

  await db
    .update(rooms)
    .set({
      mediationPhase: "dialogue",
      mediationOptions: null,
      partyAVoteOptionId: null,
      partyBVoteOptionId: null,
      compromiseOption: null,
      mediatorCompromiseDraft: null,
      partyACompromiseVote: null,
      partyBCompromiseVote: null,
      selectedOptionId: null,
      draftAgreement: null,
      mediatorQuestionCandidates: null,
    })
    .where(eq(rooms.id, roomId));
  notifyRoom(roomId);

  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "mediation_phase_changed",
    payload: { phase: "dialogue", reason: "return_to_dialogue" },
  });

  return getMediatorConsoleSessionState(mediatorUserId, roomId);
}

async function ensureDraftAgreement(roomId: string, optionId: string) {
  const room = await loadRoom(roomId);
  if (!room || room.draftAgreement) return;
  if (agentWork.has(roomId)) return;

  agentWork.add(roomId);
  try {
    const fresh = await loadRoom(roomId);
    if (!fresh || fresh.draftAgreement) return;

    const { defaultSuggestedProtectiveIds, mergeProtectiveClausesIntoDraft, normalizeDraftAgreement } =
      await import("@/lib/mediation/draft-agreement");
    const { buildAgreementDraftExtraInstruction, findOptionInRoom } = await import(
      "@/lib/mediation/build-agreement-extra"
    );

    const options = (fresh.mediationOptions as MediationOption[] | null) ?? [];
    const compromise = fresh.compromiseOption as MediationOption | null;
    const option = findOptionInRoom(options, compromise, optionId);
    const roomText = [
      fresh.title,
      option?.canonicalDescription,
      ...options.map((o) => o.canonicalDescription),
    ]
      .filter(Boolean)
      .join("\n");
    const suggestedProtectiveIds = defaultSuggestedProtectiveIds(roomText);

    const { ctx, partyA, partyB } = await buildContext(fresh);
    const { generateLocalizedAgreementDraft } = await import("@/lib/mediation/generate-localized");
    const agreement = await generateLocalizedAgreementDraft({
      context: ctx,
      partyALocale: partyA?.preferredLocale,
      partyBLocale: partyB?.preferredLocale,
      extraInstruction: (locale) =>
        buildAgreementDraftExtraInstruction({
          optionId,
          option,
          suggestedProtectiveIds,
          targetLocale: locale,
        }),
      normalize: normalizeDraftAgreement,
      mergeProtective: mergeProtectiveClausesIntoDraft,
      suggestedProtectiveIds,
      status: "draft",
    });

    await db.update(rooms).set({ draftAgreement: agreement }).where(eq(rooms.id, roomId));
    notifyRoom(roomId);
  } finally {
    agentWork.delete(roomId);
  }
}

async function assertMediatorOwnsRoom(roomId: string, mediatorUserId: string) {
  const room = await loadRoom(roomId);
  if (!room || !isMediatorFacilitatedRoom(room) || room.createdByUserId !== mediatorUserId) {
    throw new Error("Unauthorized");
  }
  return room;
}

function emptyCandidates(): MediatorQuestionCandidates {
  return { party_a: [], party_b: [] };
}

export async function getMediatorSessionRoomState(userId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) return null;

  const room = await loadRoom(participant.roomId);
  if (!room?.mediationStartedAt || !isMediatorFacilitatedRoom(room)) return null;

  if (!room.mediationPhase) {
    await startMediatorSession(room.id);
  }

  let fresh = (await loadRoom(room.id)) ?? room;
  if (fresh.mediationPhase === "voting_discrepancy" && !fresh.mediatorCompromiseDraft && !fresh.compromiseOption) {
    await generateCompromiseDraft(fresh);
    fresh = (await loadRoom(room.id)) ?? fresh;
  }
  if (fresh.mediationPhase === "agreement" && !fresh.draftAgreement && fresh.selectedOptionId) {
    await ensureDraftAgreement(room.id, fresh.selectedOptionId);
    fresh = (await loadRoom(room.id)) ?? fresh;
  }

  return buildSessionState(fresh, userId, participant.user.preferredLocale, "party");
}

export async function getMediatorConsoleSessionState(mediatorUserId: string, roomId: string) {
  const room = await loadRoom(roomId);
  if (!room || room.createdByUserId !== mediatorUserId || !room.mediationStartedAt) {
    return null;
  }

  if (!room.mediationPhase) {
    await startMediatorSession(room.id);
  }

  let fresh = (await loadRoom(room.id)) ?? room;
  if (fresh.mediationPhase === "voting_discrepancy" && !fresh.mediatorCompromiseDraft && !fresh.compromiseOption) {
    await generateCompromiseDraft(fresh);
    fresh = (await loadRoom(room.id)) ?? fresh;
  }
  if (fresh.mediationPhase === "agreement" && !fresh.draftAgreement && fresh.selectedOptionId) {
    await ensureDraftAgreement(room.id, fresh.selectedOptionId);
    fresh = (await loadRoom(room.id)) ?? fresh;
  }

  const [mediatorRow] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, mediatorUserId))
    .limit(1);
  const locale: Locale = mediatorRow?.preferredLocale === "uk" ? "uk" : "en";

  return buildSessionState(fresh, mediatorUserId, locale, "mediator");
}

async function buildSessionState(
  room: RoomRow,
  viewerUserId: string,
  locale: "en" | "uk",
  viewerKind: "party" | "mediator",
) {
  const { partyA, partyB } = await getRoomPartiesForPipeline(room.id);
  const messages = await listRoomMessages(room.id);
  const options = (room.mediationOptions as MediationOption[] | null) ?? [];
  const compromise = room.compromiseOption as MediationOption | null;
  const compromiseDraft = room.mediatorCompromiseDraft as MediationOption | null;
  const candidates = (room.mediatorQuestionCandidates as MediatorQuestionCandidates | null) ?? emptyCandidates();

  const [mediatorUser] = room.createdByUserId
    ? await db
        .select({ id: users.id, title: users.title, login: users.login })
        .from(users)
        .where(eq(users.id, room.createdByUserId))
        .limit(1)
    : [];

  const mediatorTitle =
    mediatorUser?.title?.trim() || mediatorUser?.login?.trim() || "Mediator";

  const role =
    viewerKind === "mediator"
      ? null
      : partyA?.id === viewerUserId
        ? ("party_a" as const)
        : partyB?.id === viewerUserId
          ? ("party_b" as const)
          : null;

  const visibilityContext = {
    allMessages: messages,
    partyAUserId: partyA?.id ?? "",
    partyBUserId: partyB?.id ?? "",
    shareParticipantReplies: true,
  };

  const roleForUserId = (userId: string | null | undefined): PartyRole | null => {
    if (!userId) return null;
    if (partyA?.id === userId) return "party_a";
    if (partyB?.id === userId) return "party_b";
    return null;
  };

  const mapMessage = (message: (typeof messages)[number], forMediator: boolean) => {
    const isBroadcast = isSharedBroadcastAgentMessage(message);
    const addresseeUserId = isBroadcast
      ? null
      : message.senderType === "agent" && partyA?.id && partyB?.id
        ? resolveAgentMessageTargetUserId(message, messages, partyA.id, partyB.id)
        : message.participantUserId;
    const isMediatorAuthored =
      message.senderType === "agent" &&
      !!message.senderUserId &&
      message.senderUserId === room.createdByUserId;

    const isOwn = message.senderUserId === viewerUserId;
    let content: string;
    let isTranslated = false;
    let originalText: string | null = null;

    if (forMediator) {
      if (message.messageKind === "mediation_system") {
        content = resolveLocalizedSystemMessage(
          message.canonicalContent ?? message.content,
          locale,
        );
      } else {
        const translations = message.translations as MessageTranslations | null;
        const sourceLocale = message.sourceLocale
          ? normalizeLocale(message.sourceLocale)
          : null;
        const localized = translations?.[normalizeLocale(locale)];
        const original =
          (sourceLocale && translations?.[sourceLocale]) ||
          message.canonicalContent ||
          message.content;
        if (localized && sourceLocale && sourceLocale !== normalizeLocale(locale) && !isOwn) {
          content = localized;
          isTranslated = true;
          originalText = original;
        } else {
          content = localized ?? message.canonicalContent ?? message.content;
        }
      }
    } else {
      const view = resolveMessageViewForViewer(message, role!, locale);
      content = view.content;
      isTranslated = !!(view.isTranslated && !isOwn);
      originalText = isTranslated ? view.originalText : null;
    }

    return {
      id: message.id,
      senderType: message.senderType,
      messageKind: message.messageKind,
      channel: message.channel,
      content,
      createdAt: message.createdAt.toISOString(),
      isOwn,
      isTranslated,
      originalText,
      addresseeUserId,
      senderPartyRole: roleForUserId(message.senderUserId),
      addresseePartyRole: roleForUserId(addresseeUserId),
      isMediatorAuthored,
      isBroadcast,
    };
  };

  const viewerMessages = dedupeConsecutiveViewerMessages(
    viewerKind === "mediator"
      ? messages.map((message) => mapMessage(message, true))
      : messages
          .filter((message) =>
            partyA?.id && partyB?.id
              ? isMessageVisibleToViewer(message, viewerUserId, visibilityContext)
              : message.senderUserId === viewerUserId || message.senderType !== "participant",
          )
          .map((message) => mapMessage(message, false)),
  );

  const {
    descriptionForViewerRole,
    resolveDraftForLocale,
    resolveOptionForLocale,
  } = await import("@/lib/mediation/localize-artifacts");

  const mapOption = (option: MediationOption) => {
    const resolved = resolveOptionForLocale(option, locale);
    return {
      id: option.id,
      description:
        viewerKind === "mediator"
          ? resolved.canonicalDescription
          : descriptionForViewerRole(option, role!, locale),
      legalNorms: resolved.legalNorms,
      fulfillmentProbability: resolved.fulfillmentProbability,
      refusalRisks: resolved.refusalRisks,
      partyA: resolved.partyA,
      partyB: resolved.partyB,
      canonicalDescription: resolved.canonicalDescription,
    };
  };

  const otherVoteVisible =
    room.mediationPhase === "voting_discrepancy" ||
    room.mediationPhase === "agreement" ||
    room.mediationPhase === "completed";

  const sessionAllowsReply =
    !!room.mediationPhase &&
    room.mediationPhase !== "completed" &&
    room.mediationPhase !== "agreement";

  const pendingQuestion =
    viewerKind === "party" &&
    !!role &&
    !!partyA?.id &&
    !!partyB?.id &&
    sessionAllowsReply &&
    partyHasUnansweredQuestion(messages, viewerUserId, partyA.id, partyB.id);

  const canReply = pendingQuestion;
  const peerHasVoted =
    viewerKind === "party" &&
    (role === "party_a" ? !!room.partyBVoteOptionId : role === "party_b" ? !!room.partyAVoteOptionId : false);
  const awaitingCompromisePublish =
    room.mediationPhase === "voting_discrepancy" && !compromise;

  const mappedOptions = options.map(mapOption);
  const mappedCompromise = compromise ? mapOption(compromise) : null;
  const draftAgreementRaw = room.draftAgreement as DraftAgreement | null;
  const draftStatus = draftAgreementRaw?.status ?? null;
  const agreementPublished =
    draftStatus === "published" || draftStatus === "accepted";
  const awaitingMediatorPublish =
    room.mediationPhase === "agreement" && !agreementPublished;
  const draftAgreement =
    viewerKind === "party" && draftAgreementRaw && !agreementPublished
      ? null
      : draftAgreementRaw
        ? resolveDraftForLocale(draftAgreementRaw, locale)
        : null;

  const statePayload = {
    room: {
      id: room.id,
      title: room.title,
      phase: room.mediationPhase,
      round: room.mediationRound,
      activeParty: null,
      mediationStartedAt:
        (room.mediatorSessionStartedAt ?? room.mediationStartedAt)!.toISOString(),
      scheduledStartAt: room.scheduledStartAt?.toISOString() ?? null,
      selfVote: role === "party_a" ? room.partyAVoteOptionId : role === "party_b" ? room.partyBVoteOptionId : null,
      otherVote: otherVoteVisible
        ? role === "party_a"
          ? room.partyBVoteOptionId
          : role === "party_b"
            ? room.partyAVoteOptionId
            : null
        : null,
      peerHasVoted,
      awaitingCompromisePublish,
      awaitingMediatorPublish,
      agreementPublished,
      partyAVote: viewerKind === "mediator" ? room.partyAVoteOptionId : undefined,
      partyBVote: viewerKind === "mediator" ? room.partyBVoteOptionId : undefined,
      selfCompromiseVote:
        role === "party_a"
          ? room.partyACompromiseVote
          : role === "party_b"
            ? room.partyBCompromiseVote
            : null,
      otherCompromiseVote: otherVoteVisible
        ? role === "party_a"
          ? room.partyBCompromiseVote
          : role === "party_b"
            ? room.partyACompromiseVote
            : null
        : null,
      selectedOptionId: room.selectedOptionId,
      agreementAccepted:
        role === "party_a"
          ? !!room.partyAAgreementAcceptedAt
          : role === "party_b"
            ? !!room.partyBAgreementAcceptedAt
            : false,
      otherAgreementAccepted: otherVoteVisible
        ? role === "party_a"
          ? !!room.partyBAgreementAcceptedAt
          : role === "party_b"
            ? !!room.partyAAgreementAcceptedAt
            : false
        : false,
      canReply,
      pendingQuestion,
      partyNotification: room.partyNotification,
    },
    messages: viewerMessages,
    options: mappedOptions,
    compromise: mappedCompromise,
    compromiseDraft:
      viewerKind === "mediator" && compromiseDraft ? mapOption(compromiseDraft) : null,
    compromisePublished: !!compromise,
    questionCandidates: viewerKind === "mediator" ? candidates : emptyCandidates(),
    draftAgreement,
    profiles:
      viewerKind === "mediator"
        ? {
            partyA: {
              title: partyA?.title ?? "Party A",
              psychodynamic: partyA?.psychodynamicProfile ?? null,
              emotionalTriggers: partyA?.emotionalTriggers ?? null,
            },
            partyB: {
              title: partyB?.title ?? "Party B",
              psychodynamic: partyB?.psychodynamicProfile ?? null,
              emotionalTriggers: partyB?.emotionalTriggers ?? null,
            },
          }
        : null,
    viewerRole: role,
    viewerKind,
    mediatorTitle,
  };

  if (room.mediationPhase === "completed" && role) {
    const resultsSummary = await buildMediationResultsSummary(
      {
        room: {
          id: room.id,
          selectedOptionId: room.selectedOptionId,
          draftAgreement,
        },
        options: mappedOptions,
        compromise: mappedCompromise,
        viewerRole: role,
      },
      locale,
    );
    return { ...statePayload, resultsSummary };
  }

  return { ...statePayload, resultsSummary: null };
}

export type MediatorSessionRoomState = NonNullable<
  Awaited<ReturnType<typeof getMediatorSessionRoomState>>
>;

export type { QuestionCandidate, MediatorQuestionCandidates };
