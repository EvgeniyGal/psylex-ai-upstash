"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { isParticipantRole } from "@/lib/participant-roles";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

export async function syncParticipantLocale(locale: Locale) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isParticipantRole(session.user.role ?? "")) return;

  await db
    .update(users)
    .set({ preferredLocale: locale })
    .where(eq(users.id, session.user.id));
  notifyUser(session.user.id);
  const [row] = await db
    .select({ roomId: users.roomId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  notifyRoom(row?.roomId);

  revalidatePath("/room");
  revalidatePath("/dashboard");
}
