"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type SessionElapsedTimerProps = {
  startedAt: string;
  /** Scheduled session length; when elapsed crosses this, onTimeUp fires once. */
  durationMinutes?: number | null;
  /** Notify only — does not complete the session. */
  onTimeUp?: () => void;
  sessionComplete?: boolean;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionElapsedTimer({
  startedAt,
  durationMinutes,
  onTimeUp,
  sessionComplete = false,
}: SessionElapsedTimerProps) {
  const { portal: t } = useLocale();
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const timeUpFired = useRef(false);

  useEffect(() => {
    if (sessionComplete) return;
    const start = new Date(startedAt).getTime();
    const endsAt =
      typeof durationMinutes === "number" && durationMinutes > 0
        ? start + durationMinutes * 60_000
        : null;

    const tick = () => {
      const now = Date.now();
      setElapsedMs(Math.max(0, now - start));
      if (endsAt !== null) {
        const remaining = Math.max(0, endsAt - now);
        setRemainingMs(remaining);
        if (remaining <= 0 && !timeUpFired.current) {
          timeUpFired.current = true;
          onTimeUp?.();
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, durationMinutes, onTimeUp, sessionComplete]);

  useEffect(() => {
    timeUpFired.current = false;
  }, [startedAt, durationMinutes]);

  const timeUp =
    !sessionComplete &&
    remainingMs !== null &&
    remainingMs <= 0 &&
    typeof durationMinutes === "number";

  return (
    <div className="glass-panel rounded-xl p-4 text-center">
      <p className="mb-1 font-display text-label-md uppercase text-on-surface-variant">
        {typeof durationMinutes === "number"
          ? t.mediationCountdownLabel
          : t.mediationElapsedLabel}
      </p>
      {sessionComplete ? (
        <p className="font-display text-display-md text-success">{t.mediationSessionCompleted}</p>
      ) : timeUp ? (
        <p className="font-display text-display-md text-error">{t.modeBSessionTimeUp}</p>
      ) : typeof durationMinutes === "number" ? (
        <p className="font-display text-display-md tabular-nums text-tertiary" suppressHydrationWarning>
          {remainingMs === null ? "--:--" : formatRemaining(remainingMs)}
        </p>
      ) : (
        <p className="font-display text-display-md tabular-nums text-tertiary" suppressHydrationWarning>
          {elapsedMs === null ? "--:--" : formatElapsed(elapsedMs)}
        </p>
      )}
    </div>
  );
}
