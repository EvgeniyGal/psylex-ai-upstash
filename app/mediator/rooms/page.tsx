import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import { RoomsContent } from "@/components/admin/rooms-content";
import { getPartiesByRoomIds } from "@/lib/room/helpers";
import { getRoomsPreparationReadyMap } from "@/lib/room/list-readiness";

export default async function MediatorRoomsPage() {
  const userId = await requireSessionUserId();

  const roomRows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.createdByUserId, userId))
    .orderBy(desc(rooms.createdAt));

  const readyByRoomId = await getRoomsPreparationReadyMap(roomRows.map((room) => room.id));

  const enrichedRooms = roomRows.map((room) => ({
    ...room,
    preparationReady: readyByRoomId.get(room.id) ?? false,
  }));

  const partiesByRoom = await getPartiesByRoomIds(roomRows.map((room) => room.id));
  const participantsByRoom = roomRows.map((room) => ({
    roomId: room.id,
    users: partiesByRoom.get(room.id) ?? [],
  }));

  return (
    <RoomsContent
      basePath="/mediator/rooms"
      participantsByRoom={participantsByRoom}
      roomRows={enrichedRooms}
      showCreateButton={true}
    />
  );
}
