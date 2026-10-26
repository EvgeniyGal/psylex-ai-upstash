"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";

const SESSION_TIMER_TOAST_ID = "mode-a-session-timer";

type MediationCountdownProps = {
  startedAt: string;
  durationMinutes: number;
  onEnded?: () => void;
  /** When true, stop ticking and show session-ended (mediation finished before timer). */
  sessionComplete?: boolean;
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
    <div className="mode-a-toast-attention mode-a-toast-attention-timer flex min-w-[280px] items-baseline gap-3 rounded-lg border-2 border-law-line bg-law-fill px-4 py-3 shadow-md">
      <span className="font-display text-label-md uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      <span
        className={
          ended
            ? "font-display text-xl font-semibold text-error"
            : "font-display text-2xl font-semibold tabular-nums text-law"
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
}: MediationCountdownProps) {
  const { portal: t } = useLocale();
  const endsAt = useMemo(
    () => new Date(startedAt).getTime() + durationMinutes * 60_000,
    [durationMinutes, startedAt],
  );
  // Defer time display until after mount to avoid SSR/client Date.now() hydration mismatch.
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
      toast.dismiss(SESSION_TIMER_TOAST_ID);
      return;
    }

    if (remainingMs === null) return;

    const toastChrome =
      "!bg-transparent !border-0 !shadow-none !p-0 w-auto [&>[data-icon]]:!hidden [&_[data-icon]]:!hidden [&_.sonner-loading-wrapper]:!hidden";

    const body =
      remainingMs <= 0 ? (
        <SessionTimerToast ended label={t.mediationCountdownLabel} time={t.mediationSessionEnded} />
      ) : (
        <SessionTimerToast
          label={t.mediationCountdownLabel}
          time={formatRemaining(remainingMs)}
        />
      );

    // Prefer default toast + null icon so Sonner never attaches the loading spinner.
    // Dedicated toaster keeps the session clock above wait/status toasts.
    toast(body, {
      id: SESSION_TIMER_TOAST_ID,
      toasterId: "session-timer",
      duration: remainingMs <= 0 ? 8000 : Infinity,
      icon: null,
      className: toastChrome,
      unstyled: true,
    });
  }, [remainingMs, sessionComplete, t.mediationCountdownLabel, t.mediationSessionEnded]);

  useEffect(() => {
    return () => {
      toast.dismiss(SESSION_TIMER_TOAST_ID);
    };
  }, []);

  return null;
}
