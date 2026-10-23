import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { RoomDetailContent } from "@/components/admin/room-detail-content";
import type { Locale } from "@/lib/i18n";
import { getAdminMediationDetails } from "@/lib/mediation/admin-room-details";
import { getRoomActivityLog } from "@/lib/pipeline/room-activity-log";
import { getRoomSides } from "@/lib/room/helpers";
import { getPartyProfileStatus } from "@/lib/room/party-profile-status";
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

  const session = await getServerSession(authOptions);
  let uiLocale: Locale | undefined;
  if (session?.user?.id) {
    const [adminUser] = await db
      .select({ preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (adminUser?.preferredLocale === "uk" || adminUser?.preferredLocale === "en") {
      uiLocale = adminUser.preferredLocale;
    }
  }

  const sides = await getRoomSides(roomId);
  const [activityLog, mediationDetails, profileStatuses] = await Promise.all([
    getRoomActivityLog(roomId),
    getAdminMediationDetails(roomId, uiLocale),
    Promise.all(sides.map(async (side) => [side.id, await getPartyProfileStatus(side.id)] as const)),
  ]);

  return (
    <RoomDetailContent
      activityLog={activityLog}
      mediationDetails={mediationDetails}
      participants={sides}
      profileStatusByUserId={Object.fromEntries(profileStatuses)}
      room={room}
    />
  );
}
