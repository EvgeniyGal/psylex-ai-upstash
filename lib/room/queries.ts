import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { readCachedRoomRow, writeCachedRoomRow } from "@/lib/realtime/cache";

export async function getRoomById(roomId: string) {
  const cached = await readCachedRoomRow(roomId);
  if (cached) return cached;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (room) await writeCachedRoomRow(room);
  return room ?? null;
}

export async function getRoomPageData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.roomId) return null;

  const room = await getRoomById(user.roomId);
  if (!room) return null;

  const viewerLocale = (user.preferredLocale as Locale) ?? "en";

  return {
    room,
    user,
    viewerLocale,
  };
}
