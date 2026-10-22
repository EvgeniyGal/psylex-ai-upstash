import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS } from "@/lib/test-keys";
import { isPersonalBotReady } from "@/lib/pipeline/gate";

export type PartyProfileStatus = {
  ready: boolean;
  profileReadyAt: string | null;
  testsCompletedAt: string | null;
  refreshRequested: boolean;
};

export async function getPartyProfileStatus(userId: string): Promise<PartyProfileStatus> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return { ready: false, profileReadyAt: null, testsCompletedAt: null, refreshRequested: false };
  }

  const completions = await db
    .select({ completedAt: userTestCompletions.completedAt, testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  const completedKeys = new Set(
    completions
      .map((row) => row.testKey)
      .filter((key) => TEST_KEYS.includes(key as (typeof TEST_KEYS)[number])),
  );
  const testsComplete = TEST_KEYS.every((key) => completedKeys.has(key));
  const botReady = isPersonalBotReady(user);
  const ready =
    testsComplete &&
    botReady &&
    !!user.onboardingCompletedAt &&
    !user.profileRefreshRequestedAt;

  const testDates = completions
    .filter((row) => TEST_KEYS.includes(row.testKey as (typeof TEST_KEYS)[number]))
    .map((row) => row.completedAt.getTime());
  const lastTestMs = testDates.length > 0 ? Math.max(...testDates) : null;

  const candidates = [
    user.onboardingCompletedAt?.getTime() ?? null,
    lastTestMs,
    user.personalBotReadyAt?.getTime() ?? null,
    user.psychodynamicProfileAt?.getTime() ?? null,
  ].filter((value): value is number => value != null);

  const profileReadyAt =
    ready && candidates.length > 0
      ? new Date(Math.max(...candidates)).toISOString()
      : null;

  return {
    ready,
    profileReadyAt,
    testsCompletedAt: lastTestMs != null ? new Date(lastTestMs).toISOString() : null,
    refreshRequested: !!user.profileRefreshRequestedAt,
  };
}
