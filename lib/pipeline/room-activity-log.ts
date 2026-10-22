import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  mediationFilingReceipts,
  pipelineEventLogs,
  roomMessages,
  rooms,
  userTestCompletions,
  users,
  type mediationFilingReceipts as mediationFilingReceiptsTable,
  type pipelineEventLogs as pipelineEventLogsTable,
  type roomMessages as roomMessagesTable,
  type rooms as roomsTable,
  type userTestCompletions as userTestCompletionsTable,
  type users as usersTable,
} from "@/drizzle/schema";
import type { PartyRole } from "@/lib/participant-roles";
import type { TestKey } from "@/lib/test-keys";

type RoomRow = typeof roomsTable.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;
type PipelineEventRow = typeof pipelineEventLogsTable.$inferSelect;
type TestCompletionRow = typeof userTestCompletionsTable.$inferSelect;
type FilingReceiptRow = typeof mediationFilingReceiptsTable.$inferSelect;
type RoomMessageRow = typeof roomMessagesTable.$inferSelect;

export type RoomActivityEntry = {
  id: string;
  occurredAt: Date;
  source: "pipeline" | "derived";
  kind: string;
  partyRole?: PartyRole | null;
  userId?: string | null;
  agentKey?: string | null;
  payload?: Record<string, unknown> | null;
};

function pushDerived(
  entries: RoomActivityEntry[],
  params: Omit<RoomActivityEntry, "source">,
) {
  entries.push({ ...params, source: "derived" });
}

function partyDerivedEvents(
  entries: RoomActivityEntry[],
  user: UserRow,
  role: PartyRole,
) {
  if (user.welcomeSeenAt) {
    pushDerived(entries, {
      id: `welcome-${user.id}`,
      occurredAt: user.welcomeSeenAt,
      kind: "welcome_seen",
      partyRole: role,
      userId: user.id,
    });
  }

  if (user.disclaimerAcceptedAt) {
    pushDerived(entries, {
      id: `disclaimer-${user.id}`,
      occurredAt: user.disclaimerAcceptedAt,
      kind: "disclaimer_accepted",
      partyRole: role,
      userId: user.id,
    });
  }

  if (user.personalBotReadyAt) {
    pushDerived(entries, {
      id: `personal-bot-${user.id}`,
      occurredAt: user.personalBotReadyAt,
      kind: "personal_bot_ready",
      partyRole: role,
      userId: user.id,
      payload: user.personalBotPrompt
        ? { personalBotPrompt: user.personalBotPrompt }
        : null,
    });
  }

  if (user.onboardingCompletedAt) {
    pushDerived(entries, {
      id: `onboarding-${user.id}`,
      occurredAt: user.onboardingCompletedAt,
      kind: "onboarding_completed",
      partyRole: role,
      userId: user.id,
    });
  }

  if (user.disputeIntakeSubmittedAt) {
    pushDerived(entries, {
      id: `dispute-intake-${user.id}`,
      occurredAt: user.disputeIntakeSubmittedAt,
      kind: "dispute_intake_submitted",
      partyRole: role,
      userId: user.id,
      payload: {
        disputeDescription: user.disputeDescription,
        disputePriority: user.disputePriority,
        disputeAcceptableOutcome: user.disputeAcceptableOutcome,
      },
    });
  }

  if (user.psychodynamicProfileAt) {
    pushDerived(entries, {
      id: `psychodynamic-${user.id}`,
      occurredAt: user.psychodynamicProfileAt,
      kind: "psychodynamic_profile_completed",
      partyRole: role,
      userId: user.id,
      payload: user.psychodynamicProfile
        ? { profile: user.psychodynamicProfile }
        : null,
    });
  }

  if (user.emotionalTriggersAt) {
    pushDerived(entries, {
      id: `emotional-triggers-${user.id}`,
      occurredAt: user.emotionalTriggersAt,
      kind: "emotional_triggers_completed",
      partyRole: role,
      userId: user.id,
      payload: user.emotionalTriggers ? { triggers: user.emotionalTriggers } : null,
    });
  }
}

