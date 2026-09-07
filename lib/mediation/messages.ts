import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages } from "@/drizzle/schema";
import { resolveAdaptedText } from "@/lib/mediation/assemble-input";
import type { MediationMessageKind, PartyAdaptations } from "@/lib/mediation/types";
import type { Locale } from "@/lib/i18n";
import type { PartyRole } from "@/lib/participant-roles";
import { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";
import { notifyRoom } from "@/lib/realtime/notify";

export { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";

export async function listRoomMessages(roomId: string) {
  return db
    .select()
    .from(roomMessages)
    .where(eq(roomMessages.roomId, roomId))
    .orderBy(asc(roomMessages.createdAt));
}

export async function hasMessageKindInRoom(roomId: string, messageKind: string) {
  const [row] = await db
    .select({ id: roomMessages.id })
    .from(roomMessages)
    .where(and(eq(roomMessages.roomId, roomId), eq(roomMessages.messageKind, messageKind)))
    .limit(1);
  return Boolean(row);
}

export function dedupeConsecutiveViewerMessages<
  T extends { senderType: string; messageKind: string | null; content: string },
>(messages: T[]): T[] {
  const result: T[] = [];
  for (const message of messages) {
    const prev = result[result.length - 1];
    if (
      prev &&
      prev.senderType === message.senderType &&
      prev.messageKind === message.messageKind &&
      prev.content === message.content
    ) {
      continue;
    }
    result.push(message);
  }
  return result;
}

export function toPartyAdaptations(payload: {
  canonicalContent: string;
  partyA: string;
  partyB: string;
}): PartyAdaptations {
  return {
    party_a: payload.partyA,
    party_b: payload.partyB,
  };
}

export async function insertAgentMessage(params: {
  roomId: string;
  canonicalContent: string;
  adaptations: PartyAdaptations;
  messageKind: MediationMessageKind;
  /** When set, only this participant sees the agent message (e.g. dialogue questions). */
  addresseeUserId?: string | null;
}) {
  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: "shared",
      senderType: "agent",
      content: params.canonicalContent,
      canonicalContent: params.canonicalContent,
      adaptations: params.adaptations,
      messageKind: params.messageKind,
      participantUserId: params.addresseeUserId ?? null,
    })
    .returning();
  notifyRoom(params.roomId);
  return row;
}

export async function insertParticipantMessage(params: {
  roomId: string;
  userId: string;
  content: string;
}) {
  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: "shared",
      senderType: "participant",
      senderUserId: params.userId,
      content: params.content,
    })
    .returning();
  notifyRoom(params.roomId);
  return row;
}

export async function insertSystemMessage(params: {
  roomId: string;
  content: string;
  canonicalContent?: string;
  adaptations?: PartyAdaptations;
}) {
  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: "shared",
      senderType: "system",
      content: params.content,
      canonicalContent: params.canonicalContent ?? null,
      adaptations: params.adaptations ?? null,
      messageKind: "mediation_system",
    })
    .returning();
  notifyRoom(params.roomId);
  return row;
}

function viewerLocale(value: string | null | undefined): Locale {
  return value === "uk" ? "uk" : "en";
}

function shouldFallbackToCanonicalForEnglish(params: {
  adapted: string;
  canonical: string;
  preferredLocale?: string | null;
}) {
  if (params.preferredLocale !== "en") return false;

  const adapted = params.adapted.toLowerCase();
  if (!adapted.trim()) return true;

  // Guard against occasional Romance-language drift in model adaptations.
  const romanceSignals = [
    /\b(la|el|los|las|una|unos|del|que|por|para|con|sin)\b/g,
    /\b(parte|ronda|mediaci[oó]n|comunidad|cumplimiento|acuerdo)\b/g,
    /[áéíóúñçàèìòù]/g,
  ];
  const signalCount = romanceSignals.reduce(
    (count, pattern) => count + ((adapted.match(pattern) ?? []).length > 0 ? 1 : 0),
    0,
  );

  if (signalCount < 2) return false;
  return params.canonical.trim().length > 0;
}

