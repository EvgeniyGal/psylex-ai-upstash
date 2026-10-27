import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomParticipants, rooms, userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { isPartyRole, PARTY_ROLES } from "@/lib/participant-roles";

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

function emptyTests(): SideListRow["tests"] {
  return Object.fromEntries(
    TEST_KEYS.map((key) => [key, { complete: false, airtableCreatedAt: null }]),
  ) as SideListRow["tests"];
}

export async function listSideMemberships(params?: {
  createdByUserId?: string | null;
}): Promise<SideListRow[]> {
  const partyUsers = await db
    .select({
      userId: users.id,
      login: users.login,
      title: users.title,
      description: users.description,
      userRole: users.role,
      personalBotPrompt: users.personalBotPrompt,
      personalBotReadyAt: users.personalBotReadyAt,
      personalBotAirtableUpdatedAt: users.personalBotAirtableUpdatedAt,
    })
    .from(users)
    .where(inArray(users.role, [...PARTY_ROLES]));

  if (partyUsers.length === 0) return [];

  const allUserIds = partyUsers.map((row) => row.userId);

  const membershipRows = await db
    .select({
      membershipId: roomParticipants.id,
      userId: roomParticipants.userId,
      membershipPartyRole: roomParticipants.partyRole,
      roomId: rooms.id,
      roomTitle: rooms.title,
      roomCreatedByUserId: rooms.createdByUserId,
    })
    .from(roomParticipants)
    .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
    .where(
      and(
        inArray(roomParticipants.userId, allUserIds),
        inArray(roomParticipants.partyRole, ["party_a", "party_b"]),
      ),
    );

  const mediatorIds = [
    ...new Set(
      membershipRows
        .map((row) => row.roomCreatedByUserId)
        .filter((id): id is string => !!id),
    ),
  ];
  const mediators =
    mediatorIds.length > 0
      ? await db
          .select({ id: users.id, title: users.title })
          .from(users)
          .where(inArray(users.id, mediatorIds))
      : [];
  const mediatorTitleById = new Map(mediators.map((m) => [m.id, m.title]));

  const roomsByUser = new Map<string, SideRoomRef[]>();
  for (const row of membershipRows) {
    if (!isPartyRole(row.membershipPartyRole)) continue;
    const list = roomsByUser.get(row.userId) ?? [];
    if (!list.some((room) => room.roomId === row.roomId)) {
      list.push({
        membershipId: row.membershipId,
        roomId: row.roomId,
        roomTitle: row.roomTitle,
        partyRole: row.membershipPartyRole,
        roomCreatedByUserId: row.roomCreatedByUserId,
        mediatorTitle: row.roomCreatedByUserId
          ? (mediatorTitleById.get(row.roomCreatedByUserId) ?? null)
          : null,
      });
    }
    roomsByUser.set(row.userId, list);
  }

  const completions = await db
    .select({
      userId: userTestCompletions.userId,
      testKey: userTestCompletions.testKey,
      airtableCreatedAt: userTestCompletions.airtableCreatedAt,
    })
    .from(userTestCompletions)
    .where(inArray(userTestCompletions.userId, allUserIds));

  const completionsByUser = new Map<string, Map<string, Date | null>>();
  for (const row of completions) {
    const map = completionsByUser.get(row.userId) ?? new Map();
    map.set(row.testKey, row.airtableCreatedAt);
    completionsByUser.set(row.userId, map);
  }

  const mediatorScope = params?.createdByUserId ?? null;

  const result: SideListRow[] = [];
  for (const party of partyUsers) {
    if (!isPartyRole(party.userRole)) continue;

    const userRooms = [...(roomsByUser.get(party.userId) ?? [])].sort((a, b) =>
      a.roomTitle.localeCompare(b.roomTitle),
    );

    if (mediatorScope) {
      // Mediators only see parties that belong to rooms they created (no roomless pool).
      const scopedRooms = userRooms.filter((room) => room.roomCreatedByUserId === mediatorScope);
      if (scopedRooms.length === 0) continue;
    }

    const completed = completionsByUser.get(party.userId) ?? new Map();
    const tests =
      completed.size === 0
        ? emptyTests()
        : (Object.fromEntries(
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
          ) as SideListRow["tests"]);

    result.push({
      userId: party.userId,
      login: party.login,
      title: party.title,
      description: party.description,
      partyRole: party.userRole,
      rooms: mediatorScope
        ? userRooms.filter((room) => room.roomCreatedByUserId === mediatorScope)
        : userRooms,
      tests,
      personalBotReady: !!party.personalBotReadyAt && !!party.personalBotPrompt?.trim(),
      personalBotAirtableUpdatedAt: party.personalBotAirtableUpdatedAt?.toISOString() ?? null,
    });
  }

  return result.sort(
    (a, b) => a.title.localeCompare(b.title) || a.login.localeCompare(b.login),
  );
}
