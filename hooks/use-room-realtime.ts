"use client";

import { useEffect, useRef } from "react";
import { useRealtime } from "@/lib/realtime-client";
import { roomChannel, userChannel } from "@/lib/realtime/keys";

const DEBOUNCE_MS = 150;
const DEFAULT_FALLBACK_POLL_MS = 15_000;

export type RoomRealtimeOptions = {
  /** Kept for call-site compatibility; party readiness uses room.change (notifyRoom). */
  watchUsers?: boolean;
  /** Kept for call-site compatibility; other users' channels are not authorized. */
  partyUserIds?: string[];
  enabled?: boolean;
  /**
   * Always poll in addition to realtime (useful for readiness checklists when SSE is quiet).
   * Pass `false` to disable all polling; omit for fallback-only when disconnected/connecting.
   */
  pollIntervalMs?: number | false;
};

function openPolling(onEvent: () => void, intervalMs: number) {
  const id = window.setInterval(onEvent, intervalMs);
  return () => window.clearInterval(id);
}

/**
 * Live room updates via Upstash Redis Streams + SSE.
 * Polling falls back when disconnected, and can run always when pollIntervalMs is set.
 * Events are debounced so reconnect history does not double-refresh.
 */
export function useRoomRealtime(
  roomId: string | null | undefined,
  onEvent: () => void,
  options: RoomRealtimeOptions = {},
) {
  const { enabled = true, pollIntervalMs } = options;
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

    const needsFallback =
      status === "disconnected" ||
      status === "error" ||
      status === "connecting";
    const alwaysPoll =
      typeof pollIntervalMs === "number" && pollIntervalMs > 0;
    const interval =
      alwaysPoll
        ? pollIntervalMs
        : needsFallback
          ? DEFAULT_FALLBACK_POLL_MS
          : null;

    let pollCleanup: (() => void) | null = null;
    if (interval !== null && pollIntervalMs !== false) {
      pollCleanup = openPolling(schedule, interval);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      pollCleanup?.();
      if (debounceId.current !== undefined) window.clearTimeout(debounceId.current);
    };
  }, [roomId, enabled, status, pollIntervalMs]);
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
  options: { enabled?: boolean; pollIntervalMs?: number | false } = {},
) {
  const { enabled = true, pollIntervalMs } = options;
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

    const needsFallback =
      status === "disconnected" ||
      status === "error" ||
      status === "connecting";
    const alwaysPoll =
      typeof pollIntervalMs === "number" && pollIntervalMs > 0;
    const interval =
      alwaysPoll
        ? pollIntervalMs
        : needsFallback
          ? DEFAULT_FALLBACK_POLL_MS
          : null;

    let pollCleanup: (() => void) | null = null;
    if (interval !== null && pollIntervalMs !== false) {
      pollCleanup = openPolling(schedule, interval);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      pollCleanup?.();
      if (debounceId.current !== undefined) window.clearTimeout(debounceId.current);
    };
  }, [userId, enabled, status, pollIntervalMs]);
}
