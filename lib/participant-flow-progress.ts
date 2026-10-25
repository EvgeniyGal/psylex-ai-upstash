import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";

export async function getParticipantFlowProgressForUser(
  userId: string,
): Promise<ParticipantFlowStepId> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return 0;

  let maxReached: ParticipantFlowStepId = 0;

  if (user.welcomeSeenAt) {
    maxReached = 0;
  }
  if (user.disclaimerAcceptedAt) {
    maxReached = 1;
  }
  if (user.onboardingCompletedAt && user.personalBotReadyAt) {
    maxReached = 2;
  }

  // Intake is per room membership; fall back to legacy users column.
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  const intakeSubmitted = participant
    ? hasSubmittedDisputeIntake(participant.user)
    : hasSubmittedDisputeIntake(user);
  if (intakeSubmitted) {
    maxReached = 3;
  }

  const roomId = participant?.roomId ?? user.roomId;
  if (roomId) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (room?.mediationStartedAt) {
      maxReached = 4;
    }
    if (room?.mediationPhase === "completed") {
      maxReached = 5;
    }
  }

  return maxReached;
}
