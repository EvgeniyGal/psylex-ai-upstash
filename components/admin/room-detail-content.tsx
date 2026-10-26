"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteRoom,
  deleteRoomWithParties,
  requestProfileRefresh,
  updateParticipantMeta,
  updateRoomMeta,
} from "@/app/admin/rooms/actions";
import type { PartyProfileStatus } from "@/lib/room/party-profile-status";
import { CredentialActions, CredentialField } from "@/components/credential-actions";
import { RoomMediationDetailsModal } from "@/components/admin/room-mediation-details-modal";
import { SessionSchedulingSection } from "@/components/mediator/session-scheduling-section";
import { ModalOverlay } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { formatDateTime } from "@/lib/format-datetime";
import { formatRoomActivityEntry } from "@/lib/pipeline/format-room-activity-log";
import type { RoomActivityEntry } from "@/lib/pipeline/room-activity-log";
import type { AdminMediationDetails } from "@/lib/mediation/admin-room-details";
import type { RoomJurisdiction } from "@/lib/room/jurisdiction";
import { formatRoomJurisdiction } from "@/lib/room/jurisdiction";

export type RoomUserRow = {
  id: string;
  login: string;
  password: string;
  role: "admin" | "mediator" | "party_a" | "party_b";
  title: string;
  description: string;
  roomId: string | null;
};

export type RoomDetailRow = {
  id: string;
  title: string;
  description: string;
  jurisdiction: RoomJurisdiction;
  usaSubJurisdiction: string | null;
  /** Date from the server, or ISO string after RSC → client serialization. */
  createdAt: Date | string;
  createdByUserId?: string | null;
  scheduledStartAt?: Date | string | null;
  mediationDurationMinutes?: number;
  mediationStartedAt: Date | string | null;
  mediationPhase: string | null;
  mediationRound: number;
  mediationCompletedAt: Date | string | null;
  selectedOptionId: string | null;
};

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

function roleIcon(role: string) {
  if (role === "party_a") return "person";
  if (role === "party_b") return "balance";
  return "group";
}

