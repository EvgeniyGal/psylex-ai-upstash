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
  /** True while a flush is queued for this batch. */
  flushScheduled: boolean;
};

const storage = new AsyncLocalStorage<NotifyBatch>();

function peekBatch(): NotifyBatch | undefined {
  return storage.getStore();
}

function scheduleFlush(batch: NotifyBatch) {
  if (batch.flushScheduled) return;
  batch.flushScheduled = true;

  const run = () => {
    void flush(batch);
  };

  // Always microtask so emits work inside scheduleMediationWork / nested after().
  queueMicrotask(run);

  // Also end-of-request after() when available (HTTP path); no-op if batch already empty.
  try {
    after(run);
  } catch {
    // microtask already covers background / nested-after contexts
  }
}

function getBatch(): NotifyBatch {
  const existing = peekBatch();
  if (existing) return existing;

  const batch: NotifyBatch = {
    rooms: new Set(),
    users: new Set(),
    flushScheduled: false,
  };
  storage.enterWith(batch);
  return batch;
}

export function isRoomDirty(roomId: string) {
  return peekBatch()?.rooms.has(roomId) ?? false;
}

export function notifyRoom(roomId: string | null | undefined) {
  if (!roomId) return;
  const batch = getBatch();
  batch.rooms.add(roomId);
  scheduleFlush(batch);
  void invalidateRoomCache(roomId);
}

export function notifyUser(userId: string | null | undefined) {
  if (!userId) return;
  const batch = getBatch();
  batch.users.add(userId);
  scheduleFlush(batch);
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
  // Allow later notifyRoom calls in the same async context to schedule again.
  batch.flushScheduled = false;
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
