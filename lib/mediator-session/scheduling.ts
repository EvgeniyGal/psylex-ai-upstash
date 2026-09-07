import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { setPartyNotification } from "@/lib/mediator-session/notifications";
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";
import {
  DEFAULT_SCHEDULE_DURATION_MINUTES,
  isScheduleDurationOption,
  isScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { notifyRoom } from "@/lib/realtime/notify";
import { getSideReadiness } from "@/lib/dispute-intake";
import { isPostIntakePipelineComplete } from "@/lib/pipeline/gate";
import { getRoomSides } from "@/lib/room/helpers";

export type MediatorSchedulingReadiness = {
  partyAReady: boolean;
  partyBReady: boolean;
  pipelineComplete: boolean;
  canSchedule: boolean;
  scheduledStartAt: string | null;
  mediationDurationMinutes: number;
  mediationStarted: boolean;
  sessionComplete: boolean;
  mediationCompletedAt: string | null;
};

export async function getMediatorSchedulingReadiness(
  roomId: string,
): Promise<MediatorSchedulingReadiness | null> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || !isMediatorFacilitatedRoom(room)) return null;

  const sides = await getRoomSides(roomId);
  const partyA = sides.find((s) => s.role === "party_a");
  const partyB = sides.find((s) => s.role === "party_b");
  const [aReady, bReady] = await Promise.all([
    partyA ? getSideReadiness(partyA) : null,
    partyB ? getSideReadiness(partyB) : null,
  ]);

  const partyAReady = !!aReady?.mediationReady;
  const partyBReady = !!bReady?.mediationReady;
  const pipelineComplete = await isPostIntakePipelineComplete(roomId);
  const canSchedule = !room.mediationStartedAt;

  return {
    partyAReady,
    partyBReady,
    pipelineComplete,
    canSchedule,
    scheduledStartAt: room.scheduledStartAt?.toISOString() ?? null,
    mediationDurationMinutes: room.mediationDurationMinutes ?? DEFAULT_SCHEDULE_DURATION_MINUTES,
    mediationStarted: !!room.mediationStartedAt,
    sessionComplete: !!room.mediationCompletedAt || room.mediationPhase === "completed",
    mediationCompletedAt: room.mediationCompletedAt?.toISOString() ?? null,
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
