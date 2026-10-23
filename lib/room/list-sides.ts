import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomParticipants, rooms, userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { isPartyRole } from "@/lib/participant-roles";

export type SideListRow = {
  membershipId: string;
  userId: string;
  login: string;
  title: string;
  description: string;
  partyRole: "party_a" | "party_b";
  roomId: string;
  roomTitle: string;
  roomCreatedByUserId: string | null;
  mediatorTitle: string | null;
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
      partyRole: roomParticipants.partyRole,
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

  return rows
    .filter((row) => isPartyRole(row.partyRole))
    .map((row) => {
      const completed = completionsByUser.get(row.userId) ?? new Map();
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

      return {
        membershipId: row.membershipId,
        userId: row.userId,
        login: row.login,
        title: row.title,
        description: row.description,
        partyRole: row.partyRole as "party_a" | "party_b",
        roomId: row.roomId,
        roomTitle: row.roomTitle,
        roomCreatedByUserId: row.roomCreatedByUserId,
        mediatorTitle: row.roomCreatedByUserId
          ? (mediatorTitleById.get(row.roomCreatedByUserId) ?? null)
          : null,
        tests,
        personalBotReady: !!row.personalBotReadyAt && !!row.personalBotPrompt?.trim(),
        personalBotAirtableUpdatedAt: row.personalBotAirtableUpdatedAt?.toISOString() ?? null,
      };
    });
}
