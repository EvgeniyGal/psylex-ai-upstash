"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";
import type { Locale } from "@/lib/i18n";
import { buildAdminAgreementDownload } from "@/lib/mediation/pdf";
import { isRoomJurisdiction } from "@/lib/room/jurisdiction";
import { isUsaSubJurisdiction, parseUsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

function required(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

async function assertCanManageRooms() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "mediator")) {
    throw new Error("Unauthorized");
  }
  const userId = await requireSessionUserId();
  return { role, userId };
}

async function assertCanAccessRoom(roomId: string) {
  const { role, userId } = await assertCanManageRooms();
  if (role === "mediator") {
    const [room] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.createdByUserId, userId)))
      .limit(1);
    if (!room) throw new Error("Unauthorized");
  }
}

export async function downloadRoomMediationResults(roomId: string, locale: Locale = "en") {
  await assertCanAccessRoom(roomId);
  return buildAdminAgreementDownload(roomId, locale);
}

export async function createRoom(formData: FormData) {
  const { role, userId } = await assertCanManageRooms();

  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");
  const partyATitle = required(formData.get("partyATitle"), "partyATitle");
  const partyADescription = required(formData.get("partyADescription"), "partyADescription");
  const partyBTitle = required(formData.get("partyBTitle"), "partyBTitle");
  const partyBDescription = required(formData.get("partyBDescription"), "partyBDescription");
  const jurisdictionRaw = required(formData.get("jurisdiction"), "jurisdiction");
  if (!isRoomJurisdiction(jurisdictionRaw)) {
    throw new Error("Invalid jurisdiction");
  }

  const usaSubJurisdictionRaw = String(formData.get("usaSubJurisdiction") ?? "").trim();
  if (jurisdictionRaw === "usa") {
    if (!usaSubJurisdictionRaw || !isUsaSubJurisdiction(usaSubJurisdictionRaw)) {
      throw new Error("US state or territory is required for United States rooms.");
    }
  } else if (usaSubJurisdictionRaw) {
    throw new Error("US state or territory is only valid for United States rooms.");
  }

  const usaSubJurisdiction =
    jurisdictionRaw === "usa" ? parseUsaSubJurisdiction(usaSubJurisdictionRaw) : null;
  if (jurisdictionRaw === "usa" && !usaSubJurisdiction) {
    throw new Error("Invalid US state or territory.");
  }

  const [room] = await db
    .insert(rooms)
    .values({
      title,
      description,
      jurisdiction: jurisdictionRaw,
      usaSubJurisdiction,
      createdByUserId: role === "mediator" ? userId : null,
    })
    .returning();

  await db.insert(users).values([
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "party_a",
      title: partyATitle,
      description: partyADescription,
      roomId: room.id,
    },
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "party_b",
      title: partyBTitle,
      description: partyBDescription,
      roomId: room.id,
    },
  ]);
  notifyRoom(room.id);

  revalidatePath("/admin/rooms");
  revalidatePath("/mediator/rooms");
  revalidatePath("/admin/mediators");
  redirect(role === "mediator" ? `/mediator/rooms/${room.id}` : `/admin/rooms/${room.id}`);
}

export async function updateRoomMeta(formData: FormData) {
  const id = String(formData.get("roomId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db
    .update(rooms)
    .set({ title, description })
    .where(eq(rooms.id, id));
  notifyRoom(id);
  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${id}`);
}

export async function updateParticipantMeta(formData: FormData) {
  const id = String(formData.get("userId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db.update(users).set({ title, description }).where(eq(users.id, id));
  notifyUser(id);
  const [user] = await db.select({ roomId: users.roomId }).from(users).where(eq(users.id, id)).limit(1);
  notifyRoom(user?.roomId);
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/mediators");
  if (user?.roomId) revalidatePath(`/admin/rooms/${user.roomId}`);
}

export async function deleteRoom(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const { role } = await assertCanManageRooms();
  await assertCanAccessRoom(roomId);

  await db.delete(users).where(eq(users.roomId, roomId));
  await db.delete(rooms).where(eq(rooms.id, roomId));
  notifyRoom(roomId);

  revalidatePath("/admin/rooms");
  revalidatePath("/admin/mediators");
  revalidatePath("/mediator/rooms");
  redirect(role === "mediator" ? "/mediator/rooms" : "/admin/rooms");
}
