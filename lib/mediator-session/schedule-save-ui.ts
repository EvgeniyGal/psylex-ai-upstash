import type { AdminCopy } from "@/lib/admin-i18n";
import type { ScheduleSaveErrorCode } from "@/lib/mediator-session/scheduling";

export function messageForScheduleSaveError(
  code: ScheduleSaveErrorCode,
  admin: Pick<
    AdminCopy,
    "scheduleMustBeFuture" | "scheduleAlreadyStarted" | "scheduleError"
  >,
): string {
  switch (code) {
    case "past":
      return admin.scheduleMustBeFuture;
    case "already_started":
      return admin.scheduleAlreadyStarted;
    default:
      return admin.scheduleError;
  }
}

export function isScheduleIsoInPast(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) || ms <= now;
}
