"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import type {
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import ukLocale from "@fullcalendar/core/locales/uk";
import { toast } from "sonner";
import { saveMediatorSchedule } from "@/app/mediator/rooms/actions";
import { ScheduleFields } from "@/components/mediator/schedule-fields";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { formatDateTime } from "@/lib/format-datetime";
import {
  normalizeDuration,
  partsToIso,
  toScheduleParts,
} from "@/lib/mediator-session/schedule-form";
import {
  snapDateToScheduleSlot,
  snapToScheduleDuration,
  type ScheduleDurationOption,
  type ScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";
import { cn } from "@/lib/utils";
import "./mediator-calendar.css";

export type CalendarSession = {
  id: string;
  title: string;
  scheduledStartAt: string;
  mediationDurationMinutes: number;
  mediationStartedAt: string | null;
};

export type UnscheduledRoom = {
  id: string;
  title: string;
};

type MediatorCalendarContentProps = {
  sessions: CalendarSession[];
  unscheduledRooms: UnscheduledRoom[];
};

function sessionEndIso(startIso: string, durationMinutes: number) {
  return new Date(new Date(startIso).getTime() + durationMinutes * 60_000).toISOString();
}

export function MediatorCalendarContent({
  sessions: initialSessions,
  unscheduledRooms,
}: MediatorCalendarContentProps) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [pending, startTransition] = useTransition();
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [visibleRangeLabel, setVisibleRangeLabel] = useState("");

  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState<ScheduleMinuteOption>(0);
  const [durationMinutes, setDurationMinutes] = useState<ScheduleDurationOption>(
    normalizeDuration(60),
  );

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  useEffect(() => {
    if (!selectedSession) return;
    const parts = toScheduleParts(selectedSession.scheduledStartAt);
    if (!parts) return;
    setDate(parts.date);
    setHour(parts.hour);
    setMinute(parts.minute);
    setDurationMinutes(normalizeDuration(selectedSession.mediationDurationMinutes));
  }, [selectedSession]);

  const events = useMemo<EventInput[]>(
    () =>
      sessions.map((session) => ({
        id: session.id,
        title: session.title,
        start: session.scheduledStartAt,
        end: sessionEndIso(session.scheduledStartAt, session.mediationDurationMinutes),
        editable: !session.mediationStartedAt,
        startEditable: !session.mediationStartedAt,
        durationEditable: !session.mediationStartedAt,
        classNames: [
          session.mediationStartedAt ? "mediator-cal-event-started" : "",
          selectedSessionId === session.id ? "mediator-cal-event-selected" : "",
        ].filter(Boolean),
        extendedProps: {
          mediationDurationMinutes: session.mediationDurationMinutes,
          mediationStartedAt: session.mediationStartedAt,
        },
      })),
    [sessions, selectedSessionId],
  );

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return [...sessions]
      .sort(
        (a, b) =>
          new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime(),
      )
      .filter((session) => {
        const end =
          new Date(session.scheduledStartAt).getTime() +
          session.mediationDurationMinutes * 60_000;
        return end >= now - 24 * 60 * 60_000;
      })
      .slice(0, 12);
  }, [sessions]);

  const scheduleIso = useMemo(() => partsToIso({ date, hour, minute }), [date, hour, minute]);
  const canEdit = !!selectedSession && !selectedSession.mediationStartedAt;

  const persistSchedule = useCallback(
    (roomId: string, nextStartIso: string, nextDuration: ScheduleDurationOption) => {
      startTransition(async () => {
        try {
          await saveMediatorSchedule(roomId, nextStartIso, nextDuration);
          setSessions((prev) =>
            prev.map((session) =>
              session.id === roomId
                ? {
                    ...session,
                    scheduledStartAt: nextStartIso,
                    mediationDurationMinutes: nextDuration,
                  }
                : session,
            ),
          );
          toast.success(admin.scheduleSaved);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : admin.scheduleError);
          router.refresh();
        }
      });
    },
    [admin.scheduleError, admin.scheduleSaved, router],
  );

  const selectSession = (session: CalendarSession) => {
    setSelectedSessionId(session.id);
    const api = calendarRef.current?.getApi();
    api?.gotoDate(session.scheduledStartAt);
  };

  const onEventClick = (arg: EventClickArg) => {
    const session = sessions.find((item) => item.id === arg.event.id);
    if (session) selectSession(session);
  };

  const onDateClick = (arg: DateClickArg) => {
    if (!canEdit || !selectedSession) return;
    if (arg.view.type === "dayGridMonth") {
      const parts = toScheduleParts(selectedSession.scheduledStartAt);
      if (!parts) return;
      const next = new Date(arg.date);
      next.setHours(Number(parts.hour), parts.minute, 0, 0);
      const snapped = snapDateToScheduleSlot(next);
      const nextParts = toScheduleParts(snapped.toISOString());
      if (!nextParts) return;
      setDate(nextParts.date);
      setHour(nextParts.hour);
      setMinute(nextParts.minute);
      return;
    }
    const snapped = snapDateToScheduleSlot(arg.date);
    const nextParts = toScheduleParts(snapped.toISOString());
    if (!nextParts) return;
    setDate(nextParts.date);
    setHour(nextParts.hour);
    setMinute(nextParts.minute);
  };

  const onEventDrop = (arg: EventDropArg) => {
    const session = sessions.find((item) => item.id === arg.event.id);
    if (!session || session.mediationStartedAt || !arg.event.start) {
      arg.revert();
      return;
    }
    const snappedStart = snapDateToScheduleSlot(arg.event.start);
    const duration = normalizeDuration(session.mediationDurationMinutes);
    const nextEnd = new Date(snappedStart.getTime() + duration * 60_000);
    arg.event.setStart(snappedStart);
    arg.event.setEnd(nextEnd);
    setSelectedSessionId(session.id);
    const parts = toScheduleParts(snappedStart.toISOString());
    if (parts) {
      setDate(parts.date);
      setHour(parts.hour);
      setMinute(parts.minute);
      setDurationMinutes(duration);
    }
    persistSchedule(session.id, snappedStart.toISOString(), duration);
  };

  const onEventResize = (arg: EventResizeDoneArg) => {
    const session = sessions.find((item) => item.id === arg.event.id);
    if (!session || session.mediationStartedAt || !arg.event.start || !arg.event.end) {
      arg.revert();
      return;
    }
    const snappedStart = snapDateToScheduleSlot(arg.event.start);
    const rawMinutes = Math.round(
      (arg.event.end.getTime() - arg.event.start.getTime()) / 60_000,
    );
    const duration = snapToScheduleDuration(rawMinutes);
    const nextEnd = new Date(snappedStart.getTime() + duration * 60_000);
    arg.event.setStart(snappedStart);
    arg.event.setEnd(nextEnd);
    setSelectedSessionId(session.id);
    const parts = toScheduleParts(snappedStart.toISOString());
    if (parts) {
      setDate(parts.date);
      setHour(parts.hour);
      setMinute(parts.minute);
      setDurationMinutes(duration);
    }
    persistSchedule(session.id, snappedStart.toISOString(), duration);
  };

  const onSave = () => {
    if (!selectedSession || !scheduleIso || !canEdit) return;
    persistSchedule(selectedSession.id, scheduleIso, durationMinutes);
  };

  const onDatesSet = (arg: DatesSetArg) => {
    setVisibleRangeLabel(arg.view.title);
  };

  return (
    <section className="space-y-stack-lg">
      <div>
        <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.calendarTitle}</h3>
        <p className="max-w-xl text-on-surface-variant">{admin.calendarSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-stack-md xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="mediator-calendar glass-panel space-y-3 rounded-xl p-4 sm:p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridDay,timeGridWeek,dayGridMonth",
            }}
            buttonText={{
              today: admin.calendarToday,
              month: admin.calendarViewMonth,
              week: admin.calendarViewWeek,
              day: admin.calendarViewDay,
            }}
            locale={locale === "uk" ? ukLocale : undefined}
            firstDay={locale === "uk" ? 1 : 0}
            height={720}
            nowIndicator
            editable
            eventStartEditable
            eventDurationEditable
            eventResizableFromStart={false}
            dragScroll
            snapDuration="00:05:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            scrollTime="08:00:00"
            allDaySlot={false}
            events={events}
            eventClick={onEventClick}
            dateClick={onDateClick}
            eventDrop={onEventDrop}
            eventResize={onEventResize}
            datesSet={onDatesSet}
            dayMaxEvents={3}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
          />
          <p className="text-body-sm text-on-surface-variant">
            {canEdit ? admin.calendarDragHint : admin.calendarSelectSessionHint}
          </p>
        </div>

        <div className="space-y-4">
          <div className="glass-panel space-y-4 rounded-xl p-6">
            <h4 className="font-display text-headline-md text-on-surface">
              {selectedSession ? admin.calendarEditSession : admin.calendarSelectSession}
            </h4>

            {selectedSession ? (
              <>
                <div>
                  <p className="font-display text-body-md font-semibold text-on-surface">
                    {selectedSession.title}
                  </p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {formatDateTime(selectedSession.scheduledStartAt, locale)} ·{" "}
                    {admin.scheduleDurationOption(selectedSession.mediationDurationMinutes)}
                  </p>
                </div>

                {canEdit ? (
                  <>
                    <ScheduleFields
                      date={date}
                      disabled={pending}
                      durationMinutes={durationMinutes}
                      hour={hour}
                      idPrefix="calendar-edit"
                      minute={minute}
                      onDateChange={setDate}
                      onDurationChange={setDurationMinutes}
                      onHourChange={setHour}
                      onMinuteChange={setMinute}
                    />
                    <button
                      className="btn-primary flex items-center gap-1.5 px-5 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!scheduleIso || pending}
                      onClick={onSave}
                      type="button"
                    >
                      {pending ? <Spinner className="text-white" size="sm" /> : admin.scheduleSave}
                    </button>
                  </>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">
                    {admin.calendarSessionStartedHint}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center gap-1 text-body-sm font-semibold text-tertiary hover:underline"
                    href={`/mediator/rooms/${selectedSession.id}`}
                  >
                    {admin.calendarOpenRoom}
                  </Link>
                  {!selectedSession.mediationStartedAt ? (
                    <Link
                      className="inline-flex items-center gap-1 text-body-sm font-semibold text-tertiary hover:underline"
                      href={`/mediator/rooms/${selectedSession.id}/lobby`}
                    >
                      {admin.scheduleOpenLobby}
                    </Link>
                  ) : (
                    <Link
                      className="inline-flex items-center gap-1 text-body-sm font-semibold text-tertiary hover:underline"
                      href={`/mediator/rooms/${selectedSession.id}/session`}
                    >
                      {admin.scheduleOpenSession}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p className="text-body-sm text-on-surface-variant">{admin.calendarSelectSessionHint}</p>
            )}
          </div>

          <div className="glass-panel space-y-3 rounded-xl p-6">
            <h4 className="font-display text-headline-md text-on-surface">
              {admin.calendarUpcomingTitle}
            </h4>
            {visibleRangeLabel ? (
              <p className="text-body-sm text-on-surface-variant">{visibleRangeLabel}</p>
            ) : null}
            {upcomingSessions.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">{admin.calendarNoSessions}</p>
            ) : (
              <ul className="space-y-2">
                {upcomingSessions.map((session) => (
                  <li key={session.id}>
                    <button
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left transition-colors",
                        selectedSessionId === session.id
                          ? "border-law bg-law-fill/50"
                          : "border-hair hover:border-law/40 hover:bg-paper",
                      )}
                      onClick={() => selectSession(session)}
                      type="button"
                    >
                      <p className="font-display text-body-sm font-semibold text-on-surface">
                        {session.title}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {formatDateTime(session.scheduledStartAt, locale)} ·{" "}
                        {admin.scheduleDurationOption(session.mediationDurationMinutes)}
                        {session.mediationStartedAt ? ` · ${admin.calendarStartedBadge}` : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {unscheduledRooms.length > 0 ? (
            <div className="glass-panel space-y-3 rounded-xl p-6">
              <h4 className="font-display text-headline-md text-on-surface">
                {admin.calendarUnscheduledTitle}
              </h4>
              <ul className="space-y-2">
                {unscheduledRooms.map((room) => (
                  <li key={room.id}>
                    <Link
                      className="flex items-center justify-between gap-2 rounded-md border border-hair px-3 py-2 text-body-sm text-on-surface hover:border-law/40 hover:bg-paper"
                      href={`/mediator/rooms/${room.id}`}
                    >
                      <span className="truncate font-semibold">{room.title}</span>
                      <span className="shrink-0 text-tertiary">{admin.calendarScheduleAction}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
