"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { roomParticipants, rooms, users } from "@/drizzle/schema";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";
import type { Locale } from "@/lib/i18n";
import { buildAdminAgreementDownload } from "@/lib/mediation/pdf";
import { isPartyRole, type PartyRole } from "@/lib/participant-roles";
import { isRoomJurisdiction } from "@/lib/room/jurisdiction";
import { addRoomParticipant, searchPartyUsers } from "@/lib/room/helpers";
import { isUsaSubJurisdiction, parseUsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";
import { MODE_A_SESSION_DURATION_MINUTES } from "@/lib/mediation/types";
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
  const partyAMode = String(formData.get("partyAMode") ?? "create");
  const partyBMode = String(formData.get("partyBMode") ?? "create");
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

  const isModeA = role !== "mediator";
  const [room] = await db
    .insert(rooms)
    .values({
      title,
      description,
      jurisdiction: jurisdictionRaw,
      usaSubJurisdiction,
      createdByUserId: role === "mediator" ? userId : null,
      ...(isModeA ? { mediationDurationMinutes: MODE_A_SESSION_DURATION_MINUTES } : {}),
    })
    .returning();

  async function resolvePartySlot(
    mode: string,
    partyRole: PartyRole,
    titleKey: string,
    descriptionKey: string,
    existingIdKey: string,
  ) {
    if (mode === "existing") {
      const existingId = required(formData.get(existingIdKey), existingIdKey);
      if (role === "mediator") {
        const { assertMediatorOwnsPartyUser } = await import("@/lib/room/party-redo");
        await assertMediatorOwnsPartyUser(userId, existingId);
      }
      await addRoomParticipant({ roomId: room.id, userId: existingId, partyRole });
      return;
    }
    const partyTitle = required(formData.get(titleKey), titleKey);
    const partyDescription = required(formData.get(descriptionKey), descriptionKey);
    const [created] = await db
      .insert(users)
      .values({
        login: generateLogin(),
        password: generatePassword(),
        role: partyRole,
        title: partyTitle,
        description: partyDescription,
        roomId: room.id,
      })
      .returning();
    await db.insert(roomParticipants).values({
      roomId: room.id,
      userId: created.id,
      partyRole,
    });
  }

  await resolvePartySlot(
    partyAMode,
    "party_a",
    "partyATitle",
    "partyADescription",
    "partyAExistingUserId",
  );
  await resolvePartySlot(
    partyBMode,
    "party_b",
    "partyBTitle",
    "partyBDescription",
    "partyBExistingUserId",
  );

  const sides = await db
    .select({ userId: roomParticipants.userId })
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, room.id));
  if (sides[0]?.userId && sides[1]?.userId && sides[0].userId === sides[1].userId) {
    await db.delete(rooms).where(eq(rooms.id, room.id));
    throw new Error("The same participant cannot fill both party slots.");
  }

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

  // Detach only: clear lastActiveRoomId for members of this room, keep user accounts.
  const members = await db
    .select({ userId: roomParticipants.userId })
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, roomId));
  for (const member of members) {
    await db
      .update(users)
      .set({ roomId: null })
      .where(and(eq(users.id, member.userId), eq(users.roomId, roomId)));
  }

  await db.delete(rooms).where(eq(rooms.id, roomId));
  notifyRoom(roomId);

  revalidatePath("/admin/rooms");
  revalidatePath("/admin/mediators");
  revalidatePath("/mediator/rooms");
  redirect(role === "mediator" ? "/mediator/rooms" : "/admin/rooms");
}

export async function searchPartyUsersAction(query: string) {
  const { role, userId } = await assertCanManageRooms();
  return searchPartyUsers(query, {
    createdByUserId: role === "mediator" ? userId : undefined,
  });
}

export async function requestProfileRefresh(userId: string) {
  const { role, userId: actorId } = await assertCanManageRooms();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !isPartyRole(user.role)) {
    throw new Error("User is not a party participant.");
  }
  if (role === "mediator") {
    const { assertMediatorOwnsPartyUser, redoFullPartyProfileLocal } = await import(
      "@/lib/room/party-redo"
    );
    await assertMediatorOwnsPartyUser(actorId, userId);
    await redoFullPartyProfileLocal(userId);
  } else {
    const { redoFullPartyProfileLocal } = await import("@/lib/room/party-redo");
    await redoFullPartyProfileLocal(userId);
  }
  if (user.roomId) {
    revalidatePath(`/admin/rooms/${user.roomId}`);
    revalidatePath(`/mediator/rooms/${user.roomId}`);
  }
  revalidatePath("/admin/rooms");
  revalidatePath("/mediator/rooms");
  revalidatePath("/admin/sides");
  revalidatePath("/mediator/sides");
}