function ParticipantSection({
  participant,
  readOnly,
  showCredentials,
  profileStatus,
}: {
  participant: RoomUserRow;
  readOnly: boolean;
  showCredentials: boolean;
  profileStatus?: PartyProfileStatus | null;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState(participant.title);
  const [description, setDescription] = useState(participant.description);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(participant.title);
    setDescription(participant.description);
  }, [participant]);

  const isDirty = title !== participant.title || description !== participant.description;

  const onSave = (formData: FormData) => {
    startTransition(async () => {
      await updateParticipantMeta(formData);
      router.refresh();
    });
  };

  return (
    <section className="glass-panel rounded-xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={
            participant.role === "party_a"
              ? "flex h-10 w-10 items-center justify-center rounded-md bg-party-a-fill text-party-a"
              : participant.role === "party_b"
                ? "flex h-10 w-10 items-center justify-center rounded-md bg-party-b-fill text-party-b"
                : "flex h-10 w-10 items-center justify-center rounded-md bg-law-fill text-law"
          }
        >
          <span
            className={
              participant.role === "party_a"
                ? "material-symbols-outlined text-primary"
                : "material-symbols-outlined text-tertiary"
            }
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {roleIcon(participant.role)}
          </span>
        </div>
        <p className="font-display text-headline-md text-on-surface">
          {admin.roles[participant.role] ?? participant.role}
        </p>
      </div>

      <form action={onSave} className="mb-5 space-y-3">
        <input name="userId" type="hidden" value={participant.id} />
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.titleLabel}</label>
          {readOnly ? (
            <p className="text-body-md text-on-surface">{participant.title}</p>
          ) : (
            <input
              className={inputClass}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.descriptionLabel}</label>
          {readOnly ? (
            <p className="text-body-sm text-on-surface-variant">{participant.description}</p>
          ) : (
            <textarea
              className={inputClass}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={2}
              value={description}
            />
          )}
        </div>
        {!readOnly ? (
          <button
            className="btn-secondary flex items-center gap-1.5 px-4 py-1.5 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || !isDirty}
            type="submit"
          >
            {pending ? <Spinner size="sm" /> : admin.saveChanges}
          </button>
        ) : null}
      </form>

      {profileStatus && (participant.role === "party_a" || participant.role === "party_b") ? (
        <div className="mb-4 space-y-2 rounded-md border border-hair bg-paper/60 p-3 text-body-sm">
          <p className="font-semibold text-on-surface">
            {profileStatus.ready
              ? `${admin.profileReadyLabel}${
                  profileStatus.profileReadyAt
                    ? `, ${formatDateTime(new Date(profileStatus.profileReadyAt), locale)}`
                    : ""
                }`
              : admin.profileNotReadyLabel}
          </p>
          {profileStatus.testsCompletedAt ? (
            <p className="text-on-surface-variant">
              {admin.profileTestsDateLabel}:{" "}
              {formatDateTime(new Date(profileStatus.testsCompletedAt), locale)}
            </p>
          ) : null}
          {profileStatus.refreshRequested ? (
            <p className="text-warning">{admin.profileRefreshPending}</p>
          ) : null}
          <button
            className="btn-secondary px-3 py-1.5 text-body-sm disabled:opacity-60"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(admin.profileRefreshConfirm)) return;
              startTransition(async () => {
                try {
                  await requestProfileRefresh(participant.id);
                  router.refresh();
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : admin.profileRefreshError);
                }
              });
            }}
            type="button"
          >
            {admin.requestProfileRefresh}
          </button>
        </div>
      ) : null}

      {showCredentials ? (
        <>
          <div className="space-y-4">
            <CredentialField label={admin.loginLabel} value={participant.login} />
            <CredentialField label={admin.passwordLabel} value={participant.password} />
          </div>
          <CredentialActions
            login={participant.login}
            password={participant.password}
            role={participant.role}
            userId={participant.id}
          />
        </>
      ) : null}
    </section>
  );
}

