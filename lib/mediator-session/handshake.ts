import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { START_BUTTON_LEAD_MS } from "@/lib/mediator-session/constants";
import {
  clearPartyNotificationIfType,
  setPartyNotification,
} from "@/lib/mediator-session/notifications";
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";
import { getSideReadiness } from "@/lib/dispute-intake";
import { isPostIntakePipelineComplete } from "@/lib/pipeline/gate";
import { getRoomSides } from "@/lib/room/helpers";
import { isPartyRole, type PartyRole } from "@/lib/participant-roles";
import { notifyRoom } from "@/lib/realtime/notify";

export type MediatorHandshakeStatus =
  | "idle"
  | "waiting"
  | "countdown"
  | "started"
  | "ineligible"
  | "not_scheduled"
  | "too_early";

export type MediatorHandshakeState = {
  status: MediatorHandshakeStatus;
  selfClicked: boolean;
  partyAClicked: boolean;
  partyBClicked: boolean;
  mediatorClicked: boolean;
  scheduledStartAt: string | null;
  canClickStart: boolean;
  msUntilStart: number | null;
  msUntilStartWindow: number | null;
};

type RoomHandshakeRow = {
  id: string;
  createdByUserId: string | null;
  scheduledStartAt: Date | null;
  partyAMediationStartClickedAt: Date | null;
  partyBMediationStartClickedAt: Date | null;
  mediatorMediationStartClickedAt: Date | null;
  mediationStartedAt: Date | null;
  mediatorSessionStartedAt: Date | null;
};

export async function areMediatorSessionPrerequisitesMet(roomId: string) {
  const sides = await getRoomSides(roomId);
  const partyA = sides.find((s) => s.role === "party_a");
  const partyB = sides.find((s) => s.role === "party_b");
  if (!partyA || !partyB) return false;

  const [aReady, bReady] = await Promise.all([getSideReadiness(partyA), getSideReadiness(partyB)]);
  if (!aReady?.mediationReady || !bReady?.mediationReady) return false;

  return isPostIntakePipelineComplete(roomId);
}

export function canShowStartButton(room: RoomHandshakeRow, now = Date.now()) {
  if (!room.scheduledStartAt || room.mediationStartedAt) return false;
  const startMs = room.scheduledStartAt.getTime();
  return now >= startMs - START_BUTTON_LEAD_MS;
}

export function allThreeClicked(room: RoomHandshakeRow) {
  return (
    !!room.partyAMediationStartClickedAt &&
    !!room.partyBMediationStartClickedAt &&
    !!room.mediatorMediationStartClickedAt
  );
}

export function shouldStartSession(room: RoomHandshakeRow, now = Date.now()) {
  if (room.mediationStartedAt || !room.scheduledStartAt) return false;
  if (!allThreeClicked(room)) return false;
  return now >= room.scheduledStartAt.getTime();
}

