import type { Locale } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/pipeline/locale";
import {
  chatTemperature,
  getOpenAIChatModel,
  getOpenAIClient,
} from "@/lib/pipeline/openai-client";

const CYRILLIC_RE = /[\u0400-\u04FF]/g;
const LATIN_RE = /[A-Za-z]/g;

/**
 * Fast heuristic: Cyrillic vs Latin letter ratio.
 * Returns null when the signal is weak (short/mixed/no letters).
 */
export function detectMessageLocaleHeuristic(text: string): Locale | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const cyrillic = trimmed.match(CYRILLIC_RE)?.length ?? 0;
  const latin = trimmed.match(LATIN_RE)?.length ?? 0;
  const letters = cyrillic + latin;
  if (letters < 3) return null;

  const cyrillicShare = cyrillic / letters;
  if (cyrillicShare >= 0.55) return "uk";
  if (cyrillicShare <= 0.2) return "en";
  return null;
}

async function detectMessageLocaleWithLlm(text: string): Promise<Locale> {
  try {
    const client = await getOpenAIClient();
    const model = await getOpenAIChatModel();
    const completion = await client.chat.completions.create({
      model,
      ...chatTemperature(model, 0),
      messages: [
        {
          role: "system",
          content:
            'Classify the language of the user message. Reply with only "en" or "uk". Ukrainian and Russian Cyrillic both map to "uk" for this product. English or other Latin-script text maps to "en".',
        },
        { role: "user", content: text.slice(0, 2000) },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    if (raw.includes("uk")) return "uk";
    if (raw.includes("en")) return "en";
  } catch {
    // Fall through to default.
  }
  return "en";
}

/**
 * Detect the language of free-text content.
 * Prefer heuristic; use a short LLM call only when inconclusive.
 * Optional `hint` (e.g. UI locale) is used only when detection is inconclusive and LLM fails.
 */
export async function detectMessageLocale(
  text: string,
  hint?: Locale | null,
): Promise<Locale> {
  const heuristic = detectMessageLocaleHeuristic(text);
  if (heuristic) return heuristic;

  const fromLlm = await detectMessageLocaleWithLlm(text);
  if (fromLlm) return fromLlm;

  return normalizeLocale(hint);
}

export const SUPPORTED_MESSAGE_LOCALES: Locale[] = ["en", "uk"];
