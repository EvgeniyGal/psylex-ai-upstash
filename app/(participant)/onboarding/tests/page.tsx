import { eq } from "drizzle-orm";
import { TestingDashboard } from "@/components/portal/testing-dashboard";
import { users } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getTestStatuses, getUserOnboardingStatus } from "@/lib/onboarding";
import { resolveTestsFlowStep } from "@/lib/participant-flow";
import { guardOnboardingStep, isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";
import { resolveTestUrl } from "@/lib/default-test-urls";
import { syncUserTestStatus } from "@/lib/test-status-sync";
import type { TestKey } from "@/lib/test-keys";

const TEST_URL_MAP: Record<TestKey, keyof Awaited<ReturnType<typeof getPlatformSettings>>> = {
  personality_type: "testPersonalityTypeUrl",
  face_fear: "testFaceFearUrl",
  character_traits: "testCharacterTraitsUrl",
  personality_conflicts: "testPersonalityConflictsUrl",
};

type TestsPageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function TestsPage({ searchParams }: TestsPageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { userId, role, login } = await requireParticipantSession();

  if (!review) {
    await guardOnboardingStep("tests");
  }

  const settings = await getPlatformSettings();

  if (!review) {
    await syncUserTestStatus(userId, login);
  }

  const status = await getUserOnboardingStatus(userId);
  const [userRow] = await db
    .select({ profileRefreshRequestedAt: users.profileRefreshRequestedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const tests = getTestStatuses(status.completedTests).map((test) => ({
    key: test.key,
    url: resolveTestUrl(String(settings[TEST_URL_MAP[test.key]] ?? "")),
    completed: review ? true : test.completed,
  }));

  return (
    <TestingDashboard
      canProceed={status.canProceed}
      flowStep={resolveTestsFlowStep()}
      login={login}
      personalBotReady={status.personalBotReady}
      refreshRequested={!!userRow?.profileRefreshRequestedAt}
      review={review}
      role={role as ParticipantRole}
      tests={tests}
      testsComplete={review ? true : status.testsComplete}
      userId={userId}
    />
  );
}
