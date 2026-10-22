import type { users as usersTable, rooms as roomsTable } from "@/drizzle/schema";
import { partyRoleLabel } from "@/lib/party-labels";
import type { PartyRole } from "@/lib/participant-roles";
import { formatDisputeIntakeAnswers } from "@/lib/pipeline/assemble-input";
import type {
  EmotionalTriggers,
  InterestsAnalysis,
  LegalAnalysis,
  PsychodynamicProfile,
} from "@/lib/pipeline/schemas";
import { formatRoomJurisdiction } from "@/lib/room/jurisdiction";
import type { MediationMessageKind } from "@/lib/mediation/types";

type UserRow = typeof usersTable.$inferSelect;
type RoomRow = typeof roomsTable.$inferSelect;

export type MediationContext = {
  room: RoomRow;
  partyA: UserRow;
  partyB: UserRow;
  dialogueTranscript: string;
};

function profileBlock(user: UserRow, profile: PsychodynamicProfile | null) {
  return [
    `Psychodynamic profile (${user.preferredLocale}):`,
    profile ? JSON.stringify(profile, null, 2) : "(not available)",
  ].join("\n");
}

function triggersBlock(user: UserRow, triggers: EmotionalTriggers | null) {
  return [
    `Emotional triggers (${user.preferredLocale}):`,
    triggers ? JSON.stringify(triggers, null, 2) : "(not available)",
  ].join("\n");
}

export function assembleMediationContext(params: {
  room: RoomRow;
  partyA: UserRow;
  partyB: UserRow;
  messages: Array<{
    content: string;
    senderType: string;
    messageKind: string | null;
    createdAt: Date;
  }>;
}): MediationContext {
  const dialogueTranscript = params.messages
    .map((message) => {
      const kind = message.messageKind ?? message.senderType;
      return `[${message.createdAt.toISOString()}] (${kind}) ${message.content}`;
    })
    .join("\n");

  return {
    room: params.room,
    partyA: params.partyA,
    partyB: params.partyB,
    dialogueTranscript,
  };
}

export function assembleMediationAgentInput(ctx: MediationContext, extra?: string) {
  const interests = ctx.room.interestsAnalysis as InterestsAnalysis | null;
  const legal = ctx.room.legalAnalysis as LegalAnalysis | null;
  const partyAProfile = ctx.partyA.psychodynamicProfile as PsychodynamicProfile | null;
  const partyBProfile = ctx.partyB.psychodynamicProfile as PsychodynamicProfile | null;
  const partyATriggers = ctx.partyA.emotionalTriggers as EmotionalTriggers | null;
  const partyBTriggers = ctx.partyB.emotionalTriggers as EmotionalTriggers | null;

  return [
    `Jurisdiction: ${formatRoomJurisdiction(ctx.room, ctx.partyA.preferredLocale)}`,
    "",
    "=== PRIMARY: Live dialogue transcript (prefer this over intake) ===",
    ctx.dialogueTranscript || "(none yet)",
    "",
    "=== BACKGROUND ONLY: Intake answers (use only if restated or needed for context) ===",
    formatDisputeIntakeAnswers(ctx.partyA, partyRoleLabel("party_a", ctx.partyA.preferredLocale)),
    "",
    formatDisputeIntakeAnswers(ctx.partyB, partyRoleLabel("party_b", ctx.partyB.preferredLocale)),
    "",
    profileBlock(ctx.partyA, partyAProfile),
    "",
    profileBlock(ctx.partyB, partyBProfile),
    "",
    triggersBlock(ctx.partyA, partyATriggers),
    "",
    triggersBlock(ctx.partyB, partyBTriggers),
    "",
    "Interests analysis:",
    interests ? JSON.stringify(interests, null, 2) : "(not available)",
    "",
    "Legal analysis (information only, not advice):",
    legal ? JSON.stringify(legal, null, 2) : "(not available)",
    extra ? `\n${extra}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function partyRoleFromUser(user: UserRow): PartyRole {
  if (user.role !== "party_a" && user.role !== "party_b") {
    throw new Error("Expected party participant.");
  }
  return user.role;
}

export function adaptationKeyForRole(role: PartyRole): "party_a" | "party_b" {
  return role;
}

export function resolveAdaptedText(
  adaptations: { party_a?: string; party_b?: string } | null | undefined,
  canonical: string,
  viewerRole: PartyRole,
) {
  const key = adaptationKeyForRole(viewerRole);
  return adaptations?.[key] ?? canonical;
}

export function isAttackHeuristic(text: string) {
  const lowered = text.toLowerCase();
  const patterns = [
    /\byou (are|were) (stupid|idiot|liar|pathetic|worthless|garbage)\b/,
    /\b(i hate you|you disgust)\b/,
    /\b(shut up|go to hell)\b/,
  ];
  return patterns.some((pattern) => pattern.test(lowered));
}

export function mediationKindLabel(kind: MediationMessageKind | null) {
  if (!kind) return "message";
  return kind.replace(/^mediation_/, "").replace(/_/g, " ");
}
