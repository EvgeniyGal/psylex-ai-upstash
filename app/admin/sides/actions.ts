"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
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
