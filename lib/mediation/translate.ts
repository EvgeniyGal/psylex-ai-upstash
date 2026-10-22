import type { Locale } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { getOpenAIChatModel, getOpenAIClient } from "@/lib/pipeline/openai-client";

export type MessageTranslations = Partial<Record<Locale, string>>;

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  uk: "Ukrainian (українська)",
};

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
    temperature: 0,
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
