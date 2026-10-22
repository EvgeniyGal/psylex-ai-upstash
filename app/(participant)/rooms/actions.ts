"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { isPartyRole } from "@/lib/participant-roles";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getParticipantRoom, listParticipantMemberships, setActiveRoom } from "@/lib/room/helpers";

export async function selectParticipantRoom(roomId: string) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!role || !isPartyRole(role)) {
    throw new Error("Unauthorized");
  }
  const userId = await requireSessionUserId();
  await setActiveRoom(userId, roomId);
  revalidatePath("/rooms");
  revalidatePath("/mediation");
  revalidatePath("/dispute-intake");
  revalidatePath("/room");

  const participant = await getParticipantRoom(userId);
  if (!participant || !hasSubmittedDisputeIntake(participant.user)) {
    redirect("/dispute-intake");
  }
  if (participant.user /* room may already have started */) {
    const { rooms } = await import("@/drizzle/schema");
    const { db } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (room?.mediationStartedAt) {
      redirect("/room");
    }
  }
  redirect("/mediation");
}

export async function listMyRoomsAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isPartyRole(session.user.role)) {
    return [];
  }
  const userId = await requireSessionUserId();
  return listParticipantMemberships(userId);
}
