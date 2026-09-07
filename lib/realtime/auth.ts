import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { parseRoomChannel, parseUserChannel } from "@/lib/realtime/keys";

export async function authorizeRealtimeChannels(channels: string[]) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [viewer] = await db
    .select({
      id: users.id,
      role: users.role,
      roomId: users.roomId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!viewer) {
    return new Response("Forbidden", { status: 403 });
  }

  for (const channel of channels) {
    if (channel === "default") continue;

    const roomId = parseRoomChannel(channel);
    if (roomId) {
      const allowed = await canAccessRoomChannel(viewer, roomId);
      if (!allowed) {
        return new Response("Forbidden", { status: 403 });
      }
      continue;
    }

    const targetUserId = parseUserChannel(channel);
    if (targetUserId) {
      if (viewer.id !== targetUserId) {
        return new Response("Forbidden", { status: 403 });
      }
      continue;
    }

    return new Response("Forbidden", { status: 403 });
  }
}

async function canAccessRoomChannel(
  viewer: { id: string; role: string; roomId: string | null },
  roomId: string,
) {
  if (viewer.role === "admin") return true;
  if (viewer.roomId === roomId) return true;
  if (viewer.role !== "mediator") return false;

  const [owned] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.createdByUserId, viewer.id)))
    .limit(1);

  return Boolean(owned);
}
