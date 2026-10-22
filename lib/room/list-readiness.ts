import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomParticipants, rooms, userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS } from "@/lib/test-keys";
import {
  isRoomInterestsComplete,
  isRoomLegalAnalysisComplete,
  isUserEmotionalTriggersComplete,
  isUserPsychodynamicComplete,
  isPersonalBotReady,
} from "@/lib/pipeline/gate";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { isPartyRole } from "@/lib/participant-roles";

function partyHasAllTests(userId: string, completionsByUser: Map<string, Set<string>>) {
  const keys = completionsByUser.get(userId) ?? new Set();
  return TEST_KEYS.every((key) => keys.has(key));
}

type SideForReady = typeof users.$inferSelect & {
  disputeIntakeSubmittedAt: Date | null;
};

function isPartyMediationReady(
  user: SideForReady,
  completionsByUser: Map<string, Set<string>>,
) {
  return (
    partyHasAllTests(user.id, completionsByUser) &&
    isPersonalBotReady(user) &&
    hasSubmittedDisputeIntake(user)
  );
}

/** Both parties ready (tests + bot + intake) and post-intake pipeline complete. */
export async function getRoomsPreparationReadyMap(
  roomIds: string[],
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (roomIds.length === 0) return result;

  const [roomRows, membershipRows] = await Promise.all([
    db.select().from(rooms).where(inArray(rooms.id, roomIds)),
    db
      .select({
        membership: roomParticipants,
        user: users,
      })
      .from(roomParticipants)
      .innerJoin(users, eq(roomParticipants.userId, users.id))
      .where(inArray(roomParticipants.roomId, roomIds)),
  ]);

  const partyIds = membershipRows.map((row) => row.user.id);

  const completionRows =
    partyIds.length > 0
      ? await db
          .select({
            userId: userTestCompletions.userId,
            testKey: userTestCompletions.testKey,
          })
          .from(userTestCompletions)
          .where(inArray(userTestCompletions.userId, partyIds))
      : [];

  const completionsByUser = new Map<string, Set<string>>();
  for (const row of completionRows) {
    const set = completionsByUser.get(row.userId) ?? new Set<string>();
    set.add(row.testKey);
    completionsByUser.set(row.userId, set);
  }

  const partiesByRoom = new Map<string, SideForReady[]>();
  for (const { membership, user } of membershipRows) {
    if (!isPartyRole(membership.partyRole)) continue;
    const side: SideForReady = {
      ...user,
      role: membership.partyRole,
      disputeDescription: membership.disputeDescription,
      disputePriority: membership.disputePriority,
      disputeAcceptableOutcome: membership.disputeAcceptableOutcome,
      disputeIntakeSubmittedAt: membership.disputeIntakeSubmittedAt,
    };
    const list = partiesByRoom.get(membership.roomId) ?? [];
    list.push(side);
    partiesByRoom.set(membership.roomId, list);
  }

  for (const room of roomRows) {
    const parties = partiesByRoom.get(room.id) ?? [];
    const partyA = parties.find((p) => p.role === "party_a");
    const partyB = parties.find((p) => p.role === "party_b");
    if (!partyA || !partyB) {
      result.set(room.id, false);
      continue;
    }

    const bothPartiesReady =
      isPartyMediationReady(partyA, completionsByUser) &&
      isPartyMediationReady(partyB, completionsByUser);

    const pipelineComplete =
      isUserPsychodynamicComplete(partyA) &&
      isUserPsychodynamicComplete(partyB) &&
      isUserEmotionalTriggersComplete(partyA) &&
      isUserEmotionalTriggersComplete(partyB) &&
      isRoomInterestsComplete(room) &&
      isRoomLegalAnalysisComplete(room);

    result.set(room.id, bothPartiesReady && pipelineComplete);
  }

  return result;
}
