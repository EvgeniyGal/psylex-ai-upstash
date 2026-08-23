"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/locale-provider";
import {
  SCHEDULE_DURATION_OPTIONS,
  SCHEDULE_MINUTE_STEP,
  pad2,
  type ScheduleDurationOption,
  type ScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";

const selectClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law disabled:cursor-not-allowed disabled:opacity-60";

type ScheduleFieldsProps = {
  date: string;
  hour: string;
  minute: ScheduleMinuteOption;
  durationMinutes: ScheduleDurationOption;
  disabled?: boolean;
  idPrefix?: string;
  onDateChange: (value: string) => void;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: ScheduleMinuteOption) => void;
  onDurationChange: (value: ScheduleDurationOption) => void;
};

export function ScheduleFields({
  date,
  hour,
  minute,
  durationMinutes,
  disabled = false,
  idPrefix = "schedule",
  onDateChange,
  onHourChange,
  onMinuteChange,
  onDurationChange,
}: ScheduleFieldsProps) {
  const { admin } = useLocale();
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const minuteOptions = useMemo(
    () => Array.from({ length: 60 / SCHEDULE_MINUTE_STEP }, (_, i) => i * SCHEDULE_MINUTE_STEP),
    [],
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor={`${idPrefix}-date`}>
            {admin.scheduleDateLabel}
          </label>
          <input
            className={selectClass}
            disabled={disabled}
            id={`${idPrefix}-date`}
            onChange={(event) => onDateChange(event.target.value)}
            type="date"
            value={date}
          />
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor={`${idPrefix}-hour`}>
            {admin.scheduleHourLabel}
          </label>
          <select
            className={selectClass}
            disabled={disabled}
            id={`${idPrefix}-hour`}
            onChange={(event) => onHourChange(event.target.value)}
            value={hour}
          >
            <option disabled value="">
              —
            </option>
            {hourOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor={`${idPrefix}-minute`}>
            {admin.scheduleMinutesLabel}
          </label>
          <select
            className={selectClass}
            disabled={disabled}
            id={`${idPrefix}-minute`}
            onChange={(event) => onMinuteChange(Number(event.target.value) as ScheduleMinuteOption)}
            value={minute}
          >
            {minuteOptions.map((value) => (
              <option key={value} value={value}>
                {pad2(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-xs">
        <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor={`${idPrefix}-duration`}>
          {admin.scheduleDurationLabel}
        </label>
        <select
          className={selectClass}
          disabled={disabled}
          id={`${idPrefix}-duration`}
          onChange={(event) =>
            onDurationChange(Number(event.target.value) as ScheduleDurationOption)
          }
          value={durationMinutes}
        >
          {SCHEDULE_DURATION_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {admin.scheduleDurationOption(value)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
