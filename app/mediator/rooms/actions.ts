"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import {
  getMediatorSchedulingReadiness,
  scheduleErrorCodeFromMessage,
  scheduleMediatorSession as scheduleSession,
  type ScheduleSaveResult,
} from "@/lib/mediator-session/scheduling";
import {
  forceStartMediatorSessionNow,
  getMediatorHandshakeForMediator,
  recordMediatorStartClick,
  tryFinalizeMediatorSession,
} from "@/lib/mediator-session/handshake";
import {
  endMediatorSession,
  generateMediatorOptions,
  generateQuestionCandidates,
  getMediatorConsoleSessionState,
  publishMediatorCompromise,
  publishMediatorDraftAgreement,
  returnMediatorSessionToDialogue,
  saveMediatorDraftAgreement,
  sendCustomMediatorQuestion,
  sendMediatorQuestion,
  type MediatorAudience,
} from "@/lib/mediator-session/orchestrator";
import type { DraftAgreement, MediationOption } from "@/lib/mediation/types";
import type { Locale } from "@/lib/i18n";
import type { PartyRole } from "@/lib/participant-roles";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

async function requireMediator() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "mediator") {
    throw new Error("Unauthorized");
  }
  const userId = await requireSessionUserId();
  return userId;
}

/** Admin (any room) or owning mediator may read Mode B scheduling readiness. */
async function requireSchedulingReadinessAccess(roomId: string) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "mediator")) {
    throw new Error("Unauthorized");
  }
  if (role === "admin") return;
  const userId = await requireSessionUserId();
  const [room] = await db
    .select({ createdByUserId: rooms.createdByUserId })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (!room || room.createdByUserId !== userId) {
    throw new Error("Unauthorized");
  }
}

export async function helpFormulateMediatorText(draft: string) {
  const userId = await requireMediator();
  const [user] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const { helpFormulateText } = await import("@/lib/mediation/formulate");
  return helpFormulateText({
    draft,
    locale: (user?.preferredLocale as Locale) ?? "en",
  });
}

export async function fetchMediatorSchedulingReadiness(roomId: string) {
  await requireSchedulingReadinessAccess(roomId);
  return getMediatorSchedulingReadiness(roomId);
}

export async function saveMediatorSchedule(
  roomId: string,
  scheduledStartAtIso: string,
  durationMinutes: number,
): Promise<ScheduleSaveResult> {
  try {
    const userId = await requireMediator();
    await scheduleSession({
      roomId,
      mediatorUserId: userId,
      scheduledStartAt: new Date(scheduledStartAtIso),
      durationMinutes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { ok: false, code: scheduleErrorCodeFromMessage(message) };
  }
  revalidatePath(`/mediator/rooms/${roomId}`);
  revalidatePath(`/mediator/rooms/${roomId}/lobby`);
  revalidatePath("/mediation");
  return { ok: true };
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

export async function startMediatorSessionNow(roomId: string) {
  const userId = await requireMediator();
  const state = await forceStartMediatorSessionNow(roomId, userId);
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
  audience: MediatorAudience;
  text: string;
}) {
  const userId = await requireMediator();
  try {
    await sendCustomMediatorQuestion({
      roomId: params.roomId,
      mediatorUserId: userId,
      audience: params.audience,
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

export async function endMediatorSessionAction(roomId: string) {
  const userId = await requireMediator();
  const state = await endMediatorSession(userId, roomId);
  revalidatePath(`/mediator/rooms/${roomId}`);
  revalidatePath(`/mediator/rooms/${roomId}/session`);
  revalidatePath("/mediation");
  return state;
}

export async function saveMediatorDraftAgreementAction(
  roomId: string,
  draft: DraftAgreement,
) {
  const userId = await requireMediator();
  return saveMediatorDraftAgreement(userId, roomId, draft);
}

export async function publishMediatorDraftAgreementAction(roomId: string) {
  const userId = await requireMediator();
  return publishMediatorDraftAgreement(userId, roomId);
}

export async function returnMediatorSessionToDialogueAction(roomId: string) {
  const userId = await requireMediator();
  return returnMediatorSessionToDialogue(userId, roomId);
}
