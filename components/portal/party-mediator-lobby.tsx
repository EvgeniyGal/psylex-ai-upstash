"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runPostIntakePipelineForRoom } from "@/app/dispute-intake/actions";
import {
  clickMediatorPartyStartMediation,
  getMediatorPartyHandshakeAction,
} from "@/app/mediator/rooms/party-actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useModeBLobbyWaitToasts } from "@/hooks/use-mode-b-wait-toasts";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import {
  formatCountdownMs,
  useScheduledSessionClock,
} from "@/hooks/use-scheduled-session-clock";
import { formatDateTime } from "@/lib/format-datetime";
import type { MediatorHandshakeState } from "@/lib/mediator-session/handshake";
import type { PartyNotification } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";
import { cn } from "@/lib/utils";

type PartyMediatorLobbyProps = {
  roomId: string;
  roomTitle: string;
  viewerRole: PartyRole;
  flowStep: ParticipantFlowStepId;
  initialHandshake: MediatorHandshakeState;
  pipelineRunning: boolean;
  bothReady: boolean;
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

export function PartyMediatorLobby({
  roomId,
  roomTitle,
  viewerRole,
  flowStep,
  initialHandshake,
  pipelineRunning,
  bothReady,
  partyUserIds = [],
}: PartyMediatorLobbyProps) {
  const { portal: t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [handshake, setHandshake] = useState(initialHandshake);

  useModeBLobbyWaitToasts({
    status: handshake.status,
    selfClicked: handshake.selfClicked,
    partyAClicked: handshake.partyAClicked,
    partyBClicked: handshake.partyBClicked,
    mediatorClicked: handshake.mediatorClicked,
    canClickStart: handshake.canClickStart,
    pipelineRunning,
    enabled: handshake.status !== "started",
  });

  const applyHandshake = useCallback(
    (next: MediatorHandshakeState & { partyNotification?: PartyNotification | null }) => {
      const { partyNotification: _partyNotification, ...hs } = next;
      setHandshake(hs);
      if (hs.status === "started") {
        router.push("/room");
      }
    },
    [router],
  );

  const refresh = useCallback(async () => {
    try {
      const next = await getMediatorPartyHandshakeAction();
      if (!next) return;
      applyHandshake(next);
    } catch {
      /* ignore */
    }
  }, [applyHandshake]);

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

  useEffect(() => {
    if (bothReady && pipelineRunning) {
      void runPostIntakePipelineForRoom(roomId);
    }
  }, [bothReady, pipelineRunning, roomId]);

  const onStart = () => {
    startTransition(async () => {
      try {
        const next = await clickMediatorPartyStartMediation();
        if (next) applyHandshake(next);
        else await refresh();
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

  return (
    <PortalPageShell flowStep={flowStep}>
      <div className="mx-auto max-w-2xl space-y-6 px-margin-mobile py-stack-md md:px-margin-desktop">
        <h1 className="font-display text-headline-md text-on-surface">{roomTitle}</h1>

        <div className="glass-panel space-y-4 rounded-xl p-6">
          <h2 className="font-display text-headline-md text-on-surface">{t.mediationLobbyTitle}</h2>

          {handshake.scheduledStartAt ? (
            <p className="text-body-sm text-on-surface-variant">
              {t.modeBScheduledAt}: {formatDateTime(new Date(handshake.scheduledStartAt), locale)}
            </p>
          ) : null}

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
            {handshake.status === "too_early" ? (
              <p className="text-body-sm text-on-surface-variant">{t.modeBStartAvailableHint}</p>
            ) : null}
          </div>
        </div>
      </div>
    </PortalPageShell>
  );
}
