import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { notifyRoom } from "@/lib/realtime/notify";
import type { PartyNotification, PartyNotificationType } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";

export async function setPartyNotification(params: {
  roomId: string;
  type: PartyNotificationType;
  targetRole?: PartyRole | "all";
  payload?: Record<string, unknown>;
}) {
  const notification: PartyNotification = {
    id: randomUUID(),
    type: params.type,
    targetRole: params.targetRole ?? "all",
    at: new Date().toISOString(),
    payload: params.payload,
  };

  await db
    .update(rooms)
    .set({ partyNotification: notification })
    .where(eq(rooms.id, params.roomId));
  notifyRoom(params.roomId);

  return notification;
}

/** Clears the room notification when it still matches the given type (e.g. stale start_window_open). */
export async function clearPartyNotificationIfType(
  roomId: string,
  type: PartyNotificationType,
) {
  const [current] = await db
    .select({ partyNotification: rooms.partyNotification })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  const existing = current?.partyNotification as PartyNotification | null;
  if (!existing || existing.type !== type) return;

  await db
    .update(rooms)
    .set({ partyNotification: null })
    .where(eq(rooms.id, roomId));
  notifyRoom(roomId);
}
