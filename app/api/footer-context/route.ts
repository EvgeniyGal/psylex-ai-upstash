import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import {
  demoModeFromRoomCreatedBy,
  isLandingFooterPath,
  roomIdFromFooterPath,
  type FooterDemoMode,
} from "@/lib/footer-demo-mode";
import { isPartyRole } from "@/lib/participant-roles";
import { isUuid } from "@/lib/utils";

async function resolveUserId() {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;

  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }

  return { userId, role: session?.user?.role ?? null };
}

async function demoModeForRoomId(roomId: string): Promise<"modeA" | "modeB" | null> {
  if (!isUuid(roomId)) return null;

  const [room] = await db
    .select({ createdByUserId: rooms.createdByUserId })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) return null;
  return demoModeFromRoomCreatedBy(room.createdByUserId);
}

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("path") ?? "/";

  if (isLandingFooterPath(pathname)) {
    return NextResponse.json({ demoMode: "landing" satisfies FooterDemoMode });
  }

  const { userId, role } = await resolveUserId();
  if (!userId || !role) {
    return NextResponse.json({ demoMode: "landing" satisfies FooterDemoMode });
  }

  const roomIdFromPath = roomIdFromFooterPath(pathname);
  if (roomIdFromPath) {
    const mode = await demoModeForRoomId(roomIdFromPath);
    if (mode) {
      return NextResponse.json({ demoMode: mode satisfies FooterDemoMode });
    }
  }

  if (isPartyRole(role)) {
    const [user] = await db
      .select({ roomId: users.roomId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.roomId) {
      const mode = await demoModeForRoomId(user.roomId);
      if (mode) {
        return NextResponse.json({ demoMode: mode satisfies FooterDemoMode });
      }
    }
  }

  if (role === "mediator") {
    const [room] = await db
      .select({ createdByUserId: rooms.createdByUserId })
      .from(rooms)
      .where(eq(rooms.createdByUserId, userId))
      .limit(1);

    if (room) {
      return NextResponse.json({
        demoMode: demoModeFromRoomCreatedBy(room.createdByUserId) satisfies FooterDemoMode,
      });
    }

    return NextResponse.json({ demoMode: "modeB" satisfies FooterDemoMode });
  }

  return NextResponse.json({ demoMode: "landing" satisfies FooterDemoMode });
}
