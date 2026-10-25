import { redirect } from "next/navigation";
import { PartyMediatorLobby } from "@/components/portal/party-mediator-lobby";
import { MediationLobby } from "@/components/portal/mediation-lobby";
import { getMediationLobbyData, hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { resolveMediationLobbyFlowStep } from "@/lib/participant-flow";
import { requireParticipantSession } from "@/lib/portal-auth";
import { isPartyRole } from "@/lib/participant-roles";
import { getMediatorHandshakeForParty } from "@/lib/mediator-session/handshake";
import { isMediatorFacilitatedRoom } from "@/lib/mediator-session/room-mode";

export const dynamic = "force-dynamic";

export default async function MediationPage() {
  const { userId, role } = await requireParticipantSession();

  if (!isPartyRole(role)) {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);
  if (!status.canProceed || !status.onboardingCompletedAt) {
    redirect("/onboarding/tests");
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
  if (!lobby) {
    redirect("/onboarding/tests");
  }

  if (lobby.room.mediationStartedAt) {
    redirect("/room");
  }

  const flowStep = resolveMediationLobbyFlowStep();

  if (isMediatorFacilitatedRoom(lobby.room)) {
    const handshake = await getMediatorHandshakeForParty(userId);
    if (!handshake) {
      redirect("/onboarding/tests");
    }

    return (
      <PartyMediatorLobby
        bothReady={lobby.bothReady}
        flowStep={flowStep}
        initialHandshake={handshake}
        partyUserIds={[lobby.self.userId, lobby.opposite?.userId].filter(
          (id): id is string => Boolean(id),
        )}
        pipelineRunning={lobby.pipelineRunning}
        roomId={lobby.room.id}
        roomTitle={lobby.room.title}
        viewerRole={role}
      />
    );
  }

  return (
    <MediationLobby
      bothReady={lobby.bothReady}
      canStartMediation={lobby.canStartMediation}
      flowStep={flowStep}
      opposite={lobby.opposite}
      oppositeRole={lobby.oppositeRole}
      pipelineRunning={lobby.pipelineRunning}
      preparingMediationRoom={lobby.preparingMediationRoom}
      roomId={lobby.room.id}
      roomTitle={lobby.room.title}
      self={lobby.self}
      viewerRole={role}
    />
  );
}
