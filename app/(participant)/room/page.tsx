import { redirect } from "next/navigation";
import { RoomExperience } from "@/components/portal/room/room-experience";
import { MediatorPartyRoom } from "@/components/portal/room/mediator-party-room";
import { fetchMediationRoomState } from "@/app/(participant)/room/actions";
import { getMediationLobbyData, hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";
import { isPartyRole } from "@/lib/participant-roles";
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";
import { getMediatorSessionRoomState } from "@/lib/mediator-session/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RoomPageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function RoomPage({ searchParams }: RoomPageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { userId, role } = await requireParticipantSession();

  if (role === "mediator") {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);

  if (!status.onboardingCompletedAt || !status.personalBotReady) {
    redirect(status.nextPath);
  }

  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) {
    redirect("/rooms");
  }

  // Intake lives on room_participants (merged into participant.user), not users.
  if (!hasSubmittedDisputeIntake(participant.user)) {
    redirect("/dispute-intake");
  }

  const lobby = await getMediationLobbyData(userId);
  if (!lobby?.room.mediationStartedAt) {
    redirect("/mediation");
  }

  if (isMediatorFacilitatedRoom(lobby.room) && isPartyRole(role)) {
    const mediationState = await getMediatorSessionRoomState(userId);
    if (!mediationState) {
      redirect("/mediation");
    }
    return (
      <MediatorPartyRoom
        initialState={mediationState}
        review={review}
        viewerRole={role}
      />
    );
  }

  const mediationState = await fetchMediationRoomState();

  return (
    <RoomExperience
      mediationState={mediationState}
      review={review}
      roomId={lobby.room.id}
      roomTitle={lobby.room.title}
    />
  );
}
