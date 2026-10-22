import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { isPartyRole } from "@/lib/participant-roles";
import { listParticipantMemberships } from "@/lib/room/helpers";
import { PartyRoomsList } from "@/components/portal/party-rooms-list";
import { PortalPageShell } from "@/components/portal/portal-page-shell";

export default async function PartyRoomsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!role || !isPartyRole(role)) {
    redirect("/login");
  }

  const userId = await requireSessionUserId();
  const memberships = await listParticipantMemberships(userId);

  return (
    <PortalPageShell>
      <PartyRoomsList
        rooms={memberships.map(({ membership, room }) => ({
          id: room.id,
          title: room.title,
          partyRole: membership.partyRole,
          phase: room.mediationPhase,
          mediationStartedAt: room.mediationStartedAt?.toISOString() ?? null,
          mediationCompletedAt: room.mediationCompletedAt?.toISOString() ?? null,
          scheduledStartAt: room.scheduledStartAt?.toISOString() ?? null,
          joinedAt: membership.joinedAt.toISOString(),
          intakeSubmitted: !!membership.disputeIntakeSubmittedAt,
        }))}
      />
    </PortalPageShell>
  );
}
