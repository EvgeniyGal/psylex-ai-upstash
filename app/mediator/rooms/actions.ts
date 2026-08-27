"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { scheduleMediatorSession as scheduleSession } from "@/lib/mediator-session/scheduling";
import { getMediatorSchedulingReadiness } from "@/lib/mediator-session/scheduling";
import {
  getMediatorHandshakeForMediator,
  recordMediatorStartClick,
  tryFinalizeMediatorSession,
} from "@/lib/mediator-session/handshake";
import {
  generateMediatorOptions,
  generateQuestionCandidates,
  getMediatorConsoleSessionState,
  publishMediatorCompromise,
  sendCustomMediatorQuestion,
  sendMediatorQuestion,
} from "@/lib/mediator-session/orchestrator";
import type { MediationOption } from "@/lib/mediation/types";
import type { PartyRole } from "@/lib/participant-roles";

async function requireMediator() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "mediator") {
    throw new Error("Unauthorized");
  }
  const userId = await requireSessionUserId();
  return userId;
}

export async function fetchMediatorSchedulingReadiness(roomId: string) {
  await requireMediator();
  return getMediatorSchedulingReadiness(roomId);
}

export async function saveMediatorSchedule(
  roomId: string,
  scheduledStartAtIso: string,
  durationMinutes: number,
) {
  const userId = await requireMediator();
  await scheduleSession({
    roomId,
    mediatorUserId: userId,
    scheduledStartAt: new Date(scheduledStartAtIso),
    durationMinutes,
  });
  revalidatePath(`/mediator/rooms/${roomId}`);
  revalidatePath(`/mediator/rooms/${roomId}/lobby`);
  revalidatePath("/mediation");
}

export async function fetchMediatorLobbyHandshake(roomId: string) {
  const userId = await requireMediator();
  await tryFinalizeMediatorSession(roomId);
  return getMediatorHandshakeForMediator(userId, roomId);
}

export async function clickMediatorStartMediation(roomId: string) {
  const userId = await requireMediator();
  const state = await recordMediatorStartClick(roomId, "mediator");
  revalidatePath(`/mediator/rooms/${roomId}/lobby`);
  revalidatePath(`/mediator/rooms/${roomId}/session`);
  revalidatePath("/mediation");
  return state;
}

export async function fetchMediatorSessionState(roomId: string) {
  const userId = await requireMediator();
  return getMediatorConsoleSessionState(userId, roomId);
}

export async function generateMediatorQuestionCandidatesAction(roomId: string) {
  const userId = await requireMediator();
  return generateQuestionCandidates(roomId, userId);
}

export async function sendMediatorQuestionAction(params: {
  roomId: string;
  partyRole: PartyRole;
  candidateId: string;
  editedText?: string;
}) {
  const userId = await requireMediator();
  try {
    await sendMediatorQuestion({
      roomId: params.roomId,
      mediatorUserId: userId,
      partyRole: params.partyRole,
      candidateId: params.candidateId,
      editedText: params.editedText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send question.";
    console.error("sendMediatorQuestionAction failed:", message, error);
    throw new Error(message);
  }
  return getMediatorConsoleSessionState(userId, params.roomId);
}

export async function sendCustomMediatorQuestionAction(params: {
  roomId: string;
  partyRole: PartyRole;
  text: string;
}) {
  const userId = await requireMediator();
  try {
    await sendCustomMediatorQuestion({
      roomId: params.roomId,
      mediatorUserId: userId,
      partyRole: params.partyRole,
      text: params.text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send question.";
    console.error("sendCustomMediatorQuestionAction failed:", message, error);
    throw new Error(message);
  }
  return getMediatorConsoleSessionState(userId, params.roomId);
}

export async function generateMediatorOptionsAction(roomId: string) {
  const userId = await requireMediator();
  await generateMediatorOptions(roomId, userId);
  return getMediatorConsoleSessionState(userId, roomId);
}

export async function publishMediatorCompromiseAction(params: {
  roomId: string;
  draft: MediationOption;
}) {
  const userId = await requireMediator();
  await publishMediatorCompromise({
    roomId: params.roomId,
    mediatorUserId: userId,
    draft: params.draft,
  });
  return getMediatorConsoleSessionState(userId, params.roomId);
}
