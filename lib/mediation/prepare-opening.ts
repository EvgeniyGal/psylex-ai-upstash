import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages, rooms } from "@/drizzle/schema";
import {
  assembleMediationContext,
} from "@/lib/mediation/assemble-input";
import {
  insertAgentMessage,
  listRoomMessages,
  toPartyAdaptations,
} from "@/lib/mediation/messages";
import { runMediationAgent } from "@/lib/mediation/run-agent";
import {
  mediationDialogueQuestionSchema,
  mediationOpeningSchema,
} from "@/lib/mediation/schemas";
import { getPartyAdaptationLocales } from "@/lib/mediation/party-locales";
import { scheduleMediationWork } from "@/lib/mediation/schedule-work";
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { getRoomPartiesForPipeline, isPostIntakePipelineComplete } from "@/lib/pipeline/gate";

const preparingRooms = new Set<string>();

async function loadRoom(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  return room ?? null;
}

async function hasMessageKind(roomId: string, messageKind: string) {
  const [row] = await db
    .select({ id: roomMessages.id })
    .from(roomMessages)
    .where(and(eq(roomMessages.roomId, roomId), eq(roomMessages.messageKind, messageKind)))
    .limit(1);
  return !!row;
}

export async function isMediationOpeningPrepared(roomId: string) {
  return (await getMediationOpeningPrepStatus(roomId)) === "complete";
}

export async function getMediationOpeningPrepStatus(
  roomId: string,
): Promise<"none" | "partial" | "complete"> {
  const [opening, question] = await Promise.all([
    hasMessageKind(roomId, "mediation_opening"),
    hasMessageKind(roomId, "mediation_question"),
  ]);
  if (opening && question) return "complete";
  if (opening || question) return "partial";
  return "none";
}

async function buildPreparationContext(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room) throw new Error("Room not found.");

  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  if (!partyA || !partyB) throw new Error("Room parties missing.");

  const messages = await listRoomMessages(roomId);
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

  return { room, ctx };
}

async function generateOpeningMessage(roomId: string) {
  const { ctx } = await buildPreparationContext(roomId);
  const partyAdaptationLocales = await getPartyAdaptationLocales(roomId);
  const opening = await runMediationAgent({
    mode: "opening",
    context: ctx,
    schema: mediationOpeningSchema,
    partyAdaptationLocales,
  });

  if (await hasMessageKind(roomId, "mediation_opening")) return;

  await insertAgentMessage({
    roomId,
    canonicalContent: opening.canonicalContent,
    adaptations: toPartyAdaptations(opening),
    messageKind: "mediation_opening",
  });
}

async function generateFirstQuestion(roomId: string) {
  const { partyA } = await getRoomPartiesForPipeline(roomId);
  const { ctx } = await buildPreparationContext(roomId);
  const partyAdaptationLocales = await getPartyAdaptationLocales(roomId);
  const result = await runMediationAgent({
    mode: "dialogue_question",
    context: ctx,
    schema: mediationDialogueQuestionSchema,
    extraInstruction: 'Set addressee to "party_a". Round 1.',
    partyAdaptationLocales,
  });

  if (await hasMessageKind(roomId, "mediation_question")) return;

  await insertAgentMessage({
    roomId,
    canonicalContent: result.canonicalContent,
    adaptations: toPartyAdaptations(result),
    messageKind: "mediation_question",
    addresseeUserId: partyA?.id ?? null,
  });
}

export async function prepareMediationOpening(roomId: string) {
  if (preparingRooms.has(roomId)) return;
  if (await isMediationOpeningPrepared(roomId)) return;

  const room = await loadRoom(roomId);
  if (!room) return;
  if (isMediatorFacilitatedRoom(room)) return;

  const complete = await isPostIntakePipelineComplete(roomId);
  if (!complete) return;

  preparingRooms.add(roomId);

  try {
    await logPipelineEvent({
      roomId,
      agentKey: "mediation",
      eventType: "agent_started",
      payload: { step: "prepare_opening" },
    });

    const hasOpening = await hasMessageKind(roomId, "mediation_opening");
    if (!hasOpening) {
      await generateOpeningMessage(roomId);
    }

    const hasQuestion = await hasMessageKind(roomId, "mediation_question");
    if (!hasQuestion) {
      await generateFirstQuestion(roomId);
    }

    await logPipelineEvent({
      roomId,
      agentKey: "mediation",
      eventType: "agent_completed",
      payload: { step: "prepare_opening" },
    });
  } catch (error) {
    console.error(`Failed to prepare mediation opening for room ${roomId}:`, error);
    await logPipelineEvent({
      roomId,
      agentKey: "mediation",
      eventType: "agent_failed",
      payload: { step: "prepare_opening", message: String(error) },
    });
  } finally {
    preparingRooms.delete(roomId);
  }
}

export function tryPrepareMediationOpening(roomId: string) {
  scheduleMediationWork(`prepareMediationOpening:${roomId}`, () => prepareMediationOpening(roomId));
}

/** Awaitable entry point for server actions — survives request lifecycle better than fire-and-forget. */
export async function ensureMediationOpeningPrepared(roomId: string) {
  await prepareMediationOpening(roomId);
}
