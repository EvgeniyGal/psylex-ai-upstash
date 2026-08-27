import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { MediatorSessionRoom } from "@/components/mediator/mediator-session-room";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import { getMediatorConsoleSessionState } from "@/lib/mediator-session/orchestrator";
import { tryFinalizeMediatorSession } from "@/lib/mediator-session/handshake";
import { isMediatorSessionEnded } from "@/lib/mediator-session/room-mode";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function MediatorRoomSessionPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
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
  if (!room.mediationStartedAt) {
    const [fresh] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (isMediatorSessionEnded(fresh?.mediationPhase)) {
      redirect(`/mediator/rooms/${roomId}`);
    }
    if (!fresh?.mediationStartedAt) {
      redirect(`/mediator/rooms/${roomId}/lobby`);
    }
  }

  const state = await getMediatorConsoleSessionState(userId, roomId);
  if (!state) redirect(`/mediator/rooms/${roomId}/lobby`);
  if (isMediatorSessionEnded(state.room.phase)) {
    redirect(`/mediator/rooms/${roomId}`);
  }

  return <MediatorSessionRoom initialState={state} roomId={roomId} />;
}
