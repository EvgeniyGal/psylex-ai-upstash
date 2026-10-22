import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages, users } from "@/drizzle/schema";
import { resolveAdaptedText } from "@/lib/mediation/assemble-input";
import type { MediationMessageKind, PartyAdaptations } from "@/lib/mediation/types";
import type { Locale } from "@/lib/i18n";
import type { PartyRole } from "@/lib/participant-roles";
import { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";
import {
  ensureMessageTranslations,
  getRoomLocalesForTranslation,
  type MessageTranslations,
} from "@/lib/mediation/translate";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { notifyRoom } from "@/lib/realtime/notify";

export { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";

export type ResolvedMessageView = {
  content: string;
  isTranslated: boolean;
  originalText: string | null;
  sourceLocale: Locale | null;
};

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

async function localeForUser(userId: string): Promise<Locale> {
  const [row] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return normalizeLocale(row?.preferredLocale);
}

export async function insertAgentMessage(params: {
  roomId: string;
  canonicalContent: string;
  adaptations: PartyAdaptations;
  messageKind: MediationMessageKind;
  /** When set, only this participant sees the agent message (caucus). */
  addresseeUserId?: string | null;
  /** shared = both parties; private = caucus to addressee. */
  channel?: "shared" | "private";
  /** Mediator user id when a human mediator authored the message. */
  senderUserId?: string | null;
  /** When a human mediator authored free text, translate for other room locales. */
  sourceLocale?: Locale | null;
}) {
  const channel =
    params.channel ?? (params.addresseeUserId ? "private" : "shared");

  let sourceLocale: Locale | null = params.sourceLocale ?? null;
  let translations: MessageTranslations | null = null;

  if (params.senderUserId) {
    sourceLocale = sourceLocale ?? (await localeForUser(params.senderUserId));
    const needed = await getRoomLocalesForTranslation(params.roomId);
    translations = await ensureMessageTranslations({
      content: params.canonicalContent,
      sourceLocale,
      neededLocales: needed,
    });
  }

  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel,
      senderType: "agent",
      senderUserId: params.senderUserId ?? null,
      content: params.canonicalContent,
      canonicalContent: params.canonicalContent,
      adaptations: params.adaptations,
      sourceLocale,
      translations,
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
  channel?: "shared" | "private";
  sourceLocale?: Locale;
}) {
  const sourceLocale = params.sourceLocale ?? (await localeForUser(params.userId));
  const needed = await getRoomLocalesForTranslation(params.roomId);
  const translations = await ensureMessageTranslations({
    content: params.content,
    sourceLocale,
    neededLocales: needed,
  });

  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: params.channel ?? "shared",
      senderType: "participant",
      senderUserId: params.userId,
      content: params.content,
      sourceLocale,
      translations,
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

export function isSharedBroadcastAgentMessage(message: RoomMessageRow) {
  return (
    message.senderType === "agent" &&
    message.channel === "shared" &&
    !message.participantUserId &&
    (message.messageKind === "mediation_question" ||
      message.messageKind === "mediation_moderation")
  );
}

export function isMessageVisibleToViewer(
  message: RoomMessageRow,
  viewerUserId: string,
  context: {
    allMessages: RoomMessageRow[];
    partyAUserId: string;
    partyBUserId: string;
    includeRoundSummaries?: boolean;
    /** Mode B shared channel: peers see each other's shared replies. */
    shareParticipantReplies?: boolean;
  },
) {
  if (message.senderType === "participant") {
    if (message.channel === "private") {
      return message.senderUserId === viewerUserId;
    }
    if (context.shareParticipantReplies) {
      return true;
    }
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
    if (isSharedBroadcastAgentMessage(message)) {
      return true;
    }
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

function resolveBaseTextForViewer(
  message: typeof roomMessages.$inferSelect,
  viewerRole: PartyRole,
  viewerPreferredLocale?: string | null,
): string {
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

export function resolveMessageViewForViewer(
  message: typeof roomMessages.$inferSelect,
  viewerRole: PartyRole,
  viewerPreferredLocale?: string | null,
): ResolvedMessageView {
  const locale = viewerLocale(viewerPreferredLocale);
  const sourceLocale = message.sourceLocale
    ? normalizeLocale(message.sourceLocale)
    : null;
  const translations = message.translations as MessageTranslations | null;
  const originalText =
    (sourceLocale && translations?.[sourceLocale]) || message.content;

  if (translations) {
    const localized = translations[locale];
    if (localized && sourceLocale && sourceLocale !== locale && localized !== originalText) {
      return {
        content: localized,
        isTranslated: true,
        originalText,
        sourceLocale,
      };
    }
    if (localized) {
      return {
        content: localized,
        isTranslated: false,
        originalText: null,
        sourceLocale,
      };
    }
  }

  return {
    content: resolveBaseTextForViewer(message, viewerRole, viewerPreferredLocale),
    isTranslated: false,
    originalText: null,
    sourceLocale,
  };
}

/** @deprecated Prefer resolveMessageViewForViewer for translation metadata. */
export function resolveMessageForViewer(
  message: typeof roomMessages.$inferSelect,
  viewerRole: PartyRole,
  viewerPreferredLocale?: string | null,
) {
  return resolveMessageViewForViewer(message, viewerRole, viewerPreferredLocale).content;
}

function isQuestionForParty(
  message: RoomMessageRow,
  partyUserId: string,
  messages: RoomMessageRow[],
  partyAUserId: string,
  partyBUserId: string,
) {
  if (message.messageKind !== "mediation_question") return false;
  if (isSharedBroadcastAgentMessage(message)) return true;
  const target = resolveTargetUserId(message, messages, partyAUserId, partyBUserId);
  return target === partyUserId;
}

/** Latest unanswered mediation question for this party, if any. */
export function latestUnansweredQuestionForParty(
  messages: RoomMessageRow[],
  partyUserId: string,
  partyAUserId: string,
  partyBUserId: string,
) {
  const questionsForParty = messages.filter((message) =>
    isQuestionForParty(message, partyUserId, messages, partyAUserId, partyBUserId),
  );
  if (questionsForParty.length === 0) return null;

  const latestQuestion = questionsForParty[questionsForParty.length - 1]!;
  const latestQuestionAt = latestQuestion.createdAt.getTime();
  const answered = messages.some(
    (message) =>
      message.senderType === "participant" &&
      message.senderUserId === partyUserId &&
      message.createdAt.getTime() > latestQuestionAt,
  );
  return answered ? null : latestQuestion;
}

/** True when the party has an unanswered mediation question addressed to them. */
export function partyHasUnansweredQuestion(
  messages: RoomMessageRow[],
  partyUserId: string,
  partyAUserId: string,
  partyBUserId: string,
) {
  return !!latestUnansweredQuestionForParty(
    messages,
    partyUserId,
    partyAUserId,
    partyBUserId,
  );
}
