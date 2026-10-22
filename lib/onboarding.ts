import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userTestCompletions, users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { isParticipantRole, type ParticipantRole } from "@/lib/participant-roles";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";

export type OnboardingStep = "welcome" | "consent" | "tests" | "complete";

export type OnboardingStatus = {
  welcomeSeenAt: Date | null;
  disclaimerAcceptedAt: Date | null;
  onboardingCompletedAt: Date | null;
  completedTests: TestKey[];
  testsComplete: boolean;
  personalBotReady: boolean;
  canProceed: boolean;
  nextStep: OnboardingStep;
  nextPath: string;
};

export async function getUserOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return {
      welcomeSeenAt: null,
      disclaimerAcceptedAt: null,
      onboardingCompletedAt: null,
      completedTests: [],
      testsComplete: false,
      personalBotReady: false,
      canProceed: false,
      nextStep: "welcome",
      nextPath: "/onboarding/welcome",
    };
  }

  const completions = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  const completedTests = completions
    .map((row) => row.testKey)
    .filter((key): key is TestKey => TEST_KEYS.includes(key as TestKey));

  const completedSet = new Set(completedTests);
  const testsComplete = TEST_KEYS.every((key) => completedSet.has(key));
  const personalBotReady = !!user.personalBotReadyAt && !!user.personalBotPrompt?.trim();
  const canProceed = testsComplete && personalBotReady;

  let nextStep: OnboardingStep = "complete";
  let nextPath = getParticipantHomePath(user.role as ParticipantRole);

  if (!user.disclaimerAcceptedAt) {
    if (!user.welcomeSeenAt) {
      nextStep = "welcome";
      nextPath = "/onboarding/welcome";
    } else {
      nextStep = "consent";
      nextPath = "/onboarding/consent";
    }
  } else if (!canProceed || !user.onboardingCompletedAt) {
    nextStep = "tests";
    nextPath = "/onboarding/tests";
  }

  return {
    welcomeSeenAt: user.welcomeSeenAt,
    disclaimerAcceptedAt: user.disclaimerAcceptedAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    completedTests,
    testsComplete,
    personalBotReady,
    canProceed,
    nextStep,
    nextPath,
  };
}

export function getParticipantHomePath(role: ParticipantRole) {
  if (role === "mediator") return "/mediator/rooms";
  return "/mediation";
}

export async function getParticipantNextPath(userId: string, role: ParticipantRole) {
  if (role === "mediator") return "/mediator/rooms";

  const status = await getUserOnboardingStatus(userId);
  if (status.nextStep !== "complete") {
    return status.nextPath;
  }

  const { getParticipantRoom, listParticipantMemberships } = await import("@/lib/room/helpers");
  const memberships = await listParticipantMemberships(userId);
  if (memberships.length === 0) {
    return "/rooms";
  }
  if (memberships.length > 1) {
    return "/rooms";
  }

  const participant = await getParticipantRoom(userId);
  if (!participant || !hasSubmittedDisputeIntake(participant.user)) {
    return "/dispute-intake";
  }

  return "/mediation";
}

export async function getPostLoginRedirect(userId: string, role: string) {
  if (role === "admin") return "/admin/rooms";
  if (!isParticipantRole(role)) return "/login";
  return getParticipantNextPath(userId, role);
}

export function getOnboardingPathForStep(step: OnboardingStep) {
  switch (step) {
    case "welcome":
      return "/onboarding/welcome";
    case "consent":
      return "/onboarding/consent";
    case "tests":
      return "/onboarding/tests";
    case "complete":
      return "/dashboard"; // callers should use getParticipantHomePath(role) when role is known
  }
}

export function canAccessOnboardingStep(
  status: OnboardingStatus,
  step: Exclude<OnboardingStep, "complete">,
) {
  if (step === "welcome") return !status.welcomeSeenAt;
  if (step === "consent") return !!status.welcomeSeenAt && !status.disclaimerAcceptedAt;
  if (step === "tests") {
    return !!status.welcomeSeenAt && !!status.disclaimerAcceptedAt && !status.onboardingCompletedAt;
  }
  return false;
}

export function getTestStatuses(completedTests: TestKey[]) {
  const completedSet = new Set(completedTests);
  return TEST_KEYS.map((key) => ({
    key,
    completed: completedSet.has(key),
  }));
}
