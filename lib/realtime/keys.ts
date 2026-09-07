export function roomChannel(roomId: string) {
  return `room-${roomId}`;
}

export function userChannel(userId: string) {
  return `user-${userId}`;
}

export function parseRoomChannel(channel: string): string | null {
  if (!channel.startsWith("room-")) return null;
  const roomId = channel.slice("room-".length).trim();
  return roomId || null;
}

export function parseUserChannel(channel: string): string | null {
  if (!channel.startsWith("user-")) return null;
  const userId = channel.slice("user-".length).trim();
  return userId || null;
}

export function roomRowCacheKey(roomId: string) {
  return `room:${roomId}:row`;
}

export function roomMessagesCacheKey(roomId: string) {
  return `room:${roomId}:messages`;
}

export const ROOM_CACHE_TTL_SEC = 30;
