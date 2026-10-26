"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { roomParticipants, rooms, users } from "@/drizzle/schema";
import { isPartyRole } from "@/lib/participant-roles";
import {
  assertMediatorOwnsPartyUser,
  redoAllPartyTestsLocal,
  redoFullPartyProfileLocal,
  redoPartyBotPromptLocal,
  redoPartyTestLocal,
} from "@/lib/room/party-redo";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";

async function assertCanManageParty(userId: string) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "mediator")) {
    throw new Error("Unauthorized");
  }
  const actorId = await requireSessionUserId();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !isPartyRole(user.role)) {
    throw new Error("User is not a party participant.");
  }

  if (role === "mediator") {
    await assertMediatorOwnsPartyUser(actorId, userId);
  }

  return { role, actorId, user };
}

function revalidateSidesPaths() {
  revalidatePath("/admin/sides");
  revalidatePath("/mediator/sides");
  revalidatePath("/admin/rooms");
  revalidatePath("/mediator/rooms");
}

export async function updatePartyMetaAction(
  userId: string,
  title: string,
  description: string,
) {
  await assertCanManageParty(userId);
  const nextTitle = title.trim();
  const nextDescription = description.trim();
  if (!nextTitle) throw new Error("Title is required.");
  if (!nextDescription) throw new Error("Description is required.");

  await db
    .update(users)
    .set({ title: nextTitle, description: nextDescription })
    .where(eq(users.id, userId));

  notifyUser(userId);
  const [user] = await db
    .select({ roomId: users.roomId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  notifyRoom(user?.roomId);
  revalidateSidesPaths();
  if (user?.roomId) {
    revalidatePath(`/admin/rooms/${user.roomId}`);
    revalidatePath(`/mediator/rooms/${user.roomId}`);
  }
}

export async function redoPartyTestAction(userId: string, testKey: string) {
  await assertCanManageParty(userId);
  if (!TEST_KEYS.includes(testKey as TestKey)) {
    throw new Error("Invalid test key.");
  }
  await redoPartyTestLocal(userId, testKey as TestKey);
  revalidateSidesPaths();
}

export async function redoAllPartyTestsAction(userId: string) {
  await assertCanManageParty(userId);
  await redoAllPartyTestsLocal(userId);
  revalidateSidesPaths();
}

export async function redoPartyBotPromptAction(userId: string) {
  await assertCanManageParty(userId);
  await redoPartyBotPromptLocal(userId);
  revalidateSidesPaths();
}

export async function redoFullPartyProfileAction(userId: string) {
  await assertCanManageParty(userId);
  await redoFullPartyProfileLocal(userId);
  revalidateSidesPaths();
}

/**
 * Deletes this party account and every room they participate in.
 * Other parties in those rooms are kept as free (roomless) accounts.
 * Mediators may only do this when every such room is one they own.
 */
export async function deletePartyAction(userId: string) {
  const { role, actorId } = await assertCanManageParty(userId);

  const memberships = await db
    .select({
      roomId: roomParticipants.roomId,
      createdByUserId: rooms.createdByUserId,
    })
    .from(roomParticipants)
    .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
    .where(eq(roomParticipants.userId, userId));

  if (role === "mediator") {
    const foreign = memberships.filter((row) => row.createdByUserId !== actorId);
    if (foreign.length > 0) {
      throw new Error(
        "This party is also in rooms you do not own. An admin must delete the party.",
      );
    }
  }

  const roomIds = [...new Set(memberships.map((row) => row.roomId))];
  const survivorUserIds = new Set<string>();

  if (roomIds.length > 0) {
    const members = await db
      .select({ userId: roomParticipants.userId, roomId: roomParticipants.roomId })
      .from(roomParticipants)
      .where(inArray(roomParticipants.roomId, roomIds));

    for (const member of members) {
      if (member.userId !== userId) survivorUserIds.add(member.userId);
      await db
        .update(users)
        .set({ roomId: null })
        .where(and(eq(users.id, member.userId), eq(users.roomId, member.roomId)));
    }

    // Deletes rooms + memberships via FK cascade. Does not delete other party users.
    await db.delete(rooms).where(inArray(rooms.id, roomIds));
    for (const roomId of roomIds) {
      notifyRoom(roomId);
    }
  }

  await db.delete(users).where(eq(users.id, userId));
  notifyUser(userId);
  for (const survivorId of survivorUserIds) {
    notifyUser(survivorId);
  }

  revalidateSidesPaths();
  for (const roomId of roomIds) {
    revalidatePath(`/admin/rooms/${roomId}`);
    revalidatePath(`/mediator/rooms/${roomId}`);
  }
}
