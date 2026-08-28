import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import { isUuid } from "@/lib/utils";
import { RoomDetailContent } from "@/components/admin/room-detail-content";
import { getAdminMediationDetails } from "@/lib/mediation/admin-room-details";
import { getRoomActivityLog } from "@/lib/pipeline/room-activity-log";

export default async function MediatorRoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!isUuid(roomId)) notFound();
  const userId = await requireSessionUserId();

  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.createdByUserId, userId)))
    .limit(1);
  if (!room) notFound();

  const [participants, activityLog, mediationDetails] = await Promise.all([
    db.select().from(users).where(eq(users.roomId, roomId)),
    getRoomActivityLog(roomId),
    getAdminMediationDetails(roomId),
  ]);

  return (
    <RoomDetailContent
      activityLog={activityLog}
      allowDelete
      basePath="/mediator/rooms"
      mediationDetails={mediationDetails}
      participants={participants}
      readOnly
      showCredentials
      room={room}
    />
  );
}
