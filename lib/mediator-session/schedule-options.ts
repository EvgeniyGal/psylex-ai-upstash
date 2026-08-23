/** Minute step for mediator session start time. */
export const SCHEDULE_MINUTE_STEP = 5;

/** Allowed minute values for mediator session start time. */
export const SCHEDULE_MINUTE_OPTIONS = Array.from(
  { length: 60 / SCHEDULE_MINUTE_STEP },
  (_, i) => i * SCHEDULE_MINUTE_STEP,
) as unknown as readonly [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/** Allowed session durations in minutes (default 60). */
export const SCHEDULE_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240] as const;

export const DEFAULT_SCHEDULE_DURATION_MINUTES = 60;

export type ScheduleMinuteOption = (typeof SCHEDULE_MINUTE_OPTIONS)[number];
export type ScheduleDurationOption = (typeof SCHEDULE_DURATION_OPTIONS)[number];

export function isScheduleMinuteOption(value: number): value is ScheduleMinuteOption {
  return (SCHEDULE_MINUTE_OPTIONS as readonly number[]).includes(value);
}

export function isScheduleDurationOption(value: number): value is ScheduleDurationOption {
  return (SCHEDULE_DURATION_OPTIONS as readonly number[]).includes(value);
}

/** Snap an arbitrary minute to the nearest allowed 5-minute slot. */
export function snapToScheduleMinute(minute: number): ScheduleMinuteOption {
  let best: ScheduleMinuteOption = 0;
  let bestDist = Infinity;
  for (const option of SCHEDULE_MINUTE_OPTIONS) {
    const dist = Math.abs(option - minute);
    if (dist < bestDist) {
      best = option;
      bestDist = dist;
    }
  }
  return best;
}

/** Snap a Date's local minutes to a 5-minute slot (keeps same hour unless needed). */
export function snapDateToScheduleSlot(date: Date): Date {
  const next = new Date(date);
  next.setSeconds(0, 0);
  next.setMinutes(snapToScheduleMinute(next.getMinutes()));
  return next;
}

/** Snap minutes to the nearest allowed session duration. */
export function snapToScheduleDuration(minutes: number): ScheduleDurationOption {
  let best: ScheduleDurationOption = DEFAULT_SCHEDULE_DURATION_MINUTES;
  let bestDist = Infinity;
  for (const option of SCHEDULE_DURATION_OPTIONS) {
    const dist = Math.abs(option - minutes);
    if (dist < bestDist) {
      best = option;
      bestDist = dist;
    }
  }
  return best;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
