import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { MediatorSessionLobby } from "@/components/mediator/mediator-session-lobby";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import {
  getMediatorHandshakeForMediator,
  tryFinalizeMediatorSession,
} from "@/lib/mediator-session/handshake";
import { isMediatorSessionEnded } from "@/lib/mediator-session/room-mode";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MediatorRoomLobbyPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!isUuid(roomId)) redirect("/mediator/rooms");
  const userId = await requireSessionUserId();

  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.createdByUserId, userId)))
    .limit(1);
  if (!room) redirect("/mediator/rooms");

  await tryFinalizeMediatorSession(roomId);
  if (isMediatorSessionEnded(room.mediationPhase)) {
    redirect(`/mediator/rooms/${roomId}`);
  }
  const handshake = await getMediatorHandshakeForMediator(userId, roomId);
  if (!handshake) redirect(`/mediator/rooms/${roomId}`);

  if (handshake.status === "started") {
    redirect(`/mediator/rooms/${roomId}/session`);
  }

  const partyRows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.roomId, roomId));
  const partyUserIds = partyRows
    .filter((row) => row.role === "party_a" || row.role === "party_b")
    .map((row) => row.id);

  return (
    <MediatorSessionLobby
      initialHandshake={handshake}
      partyUserIds={partyUserIds}
      roomId={roomId}
      roomTitle={room.title}
    />
  );
}