function evaluateHandshake(
  room: RoomHandshakeRow,
  viewer: "mediator" | PartyRole,
  prerequisitesMet: boolean,
  now = Date.now(),
): MediatorHandshakeState {
  const scheduledStartAt = room.scheduledStartAt?.toISOString() ?? null;
  const partyAClicked = !!room.partyAMediationStartClickedAt;
  const partyBClicked = !!room.partyBMediationStartClickedAt;
  const mediatorClicked = !!room.mediatorMediationStartClickedAt;
  const selfClicked =
    viewer === "mediator"
      ? mediatorClicked
      : viewer === "party_a"
        ? partyAClicked
        : partyBClicked;

  if (room.mediationStartedAt) {
    return {
      status: "started",
      selfClicked: true,
      partyAClicked: true,
      partyBClicked: true,
      mediatorClicked: true,
      scheduledStartAt,
      canClickStart: false,
      msUntilStart: null,
      msUntilStartWindow: null,
    };
  }

  if (!room.scheduledStartAt) {
    return {
      status: "not_scheduled",
      selfClicked,
      partyAClicked,
      partyBClicked,
      mediatorClicked,
      scheduledStartAt: null,
      canClickStart: false,
      msUntilStart: null,
      msUntilStartWindow: null,
    };
  }

  if (!prerequisitesMet) {
    return {
      status: "ineligible",
      selfClicked,
      partyAClicked,
      partyBClicked,
      mediatorClicked,
      scheduledStartAt,
      canClickStart: false,
      msUntilStart: Math.max(0, room.scheduledStartAt.getTime() - now),
      msUntilStartWindow: Math.max(0, room.scheduledStartAt.getTime() - START_BUTTON_LEAD_MS - now),
    };
  }

  const startMs = room.scheduledStartAt.getTime();
  const windowOpensAt = startMs - START_BUTTON_LEAD_MS;
  const msUntilStart = Math.max(0, startMs - now);
  const msUntilStartWindow = Math.max(0, windowOpensAt - now);
  const inStartWindow = now >= windowOpensAt;

  if (!inStartWindow) {
    return {
      status: "too_early",
      selfClicked,
      partyAClicked,
      partyBClicked,
      mediatorClicked,
      scheduledStartAt,
      canClickStart: false,
      msUntilStart,
      msUntilStartWindow,
    };
  }

  if (allThreeClicked(room) && now < startMs) {
    return {
      status: "countdown",
      selfClicked,
      partyAClicked,
      partyBClicked,
      mediatorClicked,
      scheduledStartAt,
      canClickStart: false,
      msUntilStart,
      msUntilStartWindow: 0,
    };
  }

  if (selfClicked || partyAClicked || partyBClicked || mediatorClicked) {
    return {
      status: "waiting",
      selfClicked,
      partyAClicked,
      partyBClicked,
      mediatorClicked,
      scheduledStartAt,
      canClickStart: !selfClicked,
      msUntilStart,
      msUntilStartWindow: 0,
    };
  }

  return {
    status: "idle",
    selfClicked: false,
    partyAClicked,
    partyBClicked,
    mediatorClicked,
    scheduledStartAt,
    canClickStart: true,
    msUntilStart,
    msUntilStartWindow: 0,
  };
}

async function loadRoomHandshake(roomId: string): Promise<RoomHandshakeRow | null> {
  const [room] = await db
    .select({
      id: rooms.id,
      createdByUserId: rooms.createdByUserId,
      scheduledStartAt: rooms.scheduledStartAt,
      partyAMediationStartClickedAt: rooms.partyAMediationStartClickedAt,
      partyBMediationStartClickedAt: rooms.partyBMediationStartClickedAt,
      mediatorMediationStartClickedAt: rooms.mediatorMediationStartClickedAt,
      mediationStartedAt: rooms.mediationStartedAt,
      mediatorSessionStartedAt: rooms.mediatorSessionStartedAt,
    })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  return room ?? null;
}

async function finalizeMediatorSessionStart(roomId: string): Promise<Date | null> {
  const room = await loadRoomHandshake(roomId);
  if (!room || !isMediatorFacilitatedRoom(room) || !room.scheduledStartAt) return null;
  if (!shouldStartSession(room)) return null;

  const startedAt =
    Date.now() > room.scheduledStartAt.getTime() ? new Date() : room.scheduledStartAt;

  const [updated] = await db
    .update(rooms)
    .set({
      mediationStartedAt: startedAt,
      mediatorSessionStartedAt: startedAt,
    })
    .where(and(eq(rooms.id, roomId), isNull(rooms.mediationStartedAt)))
    .returning({ mediationStartedAt: rooms.mediationStartedAt });
  notifyRoom(roomId);

  if (!updated) {
    const fresh = await loadRoomHandshake(roomId);
    return fresh?.mediationStartedAt ?? null;
  }

  await setPartyNotification({
    roomId,
    type: "session_started",
    targetRole: "all",
  });

  const { startMediatorSession } = await import("@/lib/mediator-session/orchestrator");
  try {
    await startMediatorSession(roomId);
  } catch (error) {
    console.error("Failed to start mediator session", error);
  }

  return updated.mediationStartedAt;
}

export async function tryFinalizeMediatorSession(roomId: string) {
  const room = await loadRoomHandshake(roomId);
  if (!room || !isMediatorFacilitatedRoom(room)) return null;
  if (room.mediationStartedAt) return room.mediationStartedAt;
  if (!shouldStartSession(room)) return null;
  return finalizeMediatorSessionStart(roomId);
}

