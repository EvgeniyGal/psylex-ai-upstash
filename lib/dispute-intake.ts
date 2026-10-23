import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, userTestCompletions, users, type users as usersTable } from "@/drizzle/schema";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { getRoomSides } from "@/lib/room/helpers";
import {
  getOppositePartyRole,
  isPartyRole,
  type PartyRole,
} from "@/lib/participant-roles";
import {
  canTriggerPostIntakePipeline,
  isPostIntakePipelineComplete,
} from "@/lib/pipeline/gate";
import { isMediationOpeningPrepared } from "@/lib/mediation/prepare-opening";
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";
import { START_BUTTON_LEAD_MS } from "@/lib/mediator-session/constants";
import { tryFinalizeMediatorSession } from "@/lib/mediator-session/handshake";

export type SideReadiness = {
  userId: string;
  role: PartyRole;
  title: string;
  testsComplete: boolean;
  /** Per onboarding test key — true when completed. */
  tests: Record<TestKey, boolean>;
  personalBotReady: boolean;
  disputeIntakeComplete: boolean;
  mediationReady: boolean;
};

type UserRow = typeof usersTable.$inferSelect;

export function hasSubmittedDisputeIntake(user: Pick<UserRow, "disputeIntakeSubmittedAt">) {
  return !!user.disputeIntakeSubmittedAt;
}

export function getOppositeSideRole(role: PartyRole): PartyRole {
  return getOppositePartyRole(role);
}

async function getCompletedTestKeys(userId: string): Promise<Set<TestKey>> {
  const rows = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  return new Set(
    rows
      .map((row) => row.testKey)
      .filter((key): key is TestKey => TEST_KEYS.includes(key as TestKey)),
  );
}

export async function getSideReadiness(user: UserRow): Promise<SideReadiness | null> {
  if (!isPartyRole(user.role)) return null;

  const completedKeys = await getCompletedTestKeys(user.id);
  const tests = Object.fromEntries(
    TEST_KEYS.map((key) => [key, completedKeys.has(key)]),
  ) as Record<TestKey, boolean>;
  const testsComplete = TEST_KEYS.every((key) => tests[key]);
  const personalBotReady = !!user.personalBotReadyAt && !!user.personalBotPrompt?.trim();
  const disputeIntakeComplete = hasSubmittedDisputeIntake(user);

  return {
    userId: user.id,
    role: user.role,
    title: user.title,
    testsComplete,
    tests,
    personalBotReady,
    disputeIntakeComplete,
    mediationReady: testsComplete && personalBotReady && disputeIntakeComplete,
  };
}

export type MediationLobbyStatus = {
  self: SideReadiness;
  opposite: SideReadiness | null;
  bothReady: boolean;
  pipelineRunning: boolean;
  preparingMediationRoom: boolean;
  canStartMediation: boolean;
  mediationStarted: boolean;
  isMediatorFacilitated: boolean;
  scheduledStartAt: string | null;
  startWindowOpen: boolean;
};

export async function getMediationLobbyStatusForUser(userId: string): Promise<MediationLobbyStatus | null> {
  const lobby = await getMediationLobbyData(userId);
  if (!lobby) return null;

  return {
    self: lobby.self,
    opposite: lobby.opposite,
    bothReady: lobby.bothReady,
    pipelineRunning: lobby.pipelineRunning,
    preparingMediationRoom: lobby.preparingMediationRoom,
    canStartMediation: lobby.canStartMediation,
    mediationStarted: !!lobby.room.mediationStartedAt,
    isMediatorFacilitated: lobby.isMediatorFacilitated,
    scheduledStartAt: lobby.scheduledStartAt,
    startWindowOpen: lobby.startWindowOpen,
  };
}

export async function getMediationLobbyData(userId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) return null;

  const user = participant.user;
  const selfReadiness = await getSideReadiness(user);
  if (!selfReadiness) return null;

  const oppositeRole = getOppositePartyRole(user.role);
  const sides = await getRoomSides(participant.roomId);
  const oppositeUser = sides.find((side) => side.role === oppositeRole) ?? null;
  const oppositeReadiness = oppositeUser ? await getSideReadiness(oppositeUser) : null;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, participant.roomId)).limit(1);
  if (!room) return null;

  const modeB = isMediatorFacilitatedRoom(room);
  if (modeB && !room.mediationStartedAt) {
    await tryFinalizeMediatorSession(room.id);
  }

  const [freshRoom] = modeB
    ? await db.select().from(rooms).where(eq(rooms.id, participant.roomId)).limit(1)
    : [room];
  const activeRoom = freshRoom ?? room;

  const bothReady = selfReadiness.mediationReady && !!oppositeReadiness?.mediationReady;
  const pipelineComplete = await isPostIntakePipelineComplete(activeRoom.id);
  const pipelineRunning = bothReady && !pipelineComplete && (await canTriggerPostIntakePipeline(activeRoom.id));

  let preparingMediationRoom = false;
  let canStartMediation = false;
  let startWindowOpen = false;

  if (modeB) {
    preparingMediationRoom = false;
    const scheduled = activeRoom.scheduledStartAt;
    startWindowOpen = !!scheduled && Date.now() >= scheduled.getTime() - START_BUTTON_LEAD_MS;
    canStartMediation = bothReady && pipelineComplete && !!scheduled && startWindowOpen;
  } else {
    const openingPrepared = pipelineComplete ? await isMediationOpeningPrepared(activeRoom.id) : false;
    preparingMediationRoom = bothReady && pipelineComplete && !openingPrepared;
    canStartMediation = bothReady && pipelineComplete && openingPrepared;
  }

  return {
    room: activeRoom,
    self: selfReadiness,
    opposite: oppositeReadiness,
    oppositeRole,
    bothReady,
    pipelineComplete,
    pipelineRunning,
    preparingMediationRoom,
    canStartMediation,
    isMediatorFacilitated: modeB,
    scheduledStartAt: activeRoom.scheduledStartAt?.toISOString() ?? null,
    startWindowOpen,
  };
}
