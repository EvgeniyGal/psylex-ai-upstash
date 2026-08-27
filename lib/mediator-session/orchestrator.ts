import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import {
  assembleMediationContext,
  isAttackHeuristic,
  partyRoleFromUser,
} from "@/lib/mediation/assemble-input";
import {
  insertAgentMessage,
  insertParticipantMessage,
  insertSystemMessage,
  isMessageVisibleToViewer,
  listRoomMessages,
  partyHasUnansweredQuestion,
  resolveAgentMessageTargetUserId,
  resolveMessageForViewer,
  toPartyAdaptations,
} from "@/lib/mediation/messages";
import { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";
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
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";
import type {
  MediatorQuestionCandidates,
  QuestionCandidate,
} from "@/lib/mediator-session/types";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { getRoomPartiesForPipeline, isPostIntakePipelineComplete } from "@/lib/pipeline/gate";
import type { PartyRole } from "@/lib/participant-roles";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/portal-i18n";

type RoomRow = typeof rooms.$inferSelect;

const agentWork = new Set<string>();

async function loadRoom(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  return room ?? null;
}

async function setPhase(roomId: string, phase: MediationPhase, payload?: Record<string, unknown>) {
  await db.update(rooms).set({ mediationPhase: phase }).where(eq(rooms.id, roomId));
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

async function deliverMediatorQuestion(params: {
  roomId: string;
  partyRole: PartyRole;
  canonicalContent: string;
  adaptations: PartyAdaptations;
}) {
  const { partyA, partyB } = await getRoomPartiesForPipeline(params.roomId);
  const addressee = params.partyRole === "party_a" ? partyA : partyB;
  if (!addressee) throw new Error("Party not found.");

  await insertAgentMessage({
    roomId: params.roomId,
    canonicalContent: params.canonicalContent,
    adaptations: params.adaptations,
    messageKind: "mediation_question",
    addresseeUserId: addressee.id,
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
    targetRole: params.partyRole,
  });
}

function assertDialoguePhase(phase: string | null) {
  if (phase !== "dialogue" && phase !== "opening") {
    throw new Error("Dialogue is not active.");
  }
}

export async function sendMediatorQuestion(params: {
  roomId: string;
  mediatorUserId: string;
  partyRole: PartyRole;
  candidateId: string;
  editedText?: string;
}) {
  const room = await assertMediatorOwnsRoom(params.roomId, params.mediatorUserId);
  assertDialoguePhase(room.mediationPhase);

  const stored = (room.mediatorQuestionCandidates as MediatorQuestionCandidates | null) ?? {
    party_a: [],
    party_b: [],
  };
  const list = params.partyRole === "party_a" ? stored.party_a : stored.party_b;
  const candidate = list.find((c) => c.id === params.candidateId);
  if (!candidate) throw new Error("Candidate not found.");

  const edited = params.editedText?.trim();
  const canonicalContent = edited || candidate.canonicalContent;
  const adaptations =
    params.partyRole === "party_a"
      ? {
          party_a: edited || candidate.partyA,
          party_b: candidate.partyB,
        }
      : {
          party_a: candidate.partyA,
          party_b: edited || candidate.partyB,
        };

  await deliverMediatorQuestion({
    roomId: params.roomId,
    partyRole: params.partyRole,
    canonicalContent,
    adaptations,
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
  partyRole: PartyRole;
  text: string;
}) {
  const room = await assertMediatorOwnsRoom(params.roomId, params.mediatorUserId);
  assertDialoguePhase(room.mediationPhase);

  const text = params.text.trim();
  if (!text) throw new Error("Question cannot be empty.");

  await deliverMediatorQuestion({
    roomId: params.roomId,
    partyRole: params.partyRole,
    canonicalContent: text,
    adaptations: { party_a: text, party_b: text },
  });
}

export async function submitMediatorPartyReply(userId: string, content: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || !isMediatorFacilitatedRoom(room)) throw new Error("Not a mediator room.");
  if (room.mediationPhase !== "dialogue") throw new Error("Dialogue is not active.");

  const role = partyRoleFromUser(participant.user);
  const { partyA, partyB } = await getRoomPartiesForPipeline(room.id);
  if (!partyA || !partyB) throw new Error("Parties not found.");

  const messages = await listRoomMessages(room.id);
  const hasPending = partyHasUnansweredQuestion(
    messages,
    userId,
    partyA.id,
    partyB.id,
  );
  if (!hasPending) {
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
    });

    return { moderated: true as const };
  }

  await insertParticipantMessage({
    roomId: room.id,
    userId,
    content: trimmed,
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
    const { ctx } = await buildContext(fresh);
    const result = await runMediationAgent({
      mode: "options",
      context: ctx,
      schema: mediationOptionsSchema,
    });

    const options: MediationOption[] = result.options.map((option) => ({
      id: option.id,
      canonicalDescription: option.canonicalDescription,
      legalNorms: option.legalNorms,
      fulfillmentProbability: option.fulfillmentProbability,
      refusalRisks: option.refusalRisks,
      partyA: option.partyA,
      partyB: option.partyB,
    }));

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

    const { ctx } = await buildContext(fresh);
    const compromise = await runMediationAgent({
      mode: "compromise",
      context: ctx,
      schema: mediationCompromiseSchema,
      extraInstruction: `Party A voted ${fresh.partyAVoteOptionId}, Party B voted ${fresh.partyBVoteOptionId}.`,
    });

    const draft: MediationOption = {
      id: compromise.option.id,
      canonicalDescription: compromise.option.canonicalDescription,
      legalNorms: compromise.option.legalNorms,
      fulfillmentProbability: compromise.option.fulfillmentProbability,
      refusalRisks: compromise.option.refusalRisks,
      partyA: compromise.option.partyA,
      partyB: compromise.option.partyB,
    };

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

  await db
    .update(rooms)
    .set({
      compromiseOption: params.draft,
      mediatorCompromiseDraft: params.draft,
      partyACompromiseVote: null,
      partyBCompromiseVote: null,
    })
    .where(eq(rooms.id, params.roomId));

  await setPartyNotification({
    roomId: params.roomId,
    type: "compromise_ready",
    targetRole: "all",
  });
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

  await db.update(rooms).set(patch).where(eq(rooms.id, room.id));

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
    await setPartyNotification({
      roomId: room.id,
      type: "agreement_ready",
      targetRole: "all",
    });
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
    await setPartyNotification({
      roomId: room.id,
      type: "agreement_ready",
      targetRole: "all",
    });
    return loadRoom(room.id);
  }

  await db
    .update(rooms)
    .set({
      mediationPhase: "completed",
      mediationCompletedAt: new Date(),
    })
    .where(eq(rooms.id, room.id));

  await setPartyNotification({
    roomId: room.id,
    type: "session_completed",
    targetRole: "all",
  });

  return loadRoom(room.id);
}

async function ensureDraftAgreement(roomId: string, optionId: string) {
  const room = await loadRoom(roomId);
  if (!room || room.draftAgreement) return;
  if (agentWork.has(roomId)) return;

  agentWork.add(roomId);
  try {
    const fresh = await loadRoom(roomId);
    if (!fresh || fresh.draftAgreement) return;

    const { ctx } = await buildContext(fresh);
    const draft = await runMediationAgent({
      mode: "agreement_draft",
      context: ctx,
      schema: mediationAgreementDraftSchema,
      extraInstruction: `Selected option id: ${optionId}`,
    });

    const agreement: DraftAgreement = {
      ...draft,
      generatedAt: new Date().toISOString(),
    };

    await db.update(rooms).set({ draftAgreement: agreement }).where(eq(rooms.id, roomId));
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

  return buildSessionState(fresh, mediatorUserId, "en", "mediator");
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
  };

  const roleForUserId = (userId: string | null | undefined): PartyRole | null => {
    if (!userId) return null;
    if (partyA?.id === userId) return "party_a";
    if (partyB?.id === userId) return "party_b";
    return null;
  };

  const viewerMessages =
    viewerKind === "mediator"
      ? messages.map((message) => {
          const addresseeUserId =
            message.senderType === "agent" && partyA?.id && partyB?.id
              ? resolveAgentMessageTargetUserId(message, messages, partyA.id, partyB.id)
              : message.participantUserId;
          return {
            id: message.id,
            senderType: message.senderType,
            messageKind: message.messageKind,
            content:
              message.messageKind === "mediation_system"
                ? resolveLocalizedSystemMessage(
                    message.canonicalContent ?? message.content,
                    locale,
                  )
                : (message.canonicalContent ?? message.content),
            createdAt: message.createdAt.toISOString(),
            isOwn: false,
            addresseeUserId,
            senderPartyRole: roleForUserId(message.senderUserId),
            addresseePartyRole: roleForUserId(addresseeUserId),
          };
        })
      : messages
          .filter((message) =>
            partyA?.id && partyB?.id
              ? isMessageVisibleToViewer(message, viewerUserId, visibilityContext)
              : message.senderUserId === viewerUserId || message.senderType !== "participant",
          )
          .map((message) => ({
            id: message.id,
            senderType: message.senderType,
            messageKind: message.messageKind,
            content: resolveMessageForViewer(message, role!, locale),
            createdAt: message.createdAt.toISOString(),
            isOwn: message.senderUserId === viewerUserId,
            addresseeUserId: message.participantUserId,
            senderPartyRole: roleForUserId(message.senderUserId),
            addresseePartyRole: roleForUserId(message.participantUserId),
          }));

  const mapOption = (option: MediationOption) => ({
    id: option.id,
    description:
      viewerKind === "mediator"
        ? option.canonicalDescription
        : role === "party_a"
          ? option.partyA
          : option.partyB,
    legalNorms: option.legalNorms,
    fulfillmentProbability: option.fulfillmentProbability,
    refusalRisks: option.refusalRisks,
    partyA: option.partyA,
    partyB: option.partyB,
    canonicalDescription: option.canonicalDescription,
  });

  const otherVoteVisible =
    room.mediationPhase === "voting_discrepancy" ||
    room.mediationPhase === "agreement" ||
    room.mediationPhase === "completed";

  const pendingQuestion =
    viewerKind === "party" &&
    !!role &&
    !!partyA?.id &&
    !!partyB?.id &&
    room.mediationPhase === "dialogue" &&
    partyHasUnansweredQuestion(messages, viewerUserId, partyA.id, partyB.id);

  const canReply = pendingQuestion;
  const peerHasVoted =
    viewerKind === "party" &&
    (role === "party_a" ? !!room.partyBVoteOptionId : role === "party_b" ? !!room.partyAVoteOptionId : false);
  const awaitingCompromisePublish =
    room.mediationPhase === "voting_discrepancy" && !compromise;

  const mappedOptions = options.map(mapOption);
  const mappedCompromise = compromise ? mapOption(compromise) : null;
  const draftAgreement = room.draftAgreement as DraftAgreement | null;

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
