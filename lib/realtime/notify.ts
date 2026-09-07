import { AsyncLocalStorage } from "node:async_hooks";
import { after } from "next/server";
import { isUpstashConfigured, redis } from "@/lib/redis";
import { realtime } from "@/lib/realtime";
import {
  roomChannel,
  roomMessagesCacheKey,
  roomRowCacheKey,
  userChannel,
} from "@/lib/realtime/keys";

type NotifyBatch = {
  rooms: Set<string>;
  users: Set<string>;
};

const storage = new AsyncLocalStorage<NotifyBatch>();

function peekBatch(): NotifyBatch | undefined {
  return storage.getStore();
}

function getBatch(): NotifyBatch {
  const existing = peekBatch();
  if (existing) return existing;

  const batch: NotifyBatch = { rooms: new Set(), users: new Set() };
  storage.enterWith(batch);

  const run = () => flush(batch);
  try {
    after(run);
  } catch {
    queueMicrotask(() => {
      void run();
    });
  }

  return batch;
}

export function isRoomDirty(roomId: string) {
  return peekBatch()?.rooms.has(roomId) ?? false;
}

export function notifyRoom(roomId: string | null | undefined) {
  if (!roomId) return;
  getBatch().rooms.add(roomId);
  void invalidateRoomCache(roomId);
}

export function notifyUser(userId: string | null | undefined) {
  if (!userId) return;
  getBatch().users.add(userId);
}

async function invalidateRoomCache(roomId: string) {
  if (!isUpstashConfigured()) return;
  try {
    await redis.del(roomRowCacheKey(roomId), roomMessagesCacheKey(roomId));
  } catch (error) {
    console.warn("[realtime] cache invalidate failed", roomId, error);
  }
}

async function flush(batch: NotifyBatch) {
  const roomIds = [...batch.rooms];
  const userIds = [...batch.users];
  batch.rooms.clear();
  batch.users.clear();
  if (roomIds.length === 0 && userIds.length === 0) return;
  if (!isUpstashConfigured()) return;

  const t = Date.now();
  const pipeline = redis.pipeline();
  for (const roomId of roomIds) {
    pipeline.del(roomRowCacheKey(roomId), roomMessagesCacheKey(roomId));
  }

  await Promise.all([
    ...roomIds.map((roomId) =>
      realtime.channel(roomChannel(roomId)).emit("room.change", { t }),
    ),
    ...userIds.map((userId) =>
      realtime.channel(userChannel(userId)).emit("user.change", { t }),
    ),
    roomIds.length > 0 ? pipeline.exec() : Promise.resolve(),
  ]);
}