function roomDerivedEvents(entries: RoomActivityEntry[], room: RoomRow) {
  pushDerived(entries, {
    id: `room-created-${room.id}`,
    occurredAt: room.createdAt,
    kind: "room_created",
  });

  if (room.interestsAnalysisAt) {
    pushDerived(entries, {
      id: `interests-${room.id}`,
      occurredAt: room.interestsAnalysisAt,
      kind: "interests_analysis_completed",
    });
  }

  if (room.legalAnalysisAt) {
    pushDerived(entries, {
      id: `legal-${room.id}`,
      occurredAt: room.legalAnalysisAt,
      kind: "legal_analysis_completed",
    });
  }

  if (room.postIntakePipelineStartedAt) {
    pushDerived(entries, {
      id: `pipeline-started-${room.id}`,
      occurredAt: room.postIntakePipelineStartedAt,
      kind: "post_intake_pipeline_started",
    });
  }

  if (room.postIntakePipelineCompletedAt) {
    pushDerived(entries, {
      id: `pipeline-completed-${room.id}`,
      occurredAt: room.postIntakePipelineCompletedAt,
      kind: "post_intake_pipeline_completed",
    });
  }

  if (room.partyAMediationStartClickedAt) {
    pushDerived(entries, {
      id: `mediation-click-a-${room.id}`,
      occurredAt: room.partyAMediationStartClickedAt,
      kind: "mediation_start_clicked",
      partyRole: "party_a",
    });
  }

  if (room.partyBMediationStartClickedAt) {
    pushDerived(entries, {
      id: `mediation-click-b-${room.id}`,
      occurredAt: room.partyBMediationStartClickedAt,
      kind: "mediation_start_clicked",
      partyRole: "party_b",
    });
  }

  if (room.mediationStartedAt) {
    pushDerived(entries, {
      id: `mediation-started-${room.id}`,
      occurredAt: room.mediationStartedAt,
      kind: "mediation_started",
    });
  }

  if (room.partyAReadyForOptionsAt) {
    pushDerived(entries, {
      id: `ready-options-a-${room.id}`,
      occurredAt: room.partyAReadyForOptionsAt,
      kind: "ready_for_options",
      partyRole: "party_a",
    });
  }

  if (room.partyBReadyForOptionsAt) {
    pushDerived(entries, {
      id: `ready-options-b-${room.id}`,
      occurredAt: room.partyBReadyForOptionsAt,
      kind: "ready_for_options",
      partyRole: "party_b",
    });
  }

  if (room.partyAAgreementAcceptedAt) {
    pushDerived(entries, {
      id: `agreement-a-${room.id}`,
      occurredAt: room.partyAAgreementAcceptedAt,
      kind: "agreement_accepted",
      partyRole: "party_a",
    });
  }

  if (room.partyBAgreementAcceptedAt) {
    pushDerived(entries, {
      id: `agreement-b-${room.id}`,
      occurredAt: room.partyBAgreementAcceptedAt,
      kind: "agreement_accepted",
      partyRole: "party_b",
    });
  }

  if (room.agreementFinalizedAt) {
    pushDerived(entries, {
      id: `agreement-finalized-${room.id}`,
      occurredAt: room.agreementFinalizedAt,
      kind: "agreement_finalized",
      payload: room.selectedOptionId ? { selectedOptionId: room.selectedOptionId } : null,
    });
  }

  if (room.mediationCompletedAt) {
    pushDerived(entries, {
      id: `mediation-completed-${room.id}`,
      occurredAt: room.mediationCompletedAt,
      kind: "mediation_completed",
      payload: {
        phase: room.mediationPhase,
        selectedOptionId: room.selectedOptionId,
        partyAVoteOptionId: room.partyAVoteOptionId,
        partyBVoteOptionId: room.partyBVoteOptionId,
        partyACompromiseVote: room.partyACompromiseVote,
        partyBCompromiseVote: room.partyBCompromiseVote,
      },
    });
  }

  if (room.partyACompromiseVote !== null || room.partyBCompromiseVote !== null) {
    const compromiseAt = room.agreementFinalizedAt ?? room.mediationCompletedAt;
    if (compromiseAt) {
      pushDerived(entries, {
        id: `compromise-votes-${room.id}`,
        occurredAt: compromiseAt,
        kind: "compromise_votes_recorded",
        payload: {
          partyACompromiseVote: room.partyACompromiseVote,
          partyBCompromiseVote: room.partyBCompromiseVote,
        },
      });
    }
  }
}

function participantMessageEvents(
  entries: RoomActivityEntry[],
  messages: RoomMessageRow[],
  participants: UserRow[],
) {
  for (const message of messages) {
    if (message.senderType !== "participant" || !message.senderUserId) continue;

    const user = participants.find((p) => p.id === message.senderUserId);
    const role = user?.role;
    if (!user || (role !== "party_a" && role !== "party_b")) continue;

    pushDerived(entries, {
      id: `message-${message.id}`,
      occurredAt: message.createdAt,
      kind: "participant_message",
      partyRole: role,
      userId: message.senderUserId,
      payload: {
        channel: message.channel,
        messageKind: message.messageKind,
        content: message.canonicalContent ?? message.content,
        sender: user.title?.trim() || user.login,
      },
    });
  }
}

