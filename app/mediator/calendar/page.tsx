import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import {
  MediatorCalendarContent,
  type CalendarSession,
  type UnscheduledRoom,
} from "@/components/mediator/mediator-calendar-content";

export default async function MediatorCalendarPage() {
  const userId = await requireSessionUserId();

  const roomRows = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      scheduledStartAt: rooms.scheduledStartAt,
      mediationDurationMinutes: rooms.mediationDurationMinutes,
      mediationStartedAt: rooms.mediationStartedAt,
      mediationPhase: rooms.mediationPhase,
    })
    .from(rooms)
    .where(eq(rooms.createdByUserId, userId))
    .orderBy(desc(rooms.createdAt));

  const sessions: CalendarSession[] = roomRows
    .filter((room) => !!room.scheduledStartAt)
    .map((room) => ({
      id: room.id,
      title: room.title,
      scheduledStartAt: room.scheduledStartAt!.toISOString(),
      mediationDurationMinutes: room.mediationDurationMinutes,
      mediationStartedAt: room.mediationStartedAt?.toISOString() ?? null,
      mediationPhase: room.mediationPhase ?? null,
    }));

  const unscheduledRooms: UnscheduledRoom[] = roomRows
    .filter((room) => !room.scheduledStartAt && !room.mediationStartedAt)
    .map((room) => ({ id: room.id, title: room.title }));

  return (
    <MediatorCalendarContent sessions={sessions} unscheduledRooms={unscheduledRooms} />
  );
}