export async function recordMediatorStartClick(
  roomId: string,
  viewer: "mediator" | PartyRole,
): Promise<MediatorHandshakeState> {
  const room = await loadRoomHandshake(roomId);
  if (!room || !isMediatorFacilitatedRoom(room)) {
    return evaluateHandshake(
      {
        id: roomId,
        createdByUserId: null,
        scheduledStartAt: null,
        partyAMediationStartClickedAt: null,
        partyBMediationStartClickedAt: null,
        mediatorMediationStartClickedAt: null,
        mediationStartedAt: null,
        mediatorSessionStartedAt: null,
      },
      viewer,
      false,
    );
  }

  const prerequisitesMet = await areMediatorSessionPrerequisitesMet(roomId);
  if (!prerequisitesMet || !canShowStartButton(room)) {
    return evaluateHandshake(room, viewer, prerequisitesMet);
  }

  if (room.mediationStartedAt) {
    return evaluateHandshake(room, viewer, true);
  }

  const patch =
    viewer === "mediator"
      ? { mediatorMediationStartClickedAt: new Date() }
      : viewer === "party_a"
        ? { partyAMediationStartClickedAt: new Date() }
        : { partyBMediationStartClickedAt: new Date() };

  const existing =
    viewer === "mediator"
      ? room.mediatorMediationStartClickedAt
      : viewer === "party_a"
        ? room.partyAMediationStartClickedAt
        : room.partyBMediationStartClickedAt;

  if (!existing) {
    await db.update(rooms).set(patch).where(eq(rooms.id, roomId));
    notifyRoom(roomId);
    // "You can now click Start" is obsolete once anyone has clicked.
    await clearPartyNotificationIfType(roomId, "start_window_open");
  }

  const updated = await loadRoomHandshake(roomId);
  if (!updated) {
    return evaluateHandshake(room, viewer, prerequisitesMet);
  }

  if (shouldStartSession(updated)) {
    await finalizeMediatorSessionStart(roomId);
    const fresh = await loadRoomHandshake(roomId);
    if (fresh) return evaluateHandshake(fresh, viewer, true);
  }

  return evaluateHandshake(updated, viewer, prerequisitesMet);
}

export async function getMediatorHandshakeForParty(userId: string): Promise<MediatorHandshakeState | null> {
  const [viewer] = await db
    .select({
      roomId: users.roomId,
      role: users.role,
      disputeIntakeSubmittedAt: users.disputeIntakeSubmittedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!viewer?.roomId || !isPartyRole(viewer.role) || !viewer.disputeIntakeSubmittedAt) {
    return null;
  }

  const room = await loadRoomHandshake(viewer.roomId);
  if (!room || !isMediatorFacilitatedRoom(room)) return null;

  await tryFinalizeMediatorSession(viewer.roomId);
  const fresh = (await loadRoomHandshake(viewer.roomId)) ?? room;
  const prerequisitesMet = await areMediatorSessionPrerequisitesMet(viewer.roomId);
  const state = evaluateHandshake(fresh, viewer.role, prerequisitesMet);

  if (state.status === "idle" && state.canClickStart) {
    const [current] = await db
      .select({ partyNotification: rooms.partyNotification })
      .from(rooms)
      .where(eq(rooms.id, viewer.roomId))
      .limit(1);
    const existing = current?.partyNotification as { type?: string } | null;
    if (existing?.type !== "start_window_open") {
      await setPartyNotification({
        roomId: viewer.roomId,
        type: "start_window_open",
        targetRole: "all",
      });
    }
  } else if (
    state.status === "waiting" ||
    state.status === "countdown" ||
    state.status === "started"
  ) {
    // Rooms already stuck with a stale banner after clicks / countdown.
    await clearPartyNotificationIfType(viewer.roomId, "start_window_open");
  }

  return state;
}

export async function getMediatorHandshakeForMediator(
  mediatorUserId: string,
  roomId: string,
): Promise<MediatorHandshakeState | null> {
  const room = await loadRoomHandshake(roomId);
  if (!room || room.createdByUserId !== mediatorUserId) return null;

  await tryFinalizeMediatorSession(roomId);
  const fresh = (await loadRoomHandshake(roomId)) ?? room;
  const prerequisitesMet = await areMediatorSessionPrerequisitesMet(roomId);
  return evaluateHandshake(fresh, "mediator", prerequisitesMet);
}
