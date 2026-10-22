"use client";

import { useTransition } from "react";
import { selectParticipantRoom } from "@/app/(participant)/rooms/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { formatDateTime } from "@/lib/format-datetime";
import type { PartyRole } from "@/lib/participant-roles";

type RoomListItem = {
  id: string;
  title: string;
  partyRole: string;
  phase: string | null;
  mediationStartedAt: string | null;
  mediationCompletedAt: string | null;
  scheduledStartAt: string | null;
  joinedAt: string;
  intakeSubmitted: boolean;
};

export function PartyRoomsList({ rooms }: { rooms: RoomListItem[] }) {
  const { portal: t, locale } = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-margin-mobile py-stack-md md:px-margin-desktop">
      <h1 className="font-display text-headline-lg text-on-surface">{t.myRoomsTitle}</h1>
      <p className="text-body-md text-on-surface-variant">{t.myRoomsSubtitle}</p>

      {rooms.length === 0 ? (
        <p className="rounded-xl border border-hair bg-paper p-4 text-body-md text-on-surface-variant">
          {t.myRoomsEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => {
            const status = room.mediationCompletedAt
              ? t.myRoomsStatusCompleted
              : room.mediationStartedAt
                ? t.myRoomsStatusLive
                : room.scheduledStartAt
                  ? t.myRoomsStatusScheduled
                  : room.intakeSubmitted
                    ? t.myRoomsStatusPrep
                    : t.myRoomsStatusIntake;
            return (
              <li key={room.id}>
                <button
                  className="glass-panel flex w-full flex-col gap-2 rounded-xl p-4 text-left transition hover:border-law disabled:opacity-60"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await selectParticipantRoom(room.id);
                    });
                  }}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-headline-sm text-on-surface">{room.title}</span>
                    {pending ? <Spinner size="sm" /> : null}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {t.roles[room.partyRole as PartyRole] ?? room.partyRole} · {status}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {formatDateTime(new Date(room.joinedAt), locale)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
