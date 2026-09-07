"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import {
  canTriggerPostIntakePipeline,
  isPostIntakePipelineComplete,
} from "@/lib/pipeline/gate";
import { tryRunPostIntakePipeline, ensurePostIntakePipeline } from "@/lib/pipeline/trigger";
import { ensureMediationOpeningPrepared, isMediationOpeningPrepared } from "@/lib/mediation/prepare-opening";
import { isPartyRole } from "@/lib/participant-roles";
import { disputeIntakeSchema } from "@/lib/dispute-intake-schema";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import {
  getHandshakeStatusForUser,
  recordStartClick,
  type HandshakeStatusResponse,
} from "@/lib/mediation/handshake";
import { getMediationLobbyStatusForUser, type MediationLobbyStatus } from "@/lib/dispute-intake";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

async function requireSideParticipant() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  let userId = session?.user?.id;

  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }

  if (!userId || !role || !isPartyRole(role)) {
    redirect("/login");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  return { user, role };
}

export async function submitDisputeIntake(formData: FormData) {
  const { user } = await requireSideParticipant();
  const status = await getUserOnboardingStatus(user.id);

  if (!status.canProceed || !user.onboardingCompletedAt) {
    redirect("/onboarding/tests");
  }

  if (hasSubmittedDisputeIntake(user)) {
    redirect("/mediation");
  }

  const parsed = disputeIntakeSchema.safeParse({
    disputeDescription: formData.get("disputeDescription"),
    disputePriority: formData.get("disputePriority"),
    disputeAcceptableOutcome: formData.get("disputeAcceptableOutcome"),
  });

  if (!parsed.success) {
    return;
  }

  await db
    .update(users)
    .set({
      disputeDescription: parsed.data.disputeDescription,
      disputePriority: parsed.data.disputePriority,
      disputeAcceptableOutcome: parsed.data.disputeAcceptableOutcome,
      disputeIntakeSubmittedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  notifyUser(user.id);
  notifyRoom(user.roomId);

  if (user.roomId) {
    tryRunPostIntakePipeline(user.roomId);
  }

  revalidatePath("/dispute-intake");
  revalidatePath("/mediation");
  redirect("/mediation");
}

export async function clickStartMediation(): Promise<HandshakeStatusResponse> {
  const { user, role } = await requireSideParticipant();

  if (!hasSubmittedDisputeIntake(user)) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  const { getMediationLobbyData } = await import("@/lib/dispute-intake");
  const lobby = await getMediationLobbyData(user.id);

  if (!lobby || !user.roomId) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  if (lobby.isMediatorFacilitated) {
    const { recordMediatorStartClick } = await import("@/lib/mediator-session/handshake");
    const partyRole = isPartyRole(user.role) ? user.role : (role as "party_a" | "party_b");
    const state = await recordMediatorStartClick(user.roomId, partyRole);
    revalidatePath("/mediation");
    revalidatePath("/room");
    return {
      status:
        state.status === "started"
          ? "started"
          : state.status === "ineligible" || state.status === "not_scheduled" || state.status === "too_early"
            ? "ineligible"
            : state.selfClicked
              ? "waiting"
              : "idle",
      selfClicked: state.selfClicked,
      oppositeClicked:
        partyRole === "party_a" ? state.partyBClicked : state.partyAClicked,
    };
  }

  if (!lobby.canStartMediation) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  const result = await recordStartClick(
    user.roomId,
    isPartyRole(user.role) ? user.role : (role as "party_a" | "party_b"),
  );

  revalidatePath("/mediation");
  revalidatePath("/room");

  return result;
}

export async function getMediationHandshakeStatus(): Promise<HandshakeStatusResponse> {
  const { user } = await requireSideParticipant();
  return getHandshakeStatusForUser(user.id);
}

export async function getMediationLobbyStatus(): Promise<MediationLobbyStatus | null> {
  const { user } = await requireSideParticipant();
  return getMediationLobbyStatusForUser(user.id);
}

export async function runPostIntakePipelineForRoom(
  roomId: string,
): Promise<{ status: "complete" | "ran" | "ineligible" }> {
  const { user } = await requireSideParticipant();

  if (!roomId || !user.roomId || user.roomId !== roomId) {
    throw new Error("Unauthorized");
  }

  const canTrigger = await canTriggerPostIntakePipeline(roomId);
  if (!canTrigger) {
    return { status: "ineligible" };
  }

  const { isMediatorFacilitatedRoom } = await import("@/lib/mediator-session/room-mode");
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  const skipOpening = room ? isMediatorFacilitatedRoom(room) : false;

  const complete = await isPostIntakePipelineComplete(roomId);
  if (complete) {
    if (!skipOpening && !(await isMediationOpeningPrepared(roomId))) {
      await ensureMediationOpeningPrepared(roomId);
    }
    revalidatePath("/mediation");
    return { status: "complete" };
  }

  await ensurePostIntakePipeline(roomId);
  if (!skipOpening && !(await isMediationOpeningPrepared(roomId))) {
    await ensureMediationOpeningPrepared(roomId);
  }
  revalidatePath("/mediation");
  return { status: "ran" };
}

export async function prepareMediationOpeningForRoom(
  roomId: string,
): Promise<{ status: "complete" | "ran" | "ineligible" }> {
  const { user } = await requireSideParticipant();

  if (!roomId || !user.roomId || user.roomId !== roomId) {
    throw new Error("Unauthorized");
  }

  const { isMediatorFacilitatedRoom } = await import("@/lib/mediator-session/room-mode");
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (room && isMediatorFacilitatedRoom(room)) {
    return { status: "complete" };
  }

  const pipelineComplete = await isPostIntakePipelineComplete(roomId);
  if (!pipelineComplete) {
    return { status: "ineligible" };
  }

  const prepared = await isMediationOpeningPrepared(roomId);
  if (prepared) {
    revalidatePath("/mediation");
    return { status: "complete" };
  }

  await ensureMediationOpeningPrepared(roomId);
  revalidatePath("/mediation");
  return { status: "ran" };
}
