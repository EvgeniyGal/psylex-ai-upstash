import { redirect } from "next/navigation";
import { DisputeIntakeForm } from "@/components/portal/dispute-intake-form";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { isPartyRole } from "@/lib/participant-roles";
import { isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";

type DisputeIntakePageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function DisputeIntakePage({ searchParams }: DisputeIntakePageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { userId, role } = await requireParticipantSession();

  if (!isPartyRole(role)) {
    redirect("/mediator/rooms");
  }

  const { getParticipantRoom, listParticipantMemberships } = await import("@/lib/room/helpers");
  const memberships = await listParticipantMemberships(userId);
  if (memberships.length === 0) {
    redirect("/rooms");
  }

  const participant = await getParticipantRoom(userId);
  if (!participant) redirect("/rooms");

  if (review) {
    if (!hasSubmittedDisputeIntake(participant.user)) {
      redirect("/dispute-intake");
    }

    return (
      <DisputeIntakeForm
        answers={{
          disputeDescription: participant.user.disputeDescription ?? "",
          disputePriority: participant.user.disputePriority ?? "",
          disputeAcceptableOutcome: participant.user.disputeAcceptableOutcome ?? "",
        }}
        review
      />
    );
  }

  const status = await getUserOnboardingStatus(userId);
  if (!status.canProceed || !status.onboardingCompletedAt) {
    redirect("/onboarding/tests");
  }

  if (hasSubmittedDisputeIntake(participant.user)) {
    redirect("/mediation");
  }

  return <DisputeIntakeForm />;
}
