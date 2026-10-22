"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  clickMediatorStartMediation,
  fetchMediatorLobbyHandshake,
  startMediatorSessionNow,
} from "@/app/mediator/rooms/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import {
  formatCountdownMs,
  useScheduledSessionClock,
} from "@/hooks/use-scheduled-session-clock";
import { formatDateTime } from "@/lib/format-datetime";
import type { MediatorHandshakeState } from "@/lib/mediator-session/handshake";
import { waitingForStartMessages } from "@/lib/mediator-session/waiting-for";
import { cn } from "@/lib/utils";

type MediatorSessionLobbyProps = {
  roomId: string;
  roomTitle: string;
  initialHandshake: MediatorHandshakeState;
  partyUserIds?: string[];
};

function ClickStatusRow({ label, clicked }: { label: string; clicked: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={cn("font-semibold", clicked ? "text-success" : "text-error")}>
        {clicked ? "✓" : "…"}
      </span>
    </li>
  );
}

export function MediatorSessionLobby({
  roomId,
  roomTitle,
  initialHandshake,
  partyUserIds = [],
}: MediatorSessionLobbyProps) {
  const { portal: t, admin, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [handshake, setHandshake] = useState(initialHandshake);

  const applyHandshake = useCallback(
    (next: MediatorHandshakeState) => {
      setHandshake(next);
      if (next.status === "started") {
        router.push(`/mediator/rooms/${roomId}/session`);
      }
    },
    [roomId, router],
  );

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorLobbyHandshake(roomId);
      if (next) applyHandshake(next);
    } catch {
      /* ignore */
    }
  }, [applyHandshake, roomId]);

  useRoomRealtime(roomId, () => {
    void refresh();
  }, {
    watchUsers: true,
    partyUserIds,
  });

  const { msUntilStart, msUntilStartWindow } = useScheduledSessionClock(
    handshake.scheduledStartAt,
    () => {
      void refresh();
    },
    handshake.status !== "started",
  );

  const onStart = () => {
    startTransition(async () => {
      try {
        const next = await clickMediatorStartMediation(roomId);
        applyHandshake(next);
      } catch {
        await refresh();
      }
    });
  };

  const onStartNow = () => {
    startTransition(async () => {
      try {
        const next = await startMediatorSessionNow(roomId);
        applyHandshake(next);
      } catch {
        await refresh();
      }
    });
  };

  const showStartWindowCountdown =
    handshake.status === "too_early" && msUntilStartWindow !== null && msUntilStartWindow > 0;
  const showSessionCountdown =
    (handshake.status === "countdown" ||
      (handshake.status === "waiting" && handshake.selfClicked)) &&
    msUntilStart !== null &&
    msUntilStart > 0;
  const showParticipantStatus =
    handshake.status === "waiting" || handshake.status === "countdown" || handshake.status === "idle";
  const showStartNow =
    handshake.status === "idle" ||
    handshake.status === "waiting" ||
    handshake.status === "countdown";
  const canStartNow = handshake.status === "countdown";

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary hover:text-on-surface"
        href={`/mediator/rooms/${roomId}`}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToRooms}
      </Link>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <h2 className="font-display text-headline-md text-on-surface">{roomTitle}</h2>
        <p className="text-body-sm text-on-surface-variant">{t.mediationLobbyTitle}</p>

        {handshake.scheduledStartAt ? (
          <p className="text-body-sm text-on-surface-variant">
            {t.modeBScheduledAt}: {formatDateTime(new Date(handshake.scheduledStartAt), locale)}
          </p>
        ) : (
          <p className="text-body-sm text-on-surface-variant">{t.modeBWaitingSchedule}</p>
        )}

        {showStartWindowCountdown ? (
          <p className="font-display text-headline-sm tabular-nums text-tertiary" suppressHydrationWarning>
            {t.modeBStartWindowOpens}: {formatCountdownMs(msUntilStartWindow)}
          </p>
        ) : null}

        {showSessionCountdown ? (
          <>
            <p className="font-display text-headline-sm tabular-nums text-tertiary" suppressHydrationWarning>
              {t.modeBCountdownToStart}: {formatCountdownMs(msUntilStart)}
            </p>
            {handshake.status === "countdown" ? (
              <p className="text-body-sm text-on-surface-variant">{t.modeBAllReadyCountdown}</p>
            ) : null}
          </>
        ) : null}

        {showParticipantStatus ? (
          <ul className="space-y-2 rounded-md bg-surface-container-low/60 p-3">
            <ClickStatusRow clicked={handshake.partyAClicked} label={t.roles.party_a} />
            <ClickStatusRow clicked={handshake.partyBClicked} label={t.roles.party_b} />
            <ClickStatusRow clicked={handshake.mediatorClicked} label={t.roles.mediator} />
          </ul>
        ) : null}

        {handshake.selfClicked && handshake.status === "waiting" ? (
          <div className="space-y-1">
            <p className="text-body-sm text-success">{t.modeBSelfClicked}</p>
            {waitingForStartMessages(handshake, t).map((message) => (
              <p className="text-body-sm text-on-surface-variant" key={message}>
                {message}
              </p>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <button
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!handshake.canClickStart || pending || handshake.selfClicked}
            onClick={onStart}
            type="button"
          >
            {pending ? <Spinner className="text-white" size="sm" /> : null}
            {t.mediationStart}
          </button>
          {showStartNow ? (
            <>
              <button
                className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canStartNow || pending}
                onClick={onStartNow}
                type="button"
              >
                {pending && canStartNow ? <Spinner className="text-on-surface" size="sm" /> : null}
                {t.mediationStartNow}
              </button>
              {!canStartNow ? (
                <p className="text-body-sm text-on-surface-variant">{t.mediationStartNowHint}</p>
              ) : null}
            </>
          ) : null}
          {handshake.status === "too_early" ? (
            <p className="text-body-sm text-on-surface-variant">{t.modeBStartAvailableHint}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
