"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  clickStartMediation,
  getMediationHandshakeStatus,
  getMediationLobbyStatus,
  prepareMediationOpeningForRoom,
  runPostIntakePipelineForRoom,
} from "@/app/dispute-intake/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useModeALobbyWaitToasts } from "@/hooks/use-mode-a-wait-toasts";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { scaleIn } from "@/lib/motion";
import type { HandshakeStatusResponse } from "@/lib/mediation/handshake";
import type { MediationLobbyStatus } from "@/lib/dispute-intake";
import type { PartyRole } from "@/lib/participant-roles";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";

type MediationLobbyProps = {
  roomId: string;
  roomTitle: string;
  self: MediationLobbyStatus["self"];
  opposite: MediationLobbyStatus["opposite"];
  oppositeRole: PartyRole;
  bothReady: boolean;
  pipelineRunning: boolean;
  preparingMediationRoom: boolean;
  canStartMediation: boolean;
  viewerRole: PartyRole;
  flowStep: ParticipantFlowStepId;
};

function StatusBadge({ ready, readyLabel, notReadyLabel }: { ready: boolean; readyLabel: string; notReadyLabel: string }) {
  return (
    <motion.div
      className={
        ready
          ? "flex items-center gap-2 rounded border border-success bg-success/10 px-3 py-2 text-success"
          : "flex items-center gap-2 rounded border border-error bg-error/10 px-3 py-2 text-error"
      }
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      key={ready ? "ready" : "not-ready"}
    >
      <span className="material-symbols-outlined text-sm">{ready ? "check_circle" : "pending"}</span>
      <span className="font-display text-label-md uppercase">{ready ? readyLabel : notReadyLabel}</span>
    </motion.div>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export function MediationLobby({
  roomId,
  roomTitle,
  self: initialSelf,
  opposite: initialOpposite,
  oppositeRole,
  bothReady: initialBothReady,
  pipelineRunning: initialPipelineRunning,
  preparingMediationRoom: initialPreparingMediationRoom,
  canStartMediation: initialCanStartMediation,
  viewerRole,
  flowStep,
}: MediationLobbyProps) {
  const { portal: t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [lobby, setLobby] = useState({
    self: initialSelf,
    opposite: initialOpposite,
    bothReady: initialBothReady,
    pipelineRunning: initialPipelineRunning,
    preparingMediationRoom: initialPreparingMediationRoom,
    canStartMediation: initialCanStartMediation,
  });
  const [handshake, setHandshake] = useState<HandshakeStatusResponse | null>(null);
  const redirectingRef = useRef(false);

  const oppositeReady = !!lobby.opposite?.mediationReady;
  const waitingForOpposite =
    handshake?.status === "waiting" && handshake.selfClicked && !handshake.oppositeClicked;
  const handshakeStarting =
    handshake?.status === "waiting" && handshake.selfClicked && handshake.oppositeClicked;
  const oppositeReadyToStart = !!handshake?.oppositeClicked && !handshake?.selfClicked;

  useModeALobbyWaitToasts({
    pipelineRunning: lobby.pipelineRunning,
    preparingRoom: lobby.preparingMediationRoom,
    bothReady: lobby.bothReady,
    waitingForOpposite,
    oppositeReadyToStart,
    handshakeStarting,
  });

  const redirectToRoom = useCallback(() => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    window.location.assign("/room");
  }, []);

  const applyLobbyStatus = useCallback((result: MediationLobbyStatus) => {
    if (result.mediationStarted) {
      redirectToRoom();
      return;
    }
    setLobby((prev) => {
      const next = {
        self: result.self,
        opposite: result.opposite,
        bothReady: result.bothReady,
        pipelineRunning: result.pipelineRunning,
        preparingMediationRoom: result.preparingMediationRoom,
        canStartMediation: result.canStartMediation,
      };
      if (
        prev.self.userId === next.self.userId &&
        prev.self.mediationReady === next.self.mediationReady &&
        prev.opposite?.userId === next.opposite?.userId &&
        prev.opposite?.mediationReady === next.opposite?.mediationReady &&
        prev.bothReady === next.bothReady &&
        prev.pipelineRunning === next.pipelineRunning &&
        prev.preparingMediationRoom === next.preparingMediationRoom &&
        prev.canStartMediation === next.canStartMediation
      ) {
        return prev;
      }
      return next;
    });
  }, [redirectToRoom]);

  const applyHandshake = useCallback((result: HandshakeStatusResponse) => {
    setHandshake((prev) => {
      if (
        prev &&
        prev.status === result.status &&
        prev.selfClicked === result.selfClicked &&
        prev.oppositeClicked === result.oppositeClicked
      ) {
        return prev;
      }
      return result;
    });
    if (result.status === "started") {
      redirectToRoom();
    }
  }, [redirectToRoom]);

  const refreshLobby = useCallback(() => {
    if (redirectingRef.current) return;
    void getMediationLobbyStatus()
      .then((result) => {
        if (!result) return;
        applyLobbyStatus(result);
      })
      .catch((error) => {
        console.error("Failed to refresh mediation lobby status:", error);
      });
  }, [applyLobbyStatus]);

  const refreshHandshake = useCallback(() => {
    if (redirectingRef.current || !lobby.canStartMediation) return;
    void getMediationHandshakeStatus()
      .then((result) => {
        if (result.status === "started") {
          applyHandshake(result);
          return;
        }
        setHandshake(result);
      })
      .catch((error) => {
        console.error("Failed to refresh mediation handshake status:", error);
      });
  }, [applyHandshake, lobby.canStartMediation]);

  const partyUserIds = [lobby.self.userId, lobby.opposite?.userId].filter(
    (id): id is string => Boolean(id),
  );

  useRoomRealtime(
    roomId,
    () => {
      refreshLobby();
      refreshHandshake();
    },
    {
      enabled: !redirectingRef.current,
      watchUsers: true,
      partyUserIds,
    },
  );

  useEffect(() => {
    refreshLobby();
  }, [refreshLobby]);

  useEffect(() => {
    if (!lobby.canStartMediation) return;
    refreshHandshake();
  }, [lobby.canStartMediation, refreshHandshake]);

  useEffect(() => {
    if (!lobby.preparingMediationRoom || !roomId) return;

    const kickPreparation = () => {
      void prepareMediationOpeningForRoom(roomId)
        .then((result) => {
          if (result.status === "complete" || result.status === "ran") {
            refreshLobby();
          }
        })
        .catch((error) => {
          console.error("Failed to prepare mediation opening:", error);
        });
    };

    kickPreparation();
    const retryId = window.setInterval(kickPreparation, 30_000);
    return () => window.clearInterval(retryId);
  }, [lobby.preparingMediationRoom, refreshLobby, roomId]);

  useEffect(() => {
    if (!lobby.pipelineRunning || !roomId) return;

    const kickPipeline = () => {
      void runPostIntakePipelineForRoom(roomId)
        .then((result) => {
          if (result.status === "complete" || result.status === "ran") {
            refreshLobby();
          }
        })
        .catch((error) => {
          console.error("Failed to run post-intake pipeline:", error);
        });
    };

    kickPipeline();
    const retryId = window.setInterval(kickPipeline, 30_000);
    return () => window.clearInterval(retryId);
  }, [lobby.pipelineRunning, refreshLobby, roomId]);

  const handleStart = () => {
    startTransition(async () => {
      const result = await clickStartMediation();
      applyHandshake(result);
    });
  };

  const startDisabled =
    !lobby.canStartMediation ||
    isPending ||
    waitingForOpposite ||
    handshakeStarting ||
    handshake?.status === "started";

  return (
    <PortalPageShell flowStep={flowStep}>
      <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="mb-2 font-display text-display-lg text-on-surface">{t.mediationLobbyTitle}</h1>
          <p className="font-sans text-body-lg text-on-surface-variant">{roomTitle}</p>
          <p className="mt-2 font-sans text-body-sm text-on-surface-variant">{t.mediationLobbySubtitle}</p>
        </motion.div>

        <motion.div
          className="flex flex-col gap-stack-sm"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="card-lift rounded border border-hair border-t-[3px] border-t-party-a bg-surface-container p-6"
            variants={scaleIn}
          >
            <h2 className="mb-4 font-display text-headline-md text-ink">{t.mediationYourStatus}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[viewerRole]}</p>
            <AnimatePresence mode="wait">
              <StatusBadge
                notReadyLabel={t.mediationStatusNotReady}
                ready={lobby.self.mediationReady}
                readyLabel={t.mediationStatusReady}
              />
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="card-lift rounded border border-hair border-t-[3px] border-t-party-b bg-surface-container p-6"
            variants={scaleIn}
          >
            <h2 className="mb-4 font-display text-headline-md text-ink">{t.mediationOppositeSide}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[oppositeRole]}</p>
            {lobby.opposite ? (
              <AnimatePresence mode="wait">
                <StatusBadge
                  notReadyLabel={t.mediationStatusNotReady}
                  ready={oppositeReady}
                  readyLabel={t.mediationStatusReady}
                />
              </AnimatePresence>
            ) : (
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationOppositeNotReady}</p>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-stack-md flex flex-col items-center gap-stack-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <motion.button
            className={`btn-primary flex w-full items-center justify-center gap-2 px-8 py-4 font-display text-label-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto ${
              lobby.canStartMediation && !startDisabled ? "glow-ring" : ""
            }`}
            disabled={startDisabled}
            onClick={handleStart}
            type="button"
            whileHover={!startDisabled ? { scale: 1.02 } : undefined}
            whileTap={!startDisabled ? { scale: 0.98 } : undefined}
          >
            {isPending ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <span className="material-symbols-outlined text-xl">gavel</span>
            )}
            {t.mediationStart}
          </motion.button>
        </motion.div>
      </main>
    </PortalPageShell>
  );
}