type RoomMessageRow = typeof roomMessages.$inferSelect;

function inferQuestionAddresseeUserId(
  message: RoomMessageRow,
  allMessages: RoomMessageRow[],
  partyAUserId: string,
  partyBUserId: string,
) {
  if (message.messageKind !== "mediation_question") return null;

  const questions = allMessages.filter(
    (row) =>
      row.messageKind === "mediation_question" &&
      row.createdAt.getTime() <= message.createdAt.getTime(),
  );
  const index = questions.findIndex((row) => row.id === message.id);
  if (index < 0) return null;

  return index % 2 === 0 ? partyAUserId : partyBUserId;
}

function resolveTargetUserId(
  message: RoomMessageRow,
  allMessages: RoomMessageRow[],
  partyAUserId: string,
  partyBUserId: string,
) {
  if (message.participantUserId) return message.participantUserId;
  return inferQuestionAddresseeUserId(message, allMessages, partyAUserId, partyBUserId);
}

export function resolveAgentMessageTargetUserId(
  message: RoomMessageRow,
  allMessages: RoomMessageRow[],
  partyAUserId: string,
  partyBUserId: string,
) {
  return resolveTargetUserId(message, allMessages, partyAUserId, partyBUserId);
}

export function isMessageVisibleToViewer(
  message: RoomMessageRow,
  viewerUserId: string,
  context: {
    allMessages: RoomMessageRow[];
    partyAUserId: string;
    partyBUserId: string;
    includeRoundSummaries?: boolean;
  },
) {
  if (message.senderType === "participant") {
    return message.senderUserId === viewerUserId;
  }

  if (message.senderType === "system") {
    return true;
  }

  if (message.senderType !== "agent") {
    return false;
  }

  const kind = message.messageKind;
  if (kind === "mediation_opening" || kind === "mediation_system") {
    return true;
  }

  if (kind === "mediation_summary") {
    return !!context.includeRoundSummaries;
  }

  if (kind === "mediation_question" || kind === "mediation_moderation") {
    const targetUserId = resolveTargetUserId(
      message,
      context.allMessages,
      context.partyAUserId,
      context.partyBUserId,
    );
    return targetUserId === viewerUserId;
  }

  return true;
}

export function resolveMessageForViewer(
  message: typeof roomMessages.$inferSelect,
  viewerRole: PartyRole,
  viewerPreferredLocale?: string | null,
) {
  if (message.adaptations && message.canonicalContent) {
    const adapted = resolveAdaptedText(
      message.adaptations as PartyAdaptations,
      message.canonicalContent,
      viewerRole,
    );
    if (
      shouldFallbackToCanonicalForEnglish({
        adapted,
        canonical: message.canonicalContent,
        preferredLocale: viewerPreferredLocale,
      })
    ) {
      return message.canonicalContent;
    }
    return adapted;
  }
  if (message.messageKind === "mediation_system" && viewerPreferredLocale) {
    return resolveLocalizedSystemMessage(
      message.canonicalContent ?? message.content,
      viewerLocale(viewerPreferredLocale),
    );
  }
  return message.content;
}

/** True when the party has an unanswered mediation question addressed to them. */
export function partyHasUnansweredQuestion(
  messages: RoomMessageRow[],
  partyUserId: string,
  partyAUserId: string,
  partyBUserId: string,
) {
  const questionsForParty = messages.filter((message) => {
    if (message.messageKind !== "mediation_question") return false;
    const target = resolveTargetUserId(message, messages, partyAUserId, partyBUserId);
    return target === partyUserId;
  });
  if (questionsForParty.length === 0) return false;

  const latestQuestion = questionsForParty[questionsForParty.length - 1]!;
  const latestQuestionAt = latestQuestion.createdAt.getTime();

  return !messages.some(
    (message) =>
      message.senderType === "participant" &&
      message.senderUserId === partyUserId &&
      message.createdAt.getTime() > latestQuestionAt,
  );
}
