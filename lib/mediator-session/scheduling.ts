import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { setPartyNotification } from "@/lib/mediator-session/notifications";
import {
  DEFAULT_SCHEDULE_DURATION_MINUTES,
  isScheduleDurationOption,
  isScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { notifyRoom } from "@/lib/realtime/notify";
import { getSideReadiness, type SideReadiness } from "@/lib/dispute-intake";
import {
  getPostIntakePipelineDetail,
  isPostIntakePipelineRunning,
  type PostIntakePipelineDetail,
} from "@/lib/pipeline/gate";
import { getRoomSides } from "@/lib/room/helpers";
import type { TestKey } from "@/lib/test-keys";

export type PartySchedulingDetail = {
  ready: boolean;
  tests: Record<TestKey, boolean>;
  personalBotReady: boolean;
  disputeIntakeComplete: boolean;
};

export type MediatorSchedulingReadiness = {
  partyAReady: boolean;
  partyBReady: boolean;
  pipelineComplete: boolean;
  /** Both parties ready for pipeline and AI agents still running / incomplete. */
  pipelineRunning: boolean;
  canSchedule: boolean;
  scheduledStartAt: string | null;
  mediationDurationMinutes: number;
  mediationStarted: boolean;
  sessionComplete: boolean;
  mediationCompletedAt: string | null;
  partyAProfileReady: boolean;
  partyBProfileReady: boolean;
  partyAProfileReadyAt: string | null;
  partyBProfileReadyAt: string | null;
  partyATestsAt: string | null;
  partyBTestsAt: string | null;
  partyADetail: PartySchedulingDetail | null;
  partyBDetail: PartySchedulingDetail | null;
  pipelineDetail: PostIntakePipelineDetail | null;
};

function toPartyDetail(ready: SideReadiness | null): PartySchedulingDetail | null {
  if (!ready) return null;
  return {
    ready: ready.mediationReady,
    tests: ready.tests,
    personalBotReady: ready.personalBotReady,
    disputeIntakeComplete: ready.disputeIntakeComplete,
  };
}

export type ScheduleSaveErrorCode =
  | "past"
  | "invalid_time"
  | "invalid_minutes"
  | "invalid_duration"
  | "already_started"
  | "unauthorized"
  | "overlap"
  | "unknown";

export type ScheduleSaveResult =
  | { ok: true }
  | { ok: false; code: ScheduleSaveErrorCode };

export function scheduleErrorCodeFromMessage(message: string): ScheduleSaveErrorCode {
  if (message.includes("must be in the future")) return "past";
  if (message.includes("Invalid schedule time")) return "invalid_time";
  if (message.includes("multiple of 5")) return "invalid_minutes";
  if (message.includes("Invalid session duration")) return "invalid_duration";
  if (message.includes("Cannot reschedule")) return "already_started";
  if (message.includes("Unauthorized")) return "unauthorized";
  if (message.includes("already has a scheduled session") || message.includes("active mediation session")) {
    return "overlap";
  }
  return "unknown";
}

export async function getMediatorSchedulingReadiness(
  roomId: string,
): Promise<MediatorSchedulingReadiness | null> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return null;

  const sides = await getRoomSides(roomId);
  const partyA = sides.find((s) => s.role === "party_a");
  const partyB = sides.find((s) => s.role === "party_b");
  const { getPartyProfileStatus } = await import("@/lib/room/party-profile-status");
  const [aReady, bReady, aProfile, bProfile] = await Promise.all([
    partyA ? getSideReadiness(partyA) : null,
    partyB ? getSideReadiness(partyB) : null,
    partyA ? getPartyProfileStatus(partyA.id) : null,
    partyB ? getPartyProfileStatus(partyB.id) : null,
  ]);

  const partyAReady = !!aReady?.mediationReady;
  const partyBReady = !!bReady?.mediationReady;
  const pipelineDetail = await getPostIntakePipelineDetail(roomId);
  const pipelineComplete = !!pipelineDetail?.complete;
  const pipelineRunning = await isPostIntakePipelineRunning(roomId);
  const canSchedule = !room.mediationStartedAt;

  return {
    partyAReady,
    partyBReady,
    pipelineComplete,
    pipelineRunning,
    canSchedule,
    scheduledStartAt: room.scheduledStartAt?.toISOString() ?? null,
    mediationDurationMinutes: room.mediationDurationMinutes ?? DEFAULT_SCHEDULE_DURATION_MINUTES,
    mediationStarted: !!room.mediationStartedAt,
    sessionComplete: !!room.mediationCompletedAt || room.mediationPhase === "completed",
    mediationCompletedAt: room.mediationCompletedAt?.toISOString() ?? null,
    partyAProfileReady: !!aProfile?.ready,
    partyBProfileReady: !!bProfile?.ready,
    partyAProfileReadyAt: aProfile?.profileReadyAt ?? null,
    partyBProfileReadyAt: bProfile?.profileReadyAt ?? null,
    partyATestsAt: aProfile?.testsCompletedAt ?? null,
    partyBTestsAt: bProfile?.testsCompletedAt ?? null,
    partyADetail: toPartyDetail(aReady),
    partyBDetail: toPartyDetail(bReady),
    pipelineDetail,
  };
}

export async function scheduleMediatorSession(params: {
  roomId: string;
  mediatorUserId: string;
  scheduledStartAt: Date;
  durationMinutes: number;
}) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, params.roomId)).limit(1);
  if (!room || room.createdByUserId !== params.mediatorUserId) {
    throw new Error("Unauthorized");
  }
  if (room.mediationStartedAt) {
    throw new Error("Cannot reschedule a started session.");
  }

  if (Number.isNaN(params.scheduledStartAt.getTime())) {
    throw new Error("Invalid schedule time.");
  }
  if (params.scheduledStartAt.getTime() <= Date.now()) {
    throw new Error("Scheduled time must be in the future.");
  }
  if (!isScheduleMinuteOption(params.scheduledStartAt.getUTCMinutes())) {
    throw new Error("Start minutes must be a multiple of 5.");
  }
  if (!isScheduleDurationOption(params.durationMinutes)) {
    throw new Error("Invalid session duration.");
  }

  const { assertRoomPartiesNoOverlap, sessionWindowFromSchedule } = await import(
    "@/lib/room/helpers"
  );
  await assertRoomPartiesNoOverlap({
    roomId: params.roomId,
    window: sessionWindowFromSchedule(params.scheduledStartAt, params.durationMinutes),
    checkLive: true,
  });

  await db
    .update(rooms)
    .set({
      scheduledStartAt: params.scheduledStartAt,
      mediationDurationMinutes: params.durationMinutes,
      partyAMediationStartClickedAt: null,
      partyBMediationStartClickedAt: null,
      mediatorMediationStartClickedAt: null,
    })
    .where(eq(rooms.id, params.roomId));
  notifyRoom(params.roomId);

  await setPartyNotification({
    roomId: params.roomId,
    type: "session_scheduled",
    targetRole: "all",
    payload: {
      scheduledStartAt: params.scheduledStartAt.toISOString(),
      durationMinutes: params.durationMinutes,
    },
  });

  await logPipelineEvent({
    roomId: params.roomId,
    agentKey: "mediation",
    eventType: "agent_completed",
    payload: {
      step: "session_scheduled",
      scheduledStartAt: params.scheduledStartAt.toISOString(),
      durationMinutes: params.durationMinutes,
    },
  });
}
