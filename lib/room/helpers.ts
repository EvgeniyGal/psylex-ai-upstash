import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { PARTY_ROLES, roomParticipants, rooms, userTestCompletions, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { isParticipantRole, isPartyRole, type PartyRole } from "@/lib/participant-roles";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";

export type RoomPartySide = typeof users.$inferSelect & {
  role: PartyRole;
  membershipId: string;
};

function mergeMembership(
  user: typeof users.$inferSelect,
  membership: typeof roomParticipants.$inferSelect,
): RoomPartySide {
  if (!isPartyRole(membership.partyRole)) {
    throw new Error("Invalid party role on membership.");
  }
  return {
    ...user,
    role: membership.partyRole,
    disputeDescription: membership.disputeDescription,
    disputePriority: membership.disputePriority,
    disputeAcceptableOutcome: membership.disputeAcceptableOutcome,
    disputeIntakeSubmittedAt: membership.disputeIntakeSubmittedAt,
    membershipId: membership.id,
  };
}

export async function getRoomSides(roomId: string): Promise<RoomPartySide[]> {
  const rows = await db
    .select({
      user: users,
      membership: roomParticipants,
    })
    .from(roomParticipants)
    .innerJoin(users, eq(roomParticipants.userId, users.id))
    .where(
      and(
        eq(roomParticipants.roomId, roomId),
        inArray(roomParticipants.partyRole, [...PARTY_ROLES]),
      ),
    );

  return rows.map(({ user, membership }) => mergeMembership(user, membership));
}

export async function getPartiesByRoomIds(roomIds: string[]) {
  const map = new Map<string, RoomPartySide[]>();
  if (roomIds.length === 0) return map;

  const rows = await db
    .select({
      user: users,
      membership: roomParticipants,
    })
    .from(roomParticipants)
    .innerJoin(users, eq(roomParticipants.userId, users.id))
    .where(
      and(
        inArray(roomParticipants.roomId, roomIds),
        inArray(roomParticipants.partyRole, [...PARTY_ROLES]),
      ),
    );

  for (const { user, membership } of rows) {
    const side = mergeMembership(user, membership);
    const list = map.get(membership.roomId) ?? [];
    list.push(side);
    map.set(membership.roomId, list);
  }
  return map;
}

export async function getSideLocales(roomId: string): Promise<Record<string, Locale>> {
  const sides = await getRoomSides(roomId);
  const map: Record<string, Locale> = {};
  for (const side of sides) {
    map[side.id] = (side.preferredLocale as Locale) ?? "en";
  }
  return map;
}

export async function getMembership(userId: string, roomId: string) {
  const [row] = await db
    .select()
    .from(roomParticipants)
    .where(and(eq(roomParticipants.userId, userId), eq(roomParticipants.roomId, roomId)))
    .limit(1);
  return row ?? null;
}

export async function listParticipantMemberships(userId: string) {
  return db
    .select({
      membership: roomParticipants,
      room: rooms,
    })
    .from(roomParticipants)
    .innerJoin(rooms, eq(roomParticipants.roomId, rooms.id))
    .where(eq(roomParticipants.userId, userId))
    .orderBy(desc(roomParticipants.joinedAt));
}

export async function setActiveRoom(userId: string, roomId: string) {
  const membership = await getMembership(userId, roomId);
  if (!membership) throw new Error("Not a member of this room.");
  await db.update(users).set({ roomId }).where(eq(users.id, userId));
  return membership;
}

/**
 * Resolve the participant's active room: lastActiveRoomId if still a member,
 * otherwise the most recent membership.
 */
export async function getParticipantRoom(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !isParticipantRole(user.role)) return null;

  let membership =
    user.roomId != null ? await getMembership(userId, user.roomId) : null;

  if (!membership) {
    const [latest] = await db
      .select()
      .from(roomParticipants)
      .where(eq(roomParticipants.userId, userId))
      .orderBy(desc(roomParticipants.joinedAt))
      .limit(1);
    membership = latest ?? null;
    if (membership && user.roomId !== membership.roomId) {
      await db.update(users).set({ roomId: membership.roomId }).where(eq(users.id, userId));
    }
  }

  if (!membership) return null;

  const [freshUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!freshUser) return null;

  return {
    user: mergeMembership(freshUser, membership),
    roomId: membership.roomId,
    membership,
  };
}

export async function assertPartyInRoom(userId: string, roomId: string) {
  const membership = await getMembership(userId, roomId);
  if (!membership || !isPartyRole(membership.partyRole)) {
    throw new Error("Unauthorized");
  }
  return membership;
}

export type SessionWindow = {
  start: Date;
  end: Date;
};

export function sessionWindowFromSchedule(
  scheduledStartAt: Date,
  durationMinutes: number,
): SessionWindow {
  return {
    start: scheduledStartAt,
    end: new Date(scheduledStartAt.getTime() + durationMinutes * 60_000),
  };
}

