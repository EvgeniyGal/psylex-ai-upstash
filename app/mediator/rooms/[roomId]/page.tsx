import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import type { Locale } from "@/lib/i18n";
import { isUuid } from "@/lib/utils";
import { RoomDetailContent } from "@/components/admin/room-detail-content";
import { getAdminMediationDetails } from "@/lib/mediation/admin-room-details";
import { getRoomActivityLog } from "@/lib/pipeline/room-activity-log";
import { getRoomSides } from "@/lib/room/helpers";
import { getPartyProfileStatus } from "@/lib/room/party-profile-status";

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

  const [mediatorUser] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const uiLocale: Locale =
    mediatorUser?.preferredLocale === "uk" || mediatorUser?.preferredLocale === "en"
      ? mediatorUser.preferredLocale
      : "en";

  const sides = await getRoomSides(roomId);
  const [activityLog, mediationDetails, profileStatuses] = await Promise.all([
    getRoomActivityLog(roomId),
    getAdminMediationDetails(roomId, uiLocale),
    Promise.all(sides.map(async (side) => [side.id, await getPartyProfileStatus(side.id)] as const)),
  ]);

  return (
    <RoomDetailContent
      activityLog={activityLog}
      allowDelete
      basePath="/mediator/rooms"
      mediationDetails={mediationDetails}
      participants={sides}
      profileStatusByUserId={Object.fromEntries(profileStatuses)}
      readOnly
      showCredentials
      room={room}
    />
  );
}
