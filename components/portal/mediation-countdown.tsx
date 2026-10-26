"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import type { AttentionSurface } from "@/hooks/attention-toasts";
import {
  removeMediatorAttention,
  upsertMediatorAttention,
} from "@/lib/mediator-attention-dock";

const SESSION_TIMER_TOAST_ID = "mode-a-session-timer";
const MEDIATOR_TIMER_ID = "mode-b-session-timer";

type MediationCountdownProps = {
  startedAt: string;
  durationMinutes: number;
  onEnded?: () => void;
  /** When true, stop ticking and show session-ended (mediation finished before timer). */
  sessionComplete?: boolean;
  /** toast = party top-left; mediator-dock = sidebar above Help. */
  surface?: AttentionSurface;
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function SessionTimerToast({
  label,
  time,
  ended,
}: {
  label: string;
  time: string;
  ended?: boolean;
}) {
  return (
    <div className="mode-a-toast-attention mode-a-toast-attention-timer flex w-[200px] max-w-[200px] flex-col gap-0.5 rounded-lg border-2 border-law-line bg-law-fill px-3 py-2 shadow-md">
      <span className="font-display text-[10px] uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      <span
        className={
          ended
            ? "font-display text-lg font-semibold leading-tight text-error"
            : "font-display text-xl font-semibold tabular-nums leading-tight text-law"
        }
      >
        {time}
      </span>
    </div>
  );
}

export function MediationCountdown({
  startedAt,
  durationMinutes,
  onEnded,
  sessionComplete = false,
  surface = "toast",
}: MediationCountdownProps) {
  const { portal: t } = useLocale();
  const endsAt = useMemo(
    () => new Date(startedAt).getTime() + durationMinutes * 60_000,
    [durationMinutes, startedAt],
  );
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const endedNotified = useRef(false);

  useEffect(() => {
    if (sessionComplete) return;

    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, sessionComplete]);

  const ended = sessionComplete || (remainingMs !== null && remainingMs <= 0);

  useEffect(() => {
    if (!ended || endedNotified.current) return;
    endedNotified.current = true;
    onEnded?.();
  }, [ended, onEnded]);

  useEffect(() => {
    if (sessionComplete) {
      if (surface === "mediator-dock") removeMediatorAttention(MEDIATOR_TIMER_ID);
      else toast.dismiss(SESSION_TIMER_TOAST_ID);
      return;
    }

    if (remainingMs === null) return;

    const label = t.mediationCountdownLabel;
    const time =
      remainingMs <= 0 ? t.mediationSessionEnded : formatRemaining(remainingMs);

    if (surface === "mediator-dock") {
      upsertMediatorAttention({
        id: MEDIATOR_TIMER_ID,
        kind: "timer",
        message: label,
        detail: time,
        ended: remainingMs <= 0,
      });
      return;
    }

    const toastChrome =
      "!bg-transparent !border-0 !shadow-none !p-0 w-auto max-w-[200px] [&>[data-icon]]:!hidden [&_[data-icon]]:!hidden [&_.sonner-loading-wrapper]:!hidden";

    const body =
      remainingMs <= 0 ? (
        <SessionTimerToast ended label={label} time={t.mediationSessionEnded} />
      ) : (
        <SessionTimerToast label={label} time={formatRemaining(remainingMs)} />
      );

    toast(body, {
      id: SESSION_TIMER_TOAST_ID,
      toasterId: "session-timer",
      duration: remainingMs <= 0 ? 8000 : Infinity,
      icon: null,
      className: toastChrome,
      unstyled: true,
    });
  }, [
    remainingMs,
    sessionComplete,
    surface,
    t.mediationCountdownLabel,
    t.mediationSessionEnded,
  ]);

  useEffect(() => {
    return () => {
      if (surface === "mediator-dock") removeMediatorAttention(MEDIATOR_TIMER_ID);
      else toast.dismiss(SESSION_TIMER_TOAST_ID);
    };
  }, [surface]);

  return null;
}
