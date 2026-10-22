"use server";

import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { roomParticipants, rooms } from "@/drizzle/schema";
import { createMagicLinkForUser } from "@/lib/magic-link";

export async function generateMagicLinkAction(userId: string) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "mediator")) {
    throw new Error("Unauthorized");
  }

  if (role === "mediator") {
    const mediatorId = await requireSessionUserId();
    const [membership] = await db
      .select({ id: roomParticipants.id })
      .from(roomParticipants)
      .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
      .where(
        and(eq(roomParticipants.userId, userId), eq(rooms.createdByUserId, mediatorId)),
      )
      .limit(1);
    if (!membership) {
      throw new Error("Unauthorized");
    }
  }

  return createMagicLinkForUser(userId);
}
