import type { Locale } from "@/lib/i18n";
import {
  detectMessageLocale,
  detectMessageLocaleHeuristic,
  SUPPORTED_MESSAGE_LOCALES,
} from "@/lib/mediation/detect-locale";
import { normalizeLocale } from "@/lib/pipeline/locale";
import {
  chatTemperature,
  getOpenAIChatModel,
  getOpenAIClient,
} from "@/lib/pipeline/openai-client";

export type MessageTranslations = Partial<Record<Locale, string>>;

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  uk: "Ukrainian (українська)",
};

export { SUPPORTED_MESSAGE_LOCALES };

export async function translateText(params: {
  text: string;
  from: Locale;
  to: Locale;
}): Promise<string> {
  if (params.from === params.to) return params.text;
  const trimmed = params.text.trim();
  if (!trimmed) return params.text;

  const client = await getOpenAIClient();
  const model = await getOpenAIChatModel();
  const completion = await client.chat.completions.create({
    model,
    ...chatTemperature(model, 0),
    messages: [
      {
        role: "system",
        content: [
          "You are a precise translator for a mediation platform.",
          "Translate the user message faithfully.",
          "Preserve meaning, tone, and proper names.",
          "Do not add explanations, quotes, or commentary.",
          `Source language: ${LOCALE_LABEL[params.from]}.`,
          `Target language: ${LOCALE_LABEL[params.to]}.`,
          `Reply with ONLY the translation in ${LOCALE_LABEL[params.to]}.`,
        ].join("\n"),
      },
      { role: "user", content: trimmed },
    ],
  });

  const translated = completion.choices[0]?.message?.content?.trim();
  return translated || params.text;
}

export async function ensureMessageTranslations(params: {
  content: string;
  sourceLocale: Locale;
  neededLocales: Locale[];
}): Promise<MessageTranslations> {
  const source = normalizeLocale(params.sourceLocale);
  const translations: MessageTranslations = { [source]: params.content };
  const uniqueNeeded = [...new Set(params.neededLocales.map(normalizeLocale))];

  await Promise.all(
    uniqueNeeded
      .filter((locale) => locale !== source)
      .map(async (locale) => {
        translations[locale] = await translateText({
          text: params.content,
          from: source,
          to: locale,
        });
      }),
  );

  return translations;
}

/** Always produce both `en` and `uk` keys for free-text storage. */
export async function ensureBilingualTranslations(params: {
  content: string;
  sourceLocale: Locale;
}): Promise<MessageTranslations> {
  return ensureMessageTranslations({
    content: params.content,
    sourceLocale: params.sourceLocale,
    neededLocales: SUPPORTED_MESSAGE_LOCALES,
  });
}

/**
 * Detect language, then always fill en+uk translations.
 * `hint` is only used when detection is inconclusive.
 */
export async function bilingualTranslationsFromContent(params: {
  content: string;
  hint?: Locale | null;
}): Promise<{ sourceLocale: Locale; translations: MessageTranslations }> {
  const sourceLocale = await detectMessageLocale(params.content, params.hint);
  const translations = await ensureBilingualTranslations({
    content: params.content,
    sourceLocale,
  });
  return { sourceLocale, translations };
}

/** Re-translate a string when heuristic says it is not in the target locale. */
export async function repairTextLocale(
  text: string,
  targetLocale: Locale,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const detected = detectMessageLocaleHeuristic(trimmed);
  if (!detected || detected === targetLocale) return text;
  return translateText({ text: trimmed, from: detected, to: targetLocale });
}

/** Collect preferred locales for parties (+ optional mediator) in a room. */
export async function getRoomLocalesForTranslation(roomId: string): Promise<Locale[]> {
  const { getRoomSides } = await import("@/lib/room/helpers");
  const { db } = await import("@/lib/db");
  const { rooms, users } = await import("@/drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const sides = await getRoomSides(roomId);
  const locales = new Set<Locale>(
    sides.map((side) => normalizeLocale(side.preferredLocale)),
  );

  const [room] = await db
    .select({ createdByUserId: rooms.createdByUserId })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (room?.createdByUserId) {
    const [mediator] = await db
      .select({ preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, room.createdByUserId))
      .limit(1);
    if (mediator) locales.add(normalizeLocale(mediator.preferredLocale));
  }

  return [...locales];
}
