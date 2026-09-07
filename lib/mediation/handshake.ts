import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users, type rooms as roomsTable } from "@/drizzle/schema";
import { isPartyRole, type PartyRole } from "@/lib/participant-roles";
import { notifyRoom } from "@/lib/realtime/notify";

export type HandshakeStatus = "idle" | "waiting" | "started" | "ineligible";

export type HandshakeState = {
  status: HandshakeStatus;
  selfClicked: boolean;
  oppositeClicked: boolean;
};

export type HandshakeStatusResponse = {
  status: HandshakeStatus;
  selfClicked: boolean;
  oppositeClicked: boolean;
};

type RoomHandshakeRow = Pick<
  typeof roomsTable.$inferSelect,
  | "id"
  | "partyAMediationStartClickedAt"
  | "partyBMediationStartClickedAt"
  | "mediationStartedAt"
>;

function clickForRole(room: RoomHandshakeRow, role: PartyRole) {
  return role === "party_a" ? room.partyAMediationStartClickedAt : room.partyBMediationStartClickedAt;
}

function oppositeClickForRole(room: RoomHandshakeRow, role: PartyRole) {
  return role === "party_a" ? room.partyBMediationStartClickedAt : room.partyAMediationStartClickedAt;
}

export function evaluateHandshake(room: RoomHandshakeRow, viewerRole: PartyRole): HandshakeState {
  if (room.mediationStartedAt) {
    return { status: "started", selfClicked: true, oppositeClicked: true };
  }

  const selfClicked = !!clickForRole(room, viewerRole);
  const oppositeClicked = !!oppositeClickForRole(room, viewerRole);

  if (selfClicked && oppositeClicked) {
    return { status: "waiting", selfClicked: true, oppositeClicked: true };
  }
  if (selfClicked || oppositeClicked) {
    return { status: "waiting", selfClicked, oppositeClicked };
  }
  return { status: "idle", selfClicked: false, oppositeClicked: false };
}

function toResponse(state: HandshakeState): HandshakeStatusResponse {
  return {
    status: state.status,
    selfClicked: state.selfClicked,
    oppositeClicked: state.oppositeClicked,
  };
}

async function finalizeMediationStart(roomId: string): Promise<Date | null> {
  const [updated] = await db
    .update(rooms)
    .set({ mediationStartedAt: new Date() })
    .where(and(eq(rooms.id, roomId), isNull(rooms.mediationStartedAt)))
    .returning({ mediationStartedAt: rooms.mediationStartedAt });
  notifyRoom(roomId);

  if (!updated) {
    const [room] = await db
      .select({ mediationStartedAt: rooms.mediationStartedAt })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);
    return room?.mediationStartedAt ?? null;
  }

  const { startMediationSession } = await import("@/lib/mediation/orchestrator");
  try {
    await startMediationSession(roomId);
  } catch (error) {
    console.error("Failed to start mediation session", error);
  }

  return updated.mediationStartedAt;
}

async function loadRoomHandshake(roomId: string) {
  const [room] = await db
    .select({
      id: rooms.id,
      partyAMediationStartClickedAt: rooms.partyAMediationStartClickedAt,
      partyBMediationStartClickedAt: rooms.partyBMediationStartClickedAt,
      mediationStartedAt: rooms.mediationStartedAt,
    })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  return room ?? null;
}

export async function recordStartClick(roomId: string, role: PartyRole): Promise<HandshakeStatusResponse> {
  const room = await loadRoomHandshake(roomId);
  if (!room) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  if (room.mediationStartedAt) {
    return toResponse(evaluateHandshake(room, role));
  }

  const existingClick = clickForRole(room, role);
  const clickAt = existingClick ?? new Date();

  await db
    .update(rooms)
    .set(
      role === "party_a"
        ? { partyAMediationStartClickedAt: clickAt }
        : { partyBMediationStartClickedAt: clickAt },
    )
    .where(eq(rooms.id, roomId));
  notifyRoom(roomId);

  const updated = await loadRoomHandshake(roomId);
  if (!updated) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  if (updated.mediationStartedAt) {
    return toResponse(evaluateHandshake(updated, role));
  }

  const bothClicked = !!updated.partyAMediationStartClickedAt && !!updated.partyBMediationStartClickedAt;
  if (bothClicked) {
    await finalizeMediationStart(roomId);
    const fresh = await loadRoomHandshake(roomId);
    if (fresh) return toResponse(evaluateHandshake(fresh, role));
  }

  return toResponse(evaluateHandshake(updated, role));
}

export async function getHandshakeStatusForUser(userId: string): Promise<HandshakeStatusResponse> {
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
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  const role = viewer.role;
  const room = await loadRoomHandshake(viewer.roomId);
  if (!room) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false };
  }

  if (room.mediationStartedAt) {
    return toResponse(evaluateHandshake(room, role));
  }

  const bothClicked = !!room.partyAMediationStartClickedAt && !!room.partyBMediationStartClickedAt;
  if (bothClicked) {
    await finalizeMediationStart(viewer.roomId);
    const fresh = await loadRoomHandshake(viewer.roomId);
    if (fresh) return toResponse(evaluateHandshake(fresh, role));
  }

  return toResponse(evaluateHandshake(room, role));
}
