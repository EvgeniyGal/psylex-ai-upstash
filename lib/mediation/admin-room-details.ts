import { eq } from "drizzle-orm";
import type { Locale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { formatPartyPsychodynamicProfiles } from "@/lib/mediation/format-pdf-content";
import { listRoomMessages, resolveMessageForViewer, isMessageVisibleToViewer } from "@/lib/mediation/messages";
import {
  buildMediationResultsSummary,
  type MediationResultsSummary,
} from "@/lib/mediation/results-summary";
import { resolveOptionForLocale } from "@/lib/mediation/localize-artifacts";
import type { getMediationRoomState } from "@/lib/mediation/orchestrator";
import type { MediationOption } from "@/lib/mediation/types";
import { partyRoleLabel } from "@/lib/party-labels";
import type { PartyRole } from "@/lib/participant-roles";
import { getRoomPartiesForPipeline } from "@/lib/pipeline/gate";
import { portalCopy } from "@/lib/portal-i18n";

type MediationState = NonNullable<Awaited<ReturnType<typeof getMediationRoomState>>>;

export type AdminMediationMessageView = {
  id: string;
  senderType: "participant" | "agent" | "system";
  senderLabel: string;
  content: string;
  createdAt: Date;
  messageKind: string | null;
};

export type AdminMediationOptionView = {
  id: string;
  partyADescription: string;
  partyBDescription: string;
  legalNorms: string;
  fulfillmentProbability: string;
  refusalRisks: string;
};

export type AdminMediationDetails = {
  available: true;
  phase: string | null;
  partyATitle: string;
  partyBTitle: string;
  partyAMessages: AdminMediationMessageView[];
  partyBMessages: AdminMediationMessageView[];
  options: AdminMediationOptionView[];
  partyAVoteOptionId: string | null;
  partyBVoteOptionId: string | null;
  selectedOptionId: string | null;
  compromise: AdminMediationOptionView | null;
  partyACompromiseVote: boolean | null;
  partyBCompromiseVote: boolean | null;
  resultsSummary: MediationResultsSummary | null;
};

function mapOption(option: MediationOption, locale: Locale): AdminMediationOptionView {
  const resolved = resolveOptionForLocale(option, locale);
  return {
    id: option.id,
    partyADescription: resolved.partyA,
    partyBDescription: resolved.partyB,
    legalNorms: resolved.legalNorms,
    fulfillmentProbability: resolved.fulfillmentProbability,
    refusalRisks: resolved.refusalRisks,
  };
}

function buildPartyMessages(
  messages: Awaited<ReturnType<typeof listRoomMessages>>,
  role: PartyRole,
  partyUserId: string,
  partyAUserId: string,
  partyBUserId: string,
  preferredLocale: string | null,
  labels: { party: string; agent: string; system: string },
): AdminMediationMessageView[] {
  const thread: AdminMediationMessageView[] = [];
  const visibilityContext = {
    allMessages: messages,
    partyAUserId,
    partyBUserId,
    includeRoundSummaries: true,
  };

  for (const message of messages) {
    if (
      !isMessageVisibleToViewer(message, partyUserId, visibilityContext)
    ) {
      continue;
    }

    if (message.senderType === "participant") {
      thread.push({
        id: message.id,
        senderType: "participant",
        senderLabel: labels.party,
        content: message.content,
        createdAt: message.createdAt,
        messageKind: message.messageKind,
      });
      continue;
    }

    thread.push({
      id: `${message.id}-${role}`,
      senderType: message.senderType === "agent" ? "agent" : "system",
      senderLabel: message.senderType === "agent" ? labels.agent : labels.system,
      content: resolveMessageForViewer(message, role, preferredLocale),
      createdAt: message.createdAt,
      messageKind: message.messageKind,
    });
  }

  return thread;
}

function buildAdminMediationState(
  room: typeof rooms.$inferSelect,
  options: MediationOption[],
  compromise: MediationOption | null,
  locale: Locale,
): MediationState {
  const mapOptionForState = (option: MediationOption) => {
    const resolved = resolveOptionForLocale(option, locale);
    return {
      id: option.id,
      description: resolved.partyA,
      legalNorms: resolved.legalNorms,
      fulfillmentProbability: resolved.fulfillmentProbability,
      refusalRisks: resolved.refusalRisks,
      canonicalDescription: resolved.canonicalDescription,
    };
  };

  return {
    room: {
      id: room.id,
      title: room.title,
      phase: room.mediationPhase,
      round: room.mediationRound,
      activeParty: room.mediationActiveParty,
      isAwaitingAgent:
        room.mediationPhase === "generating_options" ||
        (room.mediationPhase === "dialogue" && !room.mediationActiveParty) ||
        (room.mediationPhase === "agreement" && !room.draftAgreement) ||
        (room.mediationPhase === "voting_discrepancy" && !room.compromiseOption),
      turnDeadlineAt: room.mediationTurnDeadlineAt?.toISOString() ?? null,
      mediationStartedAt: room.mediationStartedAt!.toISOString(),
      mediationDurationMinutes: room.mediationDurationMinutes,
      selfReady: !!room.partyAReadyForOptionsAt,
      otherReady: !!room.partyBReadyForOptionsAt,
      selfVote: room.partyAVoteOptionId,
      otherVote: room.partyBVoteOptionId,
      partyAVoteOptionId: room.partyAVoteOptionId,
      partyBVoteOptionId: room.partyBVoteOptionId,
      partyACompromiseVote: room.partyACompromiseVote,
      partyBCompromiseVote: room.partyBCompromiseVote,
      selfCompromiseVote: room.partyACompromiseVote,
      selfAccepted: !!room.partyAAgreementAcceptedAt,
      otherAccepted: !!room.partyBAgreementAcceptedAt,
      selectedOptionId: room.selectedOptionId,
      draftAgreement: (room.draftAgreement as MediationState["room"]["draftAgreement"]) ?? null,
    },
    viewerRole: "party_a",
    messages: [],
    options: options.map(mapOptionForState),
    compromise: compromise ? mapOptionForState(compromise) : null,
  };
}

function enhanceAdminResultsSummary(
  summary: MediationResultsSummary,
  room: typeof rooms.$inferSelect,
  options: MediationOption[],
  compromise: MediationOption | null,
  partyA: NonNullable<Awaited<ReturnType<typeof getRoomPartiesForPipeline>>["partyA"]>,
  partyB: NonNullable<Awaited<ReturnType<typeof getRoomPartiesForPipeline>>["partyB"]>,
  locale: Locale,
) {
  summary.psychodynamicProfile = formatPartyPsychodynamicProfiles(partyA, partyB, locale);

  const selectedId = room.selectedOptionId;
  const selected =
    options.find((option) => option.id === selectedId) ??
    (compromise && compromise.id === selectedId ? compromise : null);

  if (!selected) return summary;

  const resolved = resolveOptionForLocale(selected, locale);
  const copy = portalCopy[locale];
  const solutionParts = [
    `${partyRoleLabel("party_a", locale)}: ${resolved.partyA}`,
    `${partyRoleLabel("party_b", locale)}: ${resolved.partyB}`,
    `${copy.mediationFulfillment}: ${resolved.fulfillmentProbability}`,
    `${copy.mediationRefusalRisks}: ${resolved.refusalRisks}`,
  ];

  summary.solution = solutionParts.join("\n\n");
  return summary;
}

export async function getAdminMediationDetails(
  roomId: string,
  uiLocale?: Locale,
): Promise<AdminMediationDetails | null> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room?.mediationStartedAt) return null;

  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  if (!partyA || !partyB) return null;

  const locale: Locale =
    uiLocale ??
    (partyA.preferredLocale === "uk" || partyB.preferredLocale === "uk" ? "uk" : "en");

  const messages = await listRoomMessages(roomId);
  const options = (room.mediationOptions as MediationOption[] | null) ?? [];
  const compromise = room.compromiseOption as MediationOption | null;
  const copy = portalCopy[locale];

  const partyAMessages = buildPartyMessages(
    messages,
    "party_a",
    partyA.id,
    partyA.id,
    partyB.id,
    partyA.preferredLocale,
    {
      party: partyRoleLabel("party_a", locale),
      agent: copy.mediationAgent,
      system: copy.mediationSystem,
    },
  );
  const partyBMessages = buildPartyMessages(
    messages,
    "party_b",
    partyB.id,
    partyA.id,
    partyB.id,
    partyB.preferredLocale,
    {
      party: partyRoleLabel("party_b", locale),
      agent: copy.mediationAgent,
      system: copy.mediationSystem,
    },
  );

  let resultsSummary: MediationResultsSummary | null = null;
  if (room.mediationPhase === "completed") {
    const state = buildAdminMediationState(room, options, compromise, locale);
    const summary = await buildMediationResultsSummary(state, locale);
    resultsSummary = enhanceAdminResultsSummary(
      summary,
      room,
      options,
      compromise,
      partyA,
      partyB,
      locale,
    );
  }

  return {
    available: true,
    phase: room.mediationPhase,
    partyATitle: partyA.title,
    partyBTitle: partyB.title,
    partyAMessages,
    partyBMessages,
    options: options.map((option) => mapOption(option, locale)),
    partyAVoteOptionId: room.partyAVoteOptionId,
    partyBVoteOptionId: room.partyBVoteOptionId,
    selectedOptionId: room.selectedOptionId,
    compromise: compromise ? mapOption(compromise, locale) : null,
    partyACompromiseVote: room.partyACompromiseVote,
    partyBCompromiseVote: room.partyBCompromiseVote,
    resultsSummary,
  };
}

export async function buildAdminMediationDownload(roomId: string, locale: Locale = "en") {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room?.mediationStartedAt) throw new Error("Mediation has not started.");

  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  if (!partyA || !partyB) throw new Error("Room parties missing.");

  const options = (room.mediationOptions as MediationOption[] | null) ?? [];
  const compromise = room.compromiseOption as MediationOption | null;
  const state = buildAdminMediationState(room, options, compromise, locale);
  const summary = enhanceAdminResultsSummary(
    await buildMediationResultsSummary(state, locale),
    room,
    options,
    compromise,
    partyA,
    partyB,
    locale,
  );

  return { state, summary };
}
