import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { RoomDetailContent } from "@/components/admin/room-detail-content";
import { getAdminMediationDetails } from "@/lib/mediation/admin-room-details";
import { getRoomActivityLog } from "@/lib/pipeline/room-activity-log";
import { isUuid } from "@/lib/utils";

export default async function AdminRoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!isUuid(roomId)) notFound();

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) notFound();

  const [participants, activityLog, mediationDetails] = await Promise.all([
    db.select().from(users).where(eq(users.roomId, roomId)),
    getRoomActivityLog(roomId),
    getAdminMediationDetails(roomId),
  ]);

  return (
    <RoomDetailContent
      activityLog={activityLog}
      mediationDetails={mediationDetails}
      participants={participants}
      room={room}
    />
  );
}
