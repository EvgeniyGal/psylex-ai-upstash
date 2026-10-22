"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import {
  getMediatorHandshakeForParty,
  tryFinalizeMediatorSession,
} from "@/lib/mediator-session/handshake";
import {
  getMediatorSessionRoomState,
  submitMediatorPartyReply,
} from "@/lib/mediator-session/orchestrator";
import { acceptAgreement } from "@/lib/mediation/orchestrator";
import { buildAgreementDownloadFromSummary } from "@/lib/mediation/pdf";
import { isPartyRole } from "@/lib/participant-roles";
import type { PartyNotification } from "@/lib/mediator-session/types";

async function requirePartyUserId() {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;
  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }
  if (!userId || !session?.user?.role || !isPartyRole(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getMediatorPartyHandshakeAction() {
  const userId = await requirePartyUserId();
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) return null;

  await tryFinalizeMediatorSession(participant.roomId);
  const handshake = await getMediatorHandshakeForParty(userId);
  if (!handshake) return null;

  const [room] = await db
    .select({ partyNotification: rooms.partyNotification })
    .from(rooms)
    .where(eq(rooms.id, participant.roomId))
    .limit(1);

  return {
    ...handshake,
    partyNotification: (room?.partyNotification as PartyNotification | null) ?? null,
  };
}

export async function clickMediatorPartyStartMediation() {
  const userId = await requirePartyUserId();
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) {
    throw new Error("Unauthorized");
  }

  const { recordMediatorStartClick } = await import("@/lib/mediator-session/handshake");
  await recordMediatorStartClick(participant.roomId, participant.user.role);
  return getMediatorPartyHandshakeAction();
}

export async function fetchMediatorPartyRoomState() {
  const userId = await requirePartyUserId();
  return getMediatorSessionRoomState(userId);
}

export async function sendMediatorPartyReply(content: string) {
  const userId = await requirePartyUserId();
  return submitMediatorPartyReply(userId, content);
}

export async function submitMediatorPartyVote(optionId: string) {
  const userId = await requirePartyUserId();
  const { castMediatorPartyVote } = await import("@/lib/mediator-session/orchestrator");
  await castMediatorPartyVote(userId, optionId);
  return getMediatorSessionRoomState(userId);
}

export async function submitMediatorPartyCompromiseVote(accepted: boolean) {
  const userId = await requirePartyUserId();
  const { castMediatorCompromiseVote } = await import("@/lib/mediator-session/orchestrator");
  await castMediatorCompromiseVote(userId, accepted);
  return getMediatorSessionRoomState(userId);
}

export async function submitMediatorPartyAgreement() {
  const userId = await requirePartyUserId();
  await acceptAgreement(userId);
  return getMediatorSessionRoomState(userId);
}

export async function downloadMediatorPartyResults() {
  const userId = await requirePartyUserId();
  const [user] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const state = await getMediatorSessionRoomState(userId);
  if (!state?.resultsSummary || state.room.phase !== "completed") {
    throw new Error("Results are not available yet.");
  }

  const locale = (user?.preferredLocale ?? "en") as Locale;
  return buildAgreementDownloadFromSummary(state.resultsSummary, locale);
}