export function RoomDetailContent({
  room,
  participants,
  activityLog = [],
  mediationDetails = null,
  profileStatusByUserId = {},
  basePath = "/admin/rooms",
  readOnly = false,
  allowDelete,
  showCredentials,
}: {
  room: RoomDetailRow;
  participants: RoomUserRow[];
  activityLog?: RoomActivityEntry[];
  mediationDetails?: AdminMediationDetails | null;
  profileStatusByUserId?: Record<string, PartyProfileStatus>;
  basePath?: string;
  readOnly?: boolean;
  /** Defaults to !readOnly. Mediators can delete owned rooms while keeping detail read-only. */
  allowDelete?: boolean;
  showCredentials?: boolean;
}) {
  const credentialsVisible = showCredentials ?? !readOnly;
  const canDelete = allowDelete ?? !readOnly;
  const { admin, locale } = useLocale();
  const router = useRouter();
  const jurisdictionDisplay = formatRoomJurisdiction(room, locale);
  const [confirmDeleteMode, setConfirmDeleteMode] = useState<"room" | "parties" | null>(null);
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description);
  const [roomPending, startRoomTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [mediationDetailsOpen, setMediationDetailsOpen] = useState(false);

  useEffect(() => {
    setTitle(room.title);
    setDescription(room.description);
  }, [room]);

  const isRoomDirty = title !== room.title || description !== room.description;

  const partyA = participants.find((p) => p.role === "party_a");
  const partyB = participants.find((p) => p.role === "party_b");
  const mediator = participants.find((p) => p.role === "mediator");
  const orderedParticipants = [partyA, partyB, mediator].filter(Boolean) as RoomUserRow[];

  const onSaveRoom = (formData: FormData) => {
    startRoomTransition(async () => {
      await updateRoomMeta(formData);
      router.refresh();
    });
  };

  const onDeleteRoomOnly = () => {
    const formData = new FormData();
    formData.set("roomId", room.id);
    startDeleteTransition(async () => {
      try {
        await deleteRoom(formData);
      } catch (error) {
        setConfirmDeleteMode(null);
        toast.error(error instanceof Error ? error.message : admin.deleteRoom);
      }
    });
  };

  const onDeleteRoomWithParties = () => {
    const formData = new FormData();
    formData.set("roomId", room.id);
    startDeleteTransition(async () => {
      try {
        await deleteRoomWithParties(formData);
      } catch (error) {
        setConfirmDeleteMode(null);
        toast.error(error instanceof Error ? error.message : admin.deleteRoom);
      }
    });
  };

  const formattedActivityLog = activityLog.map((entry) =>
    formatRoomActivityEntry(admin, entry),
  );

  return (
    <section className="space-y-stack-lg">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary transition-colors hover:text-on-surface"
        href={basePath}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToRooms}
      </Link>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="font-display text-headline-lg text-on-surface">{room.title}</h3>
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {formatDateTime(room.createdAt, locale)}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              {admin.jurisdictionLabel}: {jurisdictionDisplay}
            </span>
          </p>
        </div>
        {mediationDetails ? (
          <button
            className="btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-body-sm font-semibold shadow-md ring-2 ring-law/20 transition-shadow hover:shadow-lg"
            onClick={() => setMediationDetailsOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
            {admin.mediationDetailsButton}
          </button>
        ) : null}
      </div>

      {mediationDetails ? (
        <RoomMediationDetailsModal
          details={mediationDetails}
          onClose={() => setMediationDetailsOpen(false)}
          open={mediationDetailsOpen}
          roomId={room.id}
        />
      ) : null}

      <SessionSchedulingSection
        initialDurationMinutes={room.mediationDurationMinutes}
        initialScheduledStartAt={toIsoOrNull(room.scheduledStartAt)}
        mediationCompletedAt={toIsoOrNull(room.mediationCompletedAt)}
        mediationStarted={!!room.mediationStartedAt}
        partyUserIds={[partyA?.id, partyB?.id].filter((id): id is string => Boolean(id))}
        readOnly={readOnly && basePath.startsWith("/admin")}
        roomId={room.id}
        sessionComplete={!!room.mediationCompletedAt || room.mediationPhase === "completed"}
        showScheduleControls={!!room.createdByUserId}
      />

      <div className="glass-panel space-y-3 rounded-xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-display text-headline-md text-on-surface">{admin.pipelineLogTitle}</h4>
          {formattedActivityLog.length > 0 ? (
            <span className="text-body-sm text-on-surface-variant">
              {formattedActivityLog.length}
            </span>
          ) : null}
        </div>
        {formattedActivityLog.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">{admin.activityLogEmpty}</p>
        ) : (
          <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
            {formattedActivityLog.map((entry) => (
              <li className="border-b border-hair pb-3 last:border-b-0" key={entry.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-body-sm font-semibold text-on-surface">{entry.title}</p>
                    {entry.subtitle ? (
                      <p className="text-body-sm text-on-surface-variant">{entry.subtitle}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-body-sm text-on-surface-variant">
                      {formatDateTime(entry.occurredAt, locale)}
                    </p>
                    <p className="text-body-sm text-on-surface-variant/80">{entry.sourceLabel}</p>
                  </div>
                </div>
                {entry.detailLines.length > 0 ? (
                  <div className="mt-2 space-y-1 rounded-md bg-surface-container-low/60 p-3 text-body-sm text-on-surface-variant">
                    {entry.detailLines.map((line, index) => (
                      <p className="whitespace-pre-wrap break-words" key={`${entry.id}-${index}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {readOnly ? (
        <div className="glass-panel space-y-4 rounded-xl p-6">
          <h4 className="font-display text-headline-md text-on-surface">{admin.roomDetails}</h4>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.roomTitleLabel}</p>
            <p className="text-body-md text-on-surface">{room.title}</p>
          </div>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.roomDescriptionLabel}</p>
            <p className="text-body-sm text-on-surface-variant">{room.description}</p>
          </div>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</p>
            <p className="text-body-md text-on-surface">{jurisdictionDisplay}</p>
          </div>
        </div>
      ) : (
        <form
          action={onSaveRoom}
          className="glass-panel space-y-4 rounded-xl p-6"
        >
          <input name="roomId" type="hidden" value={room.id} />
          <h4 className="font-display text-headline-md text-on-surface">{admin.roomDetails}</h4>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomTitleLabel}</label>
            <input
              className={inputClass}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomDescriptionLabel}</label>
            <textarea
              className={inputClass}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={3}
              value={description}
            />
          </div>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</p>
            <p className="text-body-md text-on-surface">{jurisdictionDisplay}</p>
          </div>
          <button
            className="btn-primary flex items-center gap-1.5 px-5 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={roomPending || !isRoomDirty}
            type="submit"
          >
            {roomPending ? <Spinner size="sm" className="text-white" /> : admin.saveChanges}
          </button>
        </form>
      )}

      <div>
        <h4 className="mb-4 font-display text-headline-md text-on-surface">{admin.participants}</h4>
        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          {orderedParticipants.map((participant) => (
            <ParticipantSection
              key={participant.id}
              participant={participant}
              profileStatus={profileStatusByUserId[participant.id] ?? null}
              readOnly={readOnly}
              showCredentials={credentialsVisible}
            />
          ))}
        </div>
      </div>

      {canDelete ? (
        <div className="glass-panel space-y-4 rounded-xl border border-error/20 p-6">
          <h4 className="font-display text-headline-sm text-error">{admin.deleteRoom}</h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-error/40 px-4 py-2.5 text-body-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-60"
              disabled={deletePending}
              onClick={() => setConfirmDeleteMode("room")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              {admin.deleteRoomOnly}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-error/40 px-4 py-2.5 text-body-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-60"
              disabled={deletePending}
              onClick={() => setConfirmDeleteMode("parties")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">group_off</span>
              {admin.deleteRoomWithParties}
            </button>
          </div>
        </div>
      ) : null}

      <ModalOverlay
        onClose={() => {
          if (!deletePending) setConfirmDeleteMode(null);
        }}
        open={confirmDeleteMode !== null}
        panelClassName="max-w-md"
      >
        {confirmDeleteMode ? (
          <div
            aria-labelledby="room-delete-title"
            aria-modal="true"
            className="space-y-5 rounded-xl border border-error/30 bg-surface-container p-6 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="font-display text-headline-md text-error"
                  id="room-delete-title"
                >
                  {confirmDeleteMode === "room"
                    ? admin.deleteRoomOnly
                    : admin.deleteRoomWithParties}
                </h2>
                <p className="mt-2 text-body-sm text-on-surface">
                  {confirmDeleteMode === "room"
                    ? admin.deleteRoomOnlyConfirm
                    : admin.deleteRoomWithPartiesConfirm}
                </p>
              </div>
              <button
                className="grid h-8 w-8 place-items-center rounded-full border border-hair text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                disabled={deletePending}
                onClick={() => setConfirmDeleteMode(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high"
                disabled={deletePending}
                onClick={() => setConfirmDeleteMode(null)}
                type="button"
              >
                {admin.cancel}
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 font-semibold text-white disabled:opacity-60"
                disabled={deletePending}
                onClick={
                  confirmDeleteMode === "room" ? onDeleteRoomOnly : onDeleteRoomWithParties
                }
                type="button"
              >
                {deletePending ? <Spinner size="sm" className="text-white" /> : null}
                {confirmDeleteMode === "room"
                  ? admin.deleteRoomOnly
                  : admin.deleteRoomWithParties}
              </button>
            </div>
          </div>
        ) : null}
      </ModalOverlay>
    </section>
  );
}
