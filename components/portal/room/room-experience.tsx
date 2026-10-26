"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fetchMediationRoomState } from "@/app/(participant)/room/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationRoom } from "@/components/portal/room/mediation-room";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { resolveRoomFlowStep } from "@/lib/participant-flow";
import { partyDisplayLabel } from "@/lib/participant-roles";
import { cn } from "@/lib/utils";
import type { MediationPhase } from "@/lib/mediation/types";
import { useSession } from "next-auth/react";

type MediationRoomState = NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;

type RoomExperienceProps = {
  mediationState: MediationRoomState | null;
  roomId: string;
  roomTitle: string;
  review?: boolean;
};

export function RoomExperience({
  mediationState,
  roomId,
  roomTitle,
  review = false,
}: RoomExperienceProps) {
  const router = useRouter();
  const { portal: t } = useLocale();
  const { data: session } = useSession();
  const [phase, setPhase] = useState<MediationPhase | null>(mediationState?.room.phase ?? null);
  const refreshingRef = useRef(false);

  useRoomRealtime(
    roomId,
    () => {
      if (mediationState || refreshingRef.current || review) return;
      void fetchMediationRoomState()
        .then((next) => {
          if (!next || refreshingRef.current) return;
          refreshingRef.current = true;
          router.refresh();
        })
        .catch(() => {
          // retry via realtime
        });
    },
    {
      enabled: !mediationState && !review,
      watchUsers: false,
    },
  );

  if (!mediationState) {
    const flowStep = resolveRoomFlowStep(null, review);

    return (
      <PortalPageShell flowStep={flowStep}>
        <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col items-center justify-center gap-4 px-margin-mobile py-stack-lg md:px-margin-desktop">
          <Spinner size="xl" />
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="mb-2 font-display text-display-lg text-on-surface">
              {session?.user?.role === "party_a" || session?.user?.role === "party_b"
                ? partyDisplayLabel(session.user.role, t.roles, session.user.title)
                : t.roomTitle}
            </h1>
            <p className="font-sans text-body-lg text-on-surface-variant">{roomTitle}</p>
            <p className="mt-4 font-sans text-body-sm text-on-surface-variant">{t.mediationPreparing}</p>
          </motion.div>
        </main>
      </PortalPageShell>
    );
  }

  const flowStep = resolveRoomFlowStep(phase, review);
  const isTreatyView = phase === "completed" && !review;

  return (
    <PortalPageShell flowStep={flowStep}>
      <main
        className={cn(
          "mx-auto w-full space-y-6 px-gutter py-stack-lg",
          isTreatyView ? "max-w-container-max" : "max-w-3xl",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-display-lg text-on-surface">
            {partyDisplayLabel(
              mediationState.viewerRole,
              t.roles,
              session?.user?.title,
            )}
          </h1>
          <p className="text-body-md text-on-surface-variant">{mediationState.room.title}</p>
        </motion.div>

        <MediationRoom
          initialState={mediationState}
          onPhaseChange={setPhase}
          review={review}
          viewerRole={mediationState.viewerRole}
        />
      </main>
    </PortalPageShell>
  );
}
