import { isUpstashConfigured, redis } from "@/lib/redis";
import { isRoomDirty } from "@/lib/realtime/notify";
import {
  ROOM_CACHE_TTL_SEC,
  roomRowCacheKey,
} from "@/lib/realtime/keys";
import { rooms } from "@/drizzle/schema";

type RoomRow = typeof rooms.$inferSelect;

function reviveDates<T extends Record<string, unknown>>(row: T): T {
  const next: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      next[key] = new Date(value);
    }
  }
  return next as T;
}

async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isUpstashConfigured()) return null;
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (error) {
    console.warn("[realtime-cache] get failed", key, error);
    return null;
  }
}

async function cacheSet(key: string, value: unknown) {
  if (!isUpstashConfigured()) return;
  try {
    await redis.set(key, value, { ex: ROOM_CACHE_TTL_SEC });
  } catch (error) {
    console.warn("[realtime-cache] set failed", key, error);
  }
}

export async function readCachedRoomRow(roomId: string): Promise<RoomRow | null> {
  if (isRoomDirty(roomId)) return null;
  const row = await cacheGet<RoomRow>(roomRowCacheKey(roomId));
  return row ? reviveDates(row) : null;
}

export async function writeCachedRoomRow(room: RoomRow) {
  await cacheSet(roomRowCacheKey(room.id), room);
}