function mediationMessageEvents(
  entries: RoomActivityEntry[],
  messages: RoomMessageRow[],
  participants: UserRow[],
) {
  for (const message of messages) {
    if (message.senderType !== "agent" && message.senderType !== "system") continue;

    const sender = message.senderUserId
      ? participants.find((p) => p.id === message.senderUserId)
      : null;
    const addressee = message.participantUserId
      ? participants.find((p) => p.id === message.participantUserId)
      : null;

    const senderLabel = sender
      ? sender.title?.trim() || sender.login
      : message.senderType === "system"
        ? "System"
        : "Mediation agent";

    pushDerived(entries, {
      id: `mediation-message-${message.id}`,
      occurredAt: message.createdAt,
      kind: "mediation_message",
      partyRole:
        addressee?.role === "party_a" || addressee?.role === "party_b"
          ? addressee.role
          : null,
      userId: message.senderUserId,
      payload: {
        channel: message.channel,
        messageKind: message.messageKind,
        content: message.canonicalContent ?? message.content,
        sender: senderLabel,
        audience: message.participantUserId
          ? addressee?.role ?? "party"
          : "both",
      },
    });
  }
}

export function buildRoomActivityLog(params: {
  room: RoomRow;
  participants: UserRow[];
  pipelineEvents: PipelineEventRow[];
  testCompletions: TestCompletionRow[];
  filingReceipts: FilingReceiptRow[];
  participantMessages: RoomMessageRow[];
}): RoomActivityEntry[] {
  const entries: RoomActivityEntry[] = [];

  roomDerivedEvents(entries, params.room);

  for (const user of params.participants) {
    if (user.role === "party_a" || user.role === "party_b") {
      partyDerivedEvents(entries, user, user.role);
    }
  }

  participantMessageEvents(entries, params.participantMessages, params.participants);
  mediationMessageEvents(entries, params.participantMessages, params.participants);

  for (const completion of params.testCompletions) {
    const user = params.participants.find((p) => p.id === completion.userId);
    const role = user?.role;
    if (role !== "party_a" && role !== "party_b") continue;

    pushDerived(entries, {
      id: `test-${completion.id}`,
      occurredAt: completion.completedAt,
      kind: "test_completed",
      partyRole: role,
      userId: completion.userId,
      payload: { testKey: completion.testKey },
    });
  }

  for (const receipt of params.filingReceipts) {
    pushDerived(entries, {
      id: `filing-${receipt.id}`,
      occurredAt: receipt.createdAt,
      kind: "filing_receipt_saved",
      payload: {
        selectedOptionId: receipt.selectedOptionId,
        contentHash: receipt.contentHash,
      },
    });
  }

  for (const event of params.pipelineEvents) {
    const user = event.userId
      ? params.participants.find((p) => p.id === event.userId)
      : undefined;
    const partyRole =
      user?.role === "party_a" || user?.role === "party_b" ? user.role : null;

    entries.push({
      id: `pipeline-${event.id}`,
      occurredAt: event.createdAt,
      source: "pipeline",
      kind: event.eventType,
      partyRole,
      userId: event.userId,
      agentKey: event.agentKey,
      payload: (event.payload as Record<string, unknown> | null) ?? null,
    });
  }

  entries.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return entries;
}

export async function getRoomActivityLog(roomId: string): Promise<RoomActivityEntry[]> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return [];

  const { getRoomSides } = await import("@/lib/room/helpers");
  const roomPartySides = await getRoomSides(roomId);
  const mediator =
    room.createdByUserId &&
    !roomPartySides.some((p) => p.id === room.createdByUserId)
      ? await db
          .select()
          .from(users)
          .where(eq(users.id, room.createdByUserId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;
  const participants = mediator ? [...roomPartySides, mediator] : roomPartySides;
  const participantIds = roomPartySides.map((p) => p.id);

  const [pipelineEvents, testCompletions, filingReceipts, participantMessages] =
    await Promise.all([
      db
        .select()
        .from(pipelineEventLogs)
        .where(eq(pipelineEventLogs.roomId, roomId))
        .orderBy(desc(pipelineEventLogs.createdAt))
        .limit(200),
      participantIds.length > 0
        ? db
            .select()
            .from(userTestCompletions)
            .where(inArray(userTestCompletions.userId, participantIds))
        : Promise.resolve([]),
      db
        .select()
        .from(mediationFilingReceipts)
        .where(eq(mediationFilingReceipts.roomId, roomId)),
      db
        .select()
        .from(roomMessages)
        .where(eq(roomMessages.roomId, roomId))
        .orderBy(desc(roomMessages.createdAt)),
    ]);

  return buildRoomActivityLog({
    room,
    participants,
    pipelineEvents,
    testCompletions,
    filingReceipts,
    participantMessages,
  });
}

export type { TestKey };