function intervalsOverlap(a: SessionWindow, b: SessionWindow) {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/**
 * Throws if the party user already has another room with an overlapping
 * scheduled window or a live (started, not completed) session.
 */
export async function assertNoOverlappingPartySession(params: {
  userId: string;
  excludeRoomId: string;
  window?: SessionWindow | null;
  checkLive?: boolean;
}) {
  const memberships = await db
    .select({
      membership: roomParticipants,
      room: rooms,
    })
    .from(roomParticipants)
    .innerJoin(rooms, eq(roomParticipants.roomId, rooms.id))
    .where(
      and(
        eq(roomParticipants.userId, params.userId),
        ne(roomParticipants.roomId, params.excludeRoomId),
      ),
    );

  for (const { room } of memberships) {
    const completed =
      !!room.mediationCompletedAt || room.mediationPhase === "completed";
    if (completed) continue;

    if (params.checkLive !== false && room.mediationStartedAt) {
      throw new Error(
        "Participant already has an active mediation session in another room.",
      );
    }

    if (params.window && room.scheduledStartAt && !room.mediationStartedAt) {
      const other = sessionWindowFromSchedule(
        room.scheduledStartAt,
        room.mediationDurationMinutes ?? 60,
      );
      if (intervalsOverlap(params.window, other)) {
        throw new Error("Participant already has a scheduled session at this time.");
      }
    }
  }
}

export async function assertRoomPartiesNoOverlap(params: {
  roomId: string;
  window?: SessionWindow | null;
  checkLive?: boolean;
}) {
  const sides = await getRoomSides(params.roomId);
  for (const side of sides) {
    await assertNoOverlappingPartySession({
      userId: side.id,
      excludeRoomId: params.roomId,
      window: params.window,
      checkLive: params.checkLive,
    });
  }
}

export async function addRoomParticipant(params: {
  roomId: string;
  userId: string;
  partyRole: PartyRole;
}) {
  const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  if (!user || !isPartyRole(user.role)) {
    throw new Error("User is not a party participant.");
  }

  const [inserted] = await db
    .insert(roomParticipants)
    .values({
      roomId: params.roomId,
      userId: params.userId,
      partyRole: params.partyRole,
    })
    .returning();

  if (!user.roomId) {
    await db.update(users).set({ roomId: params.roomId }).where(eq(users.id, params.userId));
  }

  return inserted;
}

export type PartySearchHit = {
  id: string;
  login: string;
  title: string;
  role: string;
  onboardingCompletedAt: Date | null;
  personalBotReady: boolean;
  tests: Record<TestKey, boolean>;
};

export async function searchPartyUsers(
  query: string,
  options?: { limit?: number; createdByUserId?: string },
): Promise<PartySearchHit[]> {
  const limit = options?.limit ?? 20;
  const q = query.trim().replace(/[%_]/g, "");
  const partyFilter = inArray(users.role, [...PARTY_ROLES]);
  const textFilter = q
    ? sql`(${users.login} ILIKE ${`%${q}%`} OR ${users.title} ILIKE ${`%${q}%`})`
    : undefined;

  let scopedUserIds: string[] | null = null;
  if (options?.createdByUserId) {
    const owned = await db
      .selectDistinct({ userId: roomParticipants.userId })
      .from(roomParticipants)
      .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
      .where(eq(rooms.createdByUserId, options.createdByUserId));
    scopedUserIds = owned.map((row) => row.userId);
    if (scopedUserIds.length === 0) return [];
  }

  const filters = and(
    partyFilter,
    textFilter,
    scopedUserIds ? inArray(users.id, scopedUserIds) : undefined,
  );

  const rows = await db
    .select({
      id: users.id,
      login: users.login,
      title: users.title,
      role: users.role,
      onboardingCompletedAt: users.onboardingCompletedAt,
      personalBotReadyAt: users.personalBotReadyAt,
      personalBotPrompt: users.personalBotPrompt,
    })
    .from(users)
    .where(filters)
    .orderBy(users.title, users.login)
    .limit(limit);

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const completionRows = await db
    .select({
      userId: userTestCompletions.userId,
      testKey: userTestCompletions.testKey,
    })
    .from(userTestCompletions)
    .where(inArray(userTestCompletions.userId, ids));

  const completedByUser = new Map<string, Set<TestKey>>();
  for (const row of completionRows) {
    if (!TEST_KEYS.includes(row.testKey as TestKey)) continue;
    const set = completedByUser.get(row.userId) ?? new Set<TestKey>();
    set.add(row.testKey as TestKey);
    completedByUser.set(row.userId, set);
  }

  return rows.map((row) => {
    const completed = completedByUser.get(row.id) ?? new Set<TestKey>();
    const tests = Object.fromEntries(
      TEST_KEYS.map((key) => [key, completed.has(key)]),
    ) as Record<TestKey, boolean>;
    return {
      id: row.id,
      login: row.login,
      title: row.title,
      role: row.role,
      onboardingCompletedAt: row.onboardingCompletedAt,
      personalBotReady: !!row.personalBotReadyAt && !!row.personalBotPrompt?.trim(),
      tests,
    };
  });
}
