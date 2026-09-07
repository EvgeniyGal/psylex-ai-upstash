import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getRoomSides } from "@/lib/room/helpers";
import { notifyRoom } from "@/lib/realtime/notify";

function isPersonalBotReady(user: {
  personalBotPrompt: string | null;
  personalBotReadyAt: Date | null;
}) {
  return !!user.personalBotReadyAt && !!user.personalBotPrompt?.trim();
}

export { isPersonalBotReady };

export async function getRoomPartiesForPipeline(roomId: string) {
  const sides = await getRoomSides(roomId);
  const partyA = sides.find((side) => side.role === "party_a") ?? null;
  const partyB = sides.find((side) => side.role === "party_b") ?? null;
  return { partyA, partyB, sides };
}

/** @deprecated Use getRoomPartiesForPipeline */
export const getRoomSidesForPipeline = getRoomPartiesForPipeline;

export async function canTriggerPostIntakePipeline(roomId: string) {
  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  if (!partyA || !partyB) return false;

  return (
    hasSubmittedDisputeIntake(partyA) &&
    hasSubmittedDisputeIntake(partyB) &&
    isPersonalBotReady(partyA) &&
    isPersonalBotReady(partyB)
  );
}

export function isUserPsychodynamicComplete(user: {
  psychodynamicProfileAt: Date | null;
}) {
  return !!user.psychodynamicProfileAt;
}

export function isUserEmotionalTriggersComplete(user: {
  emotionalTriggersAt: Date | null;
}) {
  return !!user.emotionalTriggersAt;
}

export function isRoomInterestsComplete(room: { interestsAnalysisAt: Date | null }) {
  return !!room.interestsAnalysisAt;
}

export function isRoomLegalAnalysisComplete(room: { legalAnalysisAt: Date | null }) {
  return !!room.legalAnalysisAt;
}

export async function isPostIntakePipelineComplete(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return false;

  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  if (!partyA || !partyB) return false;

  return (
    isUserPsychodynamicComplete(partyA) &&
    isUserPsychodynamicComplete(partyB) &&
    isUserEmotionalTriggersComplete(partyA) &&
    isUserEmotionalTriggersComplete(partyB) &&
    isRoomInterestsComplete(room) &&
    isRoomLegalAnalysisComplete(room)
  );
}

export async function isPostIntakePipelineRunning(roomId: string) {
  const ready = await canTriggerPostIntakePipeline(roomId);
  if (!ready) return false;

  const complete = await isPostIntakePipelineComplete(roomId);
  return !complete;
}

export async function markPipelineStarted(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || room.postIntakePipelineStartedAt) return;

  await db
    .update(rooms)
    .set({ postIntakePipelineStartedAt: new Date() })
    .where(eq(rooms.id, roomId));
  notifyRoom(roomId);
}

export async function markPipelineCompleted(roomId: string) {
  await db
    .update(rooms)
    .set({ postIntakePipelineCompletedAt: new Date() })
    .where(eq(rooms.id, roomId));
  notifyRoom(roomId);
}

export async function listUsersWithPersonalBot() {
  const rows = await db.select().from(users);
  return rows.filter((user) => isPersonalBotReady(user));
}

export async function listUsersForEmotionalTriggersTest() {
  const rows = await db.select().from(users);
  return rows.filter(
    (user) => isPersonalBotReady(user) && hasSubmittedDisputeIntake(user),
  );
}

export async function listRoomsWithBothSidesIntakeComplete() {
  const allRooms = await db.select().from(rooms);
  const eligible = [];

  for (const room of allRooms) {
    if (await canTriggerPostIntakePipeline(room.id)) {
      eligible.push(room);
    }
  }

  return eligible;
}

export async function listEligibleMediationTestRooms() {
  const allRooms = await db.select().from(rooms);
  const eligible = [];

  for (const room of allRooms) {
    if (await isPostIntakePipelineComplete(room.id)) {
      eligible.push(room);
    }
  }

  return eligible;
}
