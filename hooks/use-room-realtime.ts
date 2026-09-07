"use client";

import { useEffect, useRef } from "react";
import { useRealtime } from "@/lib/realtime-client";
import { roomChannel, userChannel } from "@/lib/realtime/keys";

const DEBOUNCE_MS = 150;
const POLL_INTERVAL_MS = 15_000;

export type RoomRealtimeOptions = {
  watchUsers?: boolean;
  partyUserIds?: string[];
  enabled?: boolean;
};

function openPolling(onEvent: () => void, intervalMs = POLL_INTERVAL_MS) {
  const id = window.setInterval(onEvent, intervalMs);
  return () => window.clearInterval(id);
}

/**
 * Live room updates via Upstash Redis Streams + SSE.
 * Polling is a last-resort fallback when the realtime connection is down.
 * Events are debounced so reconnect history does not double-refresh.
 */
export function useRoomRealtime(
  roomId: string | null | undefined,
  onEvent: () => void,
  options: RoomRealtimeOptions = {},
) {
  const { enabled = true } = options;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const debounceId = useRef<number | undefined>(undefined);

  const schedule = () => {
    if (debounceId.current !== undefined) window.clearTimeout(debounceId.current);
    debounceId.current = window.setTimeout(() => {
      onEventRef.current();
    }, DEBOUNCE_MS);
  };

  const { status } = useRealtime({
    enabled: Boolean(enabled && roomId),
    channels: roomId ? [roomChannel(roomId)] : [],
    events: ["room.change"],
    onData: () => schedule(),
  });

  useEffect(() => {
    if (!enabled || !roomId) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    let pollCleanup: (() => void) | null = null;
    if (status === "disconnected" || status === "error") {
      pollCleanup = openPolling(schedule);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      pollCleanup?.();
      if (debounceId.current !== undefined) window.clearTimeout(debounceId.current);
    };
  }, [roomId, enabled, status]);
}

/**
 * Fires onEvent once when a deadline ISO timestamp is reached (plus a small grace).
 */
export function useDeadlineRefresh(
  deadlineIso: string | null | undefined,
  onEvent: () => void,
  enabled = true,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !deadlineIso) return;
    if (firedFor.current === deadlineIso) return;

    const target = new Date(deadlineIso).getTime() + 400;
    const delay = target - Date.now();

    if (delay <= 0) {
      firedFor.current = deadlineIso;
      onEventRef.current();
      return;
    }

    const id = window.setTimeout(() => {
      firedFor.current = deadlineIso;
      onEventRef.current();
    }, delay);
    return () => window.clearTimeout(id);
  }, [deadlineIso, enabled]);
}

/**
 * Live user updates via Upstash (user channel) with polling fallback.
 */
export function useUserRealtime(
  userId: string | null | undefined,
  onEvent: () => void,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const debounceId = useRef<number | undefined>(undefined);

  const schedule = () => {
    if (debounceId.current !== undefined) window.clearTimeout(debounceId.current);
    debounceId.current = window.setTimeout(() => {
      onEventRef.current();
    }, DEBOUNCE_MS);
  };

  const { status } = useRealtime({
    enabled: Boolean(enabled && userId),
    channels: userId ? [userChannel(userId)] : [],
    events: ["user.change"],
    onData: () => schedule(),
  });

  useEffect(() => {
    if (!enabled || !userId) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    let pollCleanup: (() => void) | null = null;
    if (status === "disconnected" || status === "error") {
      pollCleanup = openPolling(schedule);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      pollCleanup?.();
      if (debounceId.current !== undefined) window.clearTimeout(debounceId.current);
    };
  }, [userId, enabled, status]);
}
