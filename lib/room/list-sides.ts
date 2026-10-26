import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomParticipants, rooms, userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { isPartyRole } from "@/lib/participant-roles";

export type SideRoomRef = {
  membershipId: string;
  roomId: string;
  roomTitle: string;
  partyRole: "party_a" | "party_b";
  roomCreatedByUserId: string | null;
  mediatorTitle: string | null;
};

export type SideListRow = {
  userId: string;
  login: string;
  title: string;
  description: string;
  /** Canonical party role on the user record. */
  partyRole: "party_a" | "party_b";
  rooms: SideRoomRef[];
  tests: Record<
    TestKey,
    {
      complete: boolean;
      airtableCreatedAt: string | null;
    }
  >;
  personalBotReady: boolean;
  personalBotAirtableUpdatedAt: string | null;
};

export async function listSideMemberships(params?: {
  createdByUserId?: string | null;
}): Promise<SideListRow[]> {
  const membershipFilters = [inArray(roomParticipants.partyRole, ["party_a", "party_b"])];

  const rows = await db
    .select({
      membershipId: roomParticipants.id,
      userId: users.id,
      login: users.login,
      title: users.title,
      description: users.description,
      userRole: users.role,
      membershipPartyRole: roomParticipants.partyRole,
      roomId: rooms.id,
      roomTitle: rooms.title,
      roomCreatedByUserId: rooms.createdByUserId,
      personalBotPrompt: users.personalBotPrompt,
      personalBotReadyAt: users.personalBotReadyAt,
      personalBotAirtableUpdatedAt: users.personalBotAirtableUpdatedAt,
    })
    .from(roomParticipants)
    .innerJoin(users, eq(roomParticipants.userId, users.id))
    .innerJoin(rooms, eq(roomParticipants.roomId, rooms.id))
    .where(
      params?.createdByUserId
        ? and(...membershipFilters, eq(rooms.createdByUserId, params.createdByUserId))
        : and(...membershipFilters),
    );

  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((row) => row.userId))];
  const completions = await db
    .select({
      userId: userTestCompletions.userId,
      testKey: userTestCompletions.testKey,
      airtableCreatedAt: userTestCompletions.airtableCreatedAt,
    })
    .from(userTestCompletions)
    .where(inArray(userTestCompletions.userId, userIds));

  const completionsByUser = new Map<string, Map<string, Date | null>>();
  for (const row of completions) {
    const map = completionsByUser.get(row.userId) ?? new Map();
    map.set(row.testKey, row.airtableCreatedAt);
    completionsByUser.set(row.userId, map);
  }

  const mediatorIds = [
    ...new Set(rows.map((row) => row.roomCreatedByUserId).filter((id): id is string => !!id)),
  ];
  const mediators =
    mediatorIds.length > 0
      ? await db
          .select({ id: users.id, title: users.title })
          .from(users)
          .where(inArray(users.id, mediatorIds))
      : [];
  const mediatorTitleById = new Map(mediators.map((m) => [m.id, m.title]));

  type Acc = {
    userId: string;
    login: string;
    title: string;
    description: string;
    partyRole: "party_a" | "party_b";
    personalBotReady: boolean;
    personalBotAirtableUpdatedAt: string | null;
    rooms: SideRoomRef[];
  };

  const byUser = new Map<string, Acc>();

  for (const row of rows) {
    if (!isPartyRole(row.membershipPartyRole) || !isPartyRole(row.userRole)) continue;

    const roomRef: SideRoomRef = {
      membershipId: row.membershipId,
      roomId: row.roomId,
      roomTitle: row.roomTitle,
      partyRole: row.membershipPartyRole,
      roomCreatedByUserId: row.roomCreatedByUserId,
      mediatorTitle: row.roomCreatedByUserId
        ? (mediatorTitleById.get(row.roomCreatedByUserId) ?? null)
        : null,
    };

    const existing = byUser.get(row.userId);
    if (existing) {
      if (!existing.rooms.some((room) => room.roomId === roomRef.roomId)) {
        existing.rooms.push(roomRef);
      }
      continue;
    }

    byUser.set(row.userId, {
      userId: row.userId,
      login: row.login,
      title: row.title,
      description: row.description,
      partyRole: row.userRole,
      personalBotReady: !!row.personalBotReadyAt && !!row.personalBotPrompt?.trim(),
      personalBotAirtableUpdatedAt: row.personalBotAirtableUpdatedAt?.toISOString() ?? null,
      rooms: [roomRef],
    });
  }

  return [...byUser.values()]
    .map((acc) => {
      const completed = completionsByUser.get(acc.userId) ?? new Map();
      const tests = Object.fromEntries(
        TEST_KEYS.map((key) => {
          const at = completed.get(key);
          return [
            key,
            {
              complete: completed.has(key),
              airtableCreatedAt: at ? at.toISOString() : null,
            },
          ];
        }),
      ) as SideListRow["tests"];

      acc.rooms.sort((a, b) => a.roomTitle.localeCompare(b.roomTitle));

      return {
        userId: acc.userId,
        login: acc.login,
        title: acc.title,
        description: acc.description,
        partyRole: acc.partyRole,
        rooms: acc.rooms,
        tests,
        personalBotReady: acc.personalBotReady,
        personalBotAirtableUpdatedAt: acc.personalBotAirtableUpdatedAt,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title) || a.login.localeCompare(b.login));
}
