"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  fetchMediatorSchedulingReadiness,
  saveMediatorSchedule,
} from "@/app/mediator/rooms/actions";
import { ScheduleFields } from "@/components/mediator/schedule-fields";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { formatDateTime } from "@/lib/format-datetime";
import type { PartySchedulingDetail } from "@/lib/mediator-session/scheduling";
import {
  normalizeDuration,
  partsToIso,
  toScheduleParts,
} from "@/lib/mediator-session/schedule-form";
import {
  DEFAULT_SCHEDULE_DURATION_MINUTES,
  type ScheduleDurationOption,
  type ScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";
import {
  isScheduleIsoInPast,
  messageForScheduleSaveError,
} from "@/lib/mediator-session/schedule-save-ui";
import type { PostIntakePipelineDetail } from "@/lib/pipeline/gate";
import { TEST_KEYS } from "@/lib/test-keys";

type SessionSchedulingSectionProps = {
  roomId: string;
  readOnly?: boolean;
  /** When false, only the preparation checklist is shown (Mode A admin rooms). */
  showScheduleControls?: boolean;
  initialScheduledStartAt?: string | null;
  initialDurationMinutes?: number;
  mediationStarted?: boolean;
  sessionComplete?: boolean;
  mediationCompletedAt?: string | null;
  partyUserIds?: string[];
};

type ReadinessStatus = "ready" | "generating" | "not_ready";

function statusLabel(status: ReadinessStatus, admin: { scheduleReady: string; scheduleNotReady: string; scheduleGenerating: string }) {
  if (status === "ready") return admin.scheduleReady;
  if (status === "generating") return admin.scheduleGenerating;
  return admin.scheduleNotReady;
}

function statusClassName(status: ReadinessStatus) {
  if (status === "ready") return "font-semibold text-success";
  if (status === "generating") return "inline-flex items-center gap-1.5 font-semibold text-tertiary";
  return "font-semibold text-error";
}

function DetailRow({
  label,
  status,
}: {
  label: string;
  status: ReadinessStatus;
}) {
  const { admin } = useLocale();
  return (
    <div className="flex items-center justify-between gap-3 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={statusClassName(status)}>
        {status === "generating" ? <Spinner size="sm" className="text-tertiary" /> : null}
        {statusLabel(status, admin)}
      </span>
    </div>
  );
}

function readinessStatus(ready: boolean, generating: boolean): ReadinessStatus {
  if (ready) return "ready";
  if (generating) return "generating";
  return "not_ready";
}

function PartyDetailChecklist({
  detail,
  forceReady,
}: {
  detail: PartySchedulingDetail | null;
  forceReady: boolean;
}) {
  const { admin } = useLocale();
  if (!detail && !forceReady) return null;

  return (
    <ul className="mt-2 space-y-1 border-l border-outline-variant/30 pl-3">
      {TEST_KEYS.map((key) => (
        <li key={key}>
          <DetailRow
            label={admin.activityLogTests[key] ?? key}
            status={readinessStatus(forceReady || !!detail?.tests[key], false)}
          />
        </li>
      ))}
      <li>
        <DetailRow
          label={admin.scheduleDetailPersonalBot}
          status={readinessStatus(forceReady || !!detail?.personalBotReady, false)}
        />
      </li>
      <li>
        <DetailRow
          label={admin.scheduleDetailDisputeIntake}
          status={readinessStatus(forceReady || !!detail?.disputeIntakeComplete, false)}
        />
      </li>
    </ul>
  );
}

function PipelineDetailChecklist({
  detail,
  forceReady,
  pipelineRunning,
}: {
  detail: PostIntakePipelineDetail | null;
  forceReady: boolean;
  pipelineRunning: boolean;
}) {
  const { admin } = useLocale();
  if (!detail && !forceReady) return null;

  const items: { label: string; ready: boolean }[] = [
    {
      label: `${admin.scheduleDetailPsychodynamic} · ${admin.roles.party_a}`,
      ready: forceReady || !!detail?.partyAPsychodynamic,
    },
    {
      label: `${admin.scheduleDetailPsychodynamic} · ${admin.roles.party_b}`,
      ready: forceReady || !!detail?.partyBPsychodynamic,
    },
    {
      label: `${admin.scheduleDetailEmotionalTriggers} · ${admin.roles.party_a}`,
      ready: forceReady || !!detail?.partyAEmotionalTriggers,
    },
    {
      label: `${admin.scheduleDetailEmotionalTriggers} · ${admin.roles.party_b}`,
      ready: forceReady || !!detail?.partyBEmotionalTriggers,
    },
    {
      label: admin.scheduleDetailInterests,
      ready: forceReady || !!detail?.interestsAnalysis,
    },
    {
      label: admin.scheduleDetailLegal,
      ready: forceReady || !!detail?.legalAnalysis,
    },
  ];

  return (
    <ul className="mt-2 space-y-1 border-l border-outline-variant/30 pl-3">
      {items.map((item) => (
        <li key={item.label}>
          <DetailRow
            label={item.label}
            status={readinessStatus(item.ready, pipelineRunning && !item.ready)}
          />
        </li>
      ))}
    </ul>
  );
}

export function SessionSchedulingSection({
  roomId,
  readOnly = false,
  showScheduleControls = true,
  initialScheduledStartAt = null,
  initialDurationMinutes = DEFAULT_SCHEDULE_DURATION_MINUTES,
  mediationStarted = false,
  sessionComplete = false,
  mediationCompletedAt = null,
  partyUserIds = [],
}: SessionSchedulingSectionProps) {
  const { admin, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const initialParts = useMemo(() => toScheduleParts(initialScheduledStartAt), [initialScheduledStartAt]);
  const [date, setDate] = useState(initialParts?.date ?? "");
  const [hour, setHour] = useState(initialParts?.hour ?? "");
  const [minute, setMinute] = useState<ScheduleMinuteOption>(initialParts?.minute ?? 0);
  const [durationMinutes, setDurationMinutes] = useState<ScheduleDurationOption>(
    normalizeDuration(initialDurationMinutes),
  );
  const [scheduledStartAt, setScheduledStartAt] = useState(initialScheduledStartAt);
  const [partyAReady, setPartyAReady] = useState(false);
  const [partyBReady, setPartyBReady] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [canSchedule, setCanSchedule] = useState(false);
  const [started, setStarted] = useState(mediationStarted);
  const [complete, setComplete] = useState(sessionComplete);
  const [completedAt, setCompletedAt] = useState(mediationCompletedAt);
  const [partyADetail, setPartyADetail] = useState<PartySchedulingDetail | null>(null);
  const [partyBDetail, setPartyBDetail] = useState<PartySchedulingDetail | null>(null);
  const [pipelineDetail, setPipelineDetail] = useState<PostIntakePipelineDetail | null>(null);

  const scheduleIso = useMemo(
    () => partsToIso({ date, hour, minute }),
    [date, hour, minute],
  );

  const refreshReadiness = useCallback(() => {
    void fetchMediatorSchedulingReadiness(roomId)
      .then((data) => {
        if (!data) return;
        setPartyAReady(data.partyAReady);
        setPartyBReady(data.partyBReady);
        setPipelineComplete(data.pipelineComplete);
        setPipelineRunning(data.pipelineRunning);
        setCanSchedule(data.canSchedule);
        setScheduledStartAt(data.scheduledStartAt);
        setDurationMinutes(normalizeDuration(data.mediationDurationMinutes));
        if (data.scheduledStartAt) {
          const parts = toScheduleParts(data.scheduledStartAt);
          if (parts) {
            setDate(parts.date);
            setHour(parts.hour);
            setMinute(parts.minute);
          }
        }
        setStarted(data.mediationStarted);
        setComplete(data.sessionComplete);
        setCompletedAt(data.mediationCompletedAt);
        setPartyADetail(data.partyADetail);
        setPartyBDetail(data.partyBDetail);
        setPipelineDetail(data.pipelineDetail);
      })
      .catch(() => {
        /* ignore */
      });
  }, [roomId]);

  useEffect(() => {
    refreshReadiness();
  }, [refreshReadiness]);

  // Always poll: pipeline/test updates can finish while SSE is quiet or "connected"
  // without delivering room.change — mediator otherwise never sees Ready.
  useRoomRealtime(roomId, () => {
    refreshReadiness();
  }, {
    enabled: true,
    pollIntervalMs: pipelineRunning ? 2_500 : 8_000,
    partyUserIds,
  });

  const onSave = () => {
    if (!scheduleIso) return;
    if (isScheduleIsoInPast(scheduleIso)) {
      toast.error(admin.scheduleMustBeFuture);
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveMediatorSchedule(roomId, scheduleIso, durationMinutes);
        if (!result.ok) {
          toast.error(messageForScheduleSaveError(result.code, admin));
          return;
        }
        setScheduledStartAt(scheduleIso);
        toast.success(admin.scheduleSaved, { id: "schedule-saved", duration: 3500 });
      } catch {
        toast.error(admin.scheduleError);
      }
    });
  };

  const summaryRow = (label: string, status: ReadinessStatus) => (
    <div className="flex items-center justify-between gap-3 text-body-sm font-semibold">
      <span className="text-on-surface">{label}</span>
      <span className={statusClassName(status)}>
        {status === "generating" ? <Spinner size="sm" className="text-tertiary" /> : null}
        {statusLabel(status, admin)}
      </span>
    </div>
  );

  return (
    <div className="glass-panel space-y-4 rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-display text-headline-md text-on-surface">
          {showScheduleControls ? admin.scheduleSectionTitle : admin.preparationSectionTitle}
        </h4>
        {showScheduleControls && complete ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-tertiary/15 px-2.5 py-1 text-label-md font-semibold text-tertiary">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {admin.scheduleSessionComplete}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 rounded-md bg-surface-container-low/60 p-3">
        <div>
          {summaryRow(
            admin.scheduleReadinessPartyA,
            readinessStatus(complete || partyAReady, false),
          )}
          <PartyDetailChecklist detail={partyADetail} forceReady={complete} />
        </div>
        <div>
          {summaryRow(
            admin.scheduleReadinessPartyB,
            readinessStatus(complete || partyBReady, false),
          )}
          <PartyDetailChecklist detail={partyBDetail} forceReady={complete} />
        </div>
        <div>
          {summaryRow(
            admin.scheduleReadinessPipeline,
            readinessStatus(
              complete || pipelineComplete,
              !complete && !pipelineComplete && pipelineRunning,
            ),
          )}
          <PipelineDetailChecklist
            detail={pipelineDetail}
            forceReady={complete}
            pipelineRunning={!complete && pipelineRunning}
          />
        </div>
      </div>

      {showScheduleControls ? (
        <>
          {readOnly || started ? (
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-body-sm text-on-surface-variant">{admin.scheduleDateTimeLabel}</p>
                <p className="text-body-md text-on-surface">
                  {scheduledStartAt ? formatDateTime(new Date(scheduledStartAt), locale) : admin.scheduleNotSet}
                </p>
              </div>
              <div>
                <p className="mb-1 text-body-sm text-on-surface-variant">{admin.scheduleDurationLabel}</p>
                <p className="text-body-md text-on-surface">
                  {admin.scheduleDurationOption(durationMinutes)}
                </p>
              </div>
              {complete && completedAt ? (
                <div>
                  <p className="mb-1 text-body-sm text-on-surface-variant">{admin.mediationCompletedAt}</p>
                  <p className="text-body-md text-on-surface">
                    {formatDateTime(new Date(completedAt), locale)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {!(partyAReady && partyBReady && pipelineComplete) ? (
                <p className="text-body-sm text-on-surface-variant">{admin.scheduleStartRequiresReadyHint}</p>
              ) : null}

              <ScheduleFields
                date={date}
                disabled={!canSchedule || pending}
                durationMinutes={durationMinutes}
                hour={hour}
                idPrefix={`room-${roomId}`}
                minute={minute}
                onDateChange={setDate}
                onDurationChange={setDurationMinutes}
                onHourChange={setHour}
                onMinuteChange={setMinute}
              />

              <button
                className="btn-primary flex items-center gap-1.5 px-5 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canSchedule || !scheduleIso || pending}
                onClick={onSave}
                type="button"
              >
                {pending ? <Spinner className="text-white" size="sm" /> : admin.scheduleSave}
              </button>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            {!readOnly && scheduledStartAt && !started ? (
              partyAReady && partyBReady && pipelineComplete ? (
                <Link
                  className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-semibold"
                  href={`/mediator/rooms/${roomId}/lobby`}
                >
                  <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                  {admin.scheduleOpenLobby}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="btn-secondary inline-flex cursor-not-allowed items-center gap-2 px-5 py-2.5 text-body-sm font-semibold opacity-40"
                  title={admin.scheduleDisabledHint}
                >
                  <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                  {admin.scheduleOpenLobby}
                </span>
              )
            ) : null}
            {!readOnly && started && !complete ? (
              <Link
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-semibold shadow-sm"
                href={`/mediator/rooms/${roomId}/session`}
              >
                <span className="material-symbols-outlined text-[20px]">videocam</span>
                {admin.scheduleOpenSession}
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
