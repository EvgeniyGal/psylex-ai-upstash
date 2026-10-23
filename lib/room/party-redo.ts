import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomParticipants, rooms, userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

function parseRedoAfterMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}

export async function assertMediatorOwnsPartyUser(mediatorUserId: string, partyUserId: string) {
  const [row] = await db
    .select({ id: roomParticipants.id })
    .from(roomParticipants)
    .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
    .where(
      and(eq(roomParticipants.userId, partyUserId), eq(rooms.createdByUserId, mediatorUserId)),
    )
    .limit(1);
  if (!row) throw new Error("Unauthorized");
}

async function revalidatePartyNotify(userId: string) {
  const [user] = await db
    .select({ roomId: users.roomId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  notifyUser(userId);
  if (user?.roomId) notifyRoom(user.roomId);

  const memberships = await db
    .select({ roomId: roomParticipants.roomId })
    .from(roomParticipants)
    .where(eq(roomParticipants.userId, userId));
  for (const membership of memberships) {
    notifyRoom(membership.roomId);
  }
}

export async function redoPartyTestLocal(userId: string, testKey: TestKey) {
  const [completion] = await db
    .select({ airtableCreatedAt: userTestCompletions.airtableCreatedAt })
    .from(userTestCompletions)
    .where(and(eq(userTestCompletions.userId, userId), eq(userTestCompletions.testKey, testKey)))
    .limit(1);

  const [user] = await db
    .select({ testRedoAfter: users.testRedoAfter })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const floors = parseRedoAfterMap(user?.testRedoAfter);
  floors[testKey] =
    completion?.airtableCreatedAt?.toISOString() ?? new Date().toISOString();

  await db
    .delete(userTestCompletions)
    .where(and(eq(userTestCompletions.userId, userId), eq(userTestCompletions.testKey, testKey)));

  await db
    .update(users)
    .set({
      testRedoAfter: floors,
      onboardingCompletedAt: null,
      profileRefreshRequestedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await revalidatePartyNotify(userId);
}

export async function redoAllPartyTestsLocal(userId: string) {
  const completions = await db
    .select({
      testKey: userTestCompletions.testKey,
      airtableCreatedAt: userTestCompletions.airtableCreatedAt,
    })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  const [user] = await db
    .select({
      testRedoAfter: users.testRedoAfter,
      welcomeSeenAt: users.welcomeSeenAt,
      disclaimerAcceptedAt: users.disclaimerAcceptedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const floors = parseRedoAfterMap(user?.testRedoAfter);
  const nowIso = new Date().toISOString();
  for (const key of TEST_KEYS) {
    const row = completions.find((c) => c.testKey === key);
    floors[key] = row?.airtableCreatedAt?.toISOString() ?? nowIso;
  }

  await db.delete(userTestCompletions).where(eq(userTestCompletions.userId, userId));
  await db
    .update(users)
    .set({
      testRedoAfter: floors,
      onboardingCompletedAt: null,
      psychodynamicProfile: null,
      psychodynamicProfileAt: null,
      emotionalTriggers: null,
      emotionalTriggersAt: null,
      profileRefreshRequestedAt: new Date(),
      welcomeSeenAt: user?.welcomeSeenAt ?? new Date(),
      disclaimerAcceptedAt: user?.disclaimerAcceptedAt ?? new Date(),
    })
    .where(eq(users.id, userId));

  await revalidatePartyNotify(userId);
}

export async function redoPartyBotPromptLocal(userId: string) {
  const [user] = await db
    .select({
      personalBotAirtableUpdatedAt: users.personalBotAirtableUpdatedAt,
      welcomeSeenAt: users.welcomeSeenAt,
      disclaimerAcceptedAt: users.disclaimerAcceptedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db
    .update(users)
    .set({
      personalBotPrompt: null,
      personalBotReadyAt: null,
      personalBotAirtableUpdatedAt: null,
      personalBotRedoAfter: user?.personalBotAirtableUpdatedAt ?? new Date(),
      onboardingCompletedAt: null,
      profileRefreshRequestedAt: new Date(),
      welcomeSeenAt: user?.welcomeSeenAt ?? new Date(),
      disclaimerAcceptedAt: user?.disclaimerAcceptedAt ?? new Date(),
    })
    .where(eq(users.id, userId));

  await revalidatePartyNotify(userId);
}

export async function redoFullPartyProfileLocal(userId: string) {
  const completions = await db
    .select({
      testKey: userTestCompletions.testKey,
      airtableCreatedAt: userTestCompletions.airtableCreatedAt,
    })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  const [user] = await db
    .select({
      personalBotAirtableUpdatedAt: users.personalBotAirtableUpdatedAt,
      testRedoAfter: users.testRedoAfter,
      welcomeSeenAt: users.welcomeSeenAt,
      disclaimerAcceptedAt: users.disclaimerAcceptedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const floors = parseRedoAfterMap(user?.testRedoAfter);
  const nowIso = new Date().toISOString();
  for (const key of TEST_KEYS) {
    const row = completions.find((c) => c.testKey === key);
    floors[key] = row?.airtableCreatedAt?.toISOString() ?? nowIso;
  }

  await db.delete(userTestCompletions).where(eq(userTestCompletions.userId, userId));
  await db
    .update(users)
    .set({
      testRedoAfter: floors,
      onboardingCompletedAt: null,
      personalBotPrompt: null,
      personalBotReadyAt: null,
      personalBotAirtableUpdatedAt: null,
      personalBotRedoAfter: user?.personalBotAirtableUpdatedAt ?? new Date(),
      psychodynamicProfile: null,
      psychodynamicProfileAt: null,
      emotionalTriggers: null,
      emotionalTriggersAt: null,
      profileRefreshRequestedAt: new Date(),
      welcomeSeenAt: user?.welcomeSeenAt ?? new Date(),
      disclaimerAcceptedAt: user?.disclaimerAcceptedAt ?? new Date(),
    })
    .where(eq(users.id, userId));

  await revalidatePartyNotify(userId);
}
