import type { Locale } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/pipeline/locale";
import {
  chatTemperature,
  getOpenAIChatModel,
  getOpenAIClient,
} from "@/lib/pipeline/openai-client";

/**
 * Rewrite a participant draft more clearly and without insults,
 * without changing meaning or adding new content.
 */
export async function helpFormulateText(params: {
  draft: string;
  locale: Locale;
}): Promise<string> {
  const draft = params.draft.trim();
  if (!draft) return "";

  const locale = normalizeLocale(params.locale);
  const languageLock =
    locale === "uk"
      ? "Write the rewritten text entirely in Ukrainian (українська)."
      : "Write the rewritten text entirely in English.";

  const client = await getOpenAIClient();
  const model = await getOpenAIChatModel();
  const completion = await client.chat.completions.create({
    model,
    ...chatTemperature(model, 0.2),
    messages: [
      {
        role: "system",
        content: [
          "You help mediation participants phrase their replies.",
          "Rewrite the user's draft so it is clearer and free of insults or personal attacks.",
          "Keep the same meaning and intent. Do not add facts, offers, or legal advice.",
          "Do not invent content the user did not say.",
          "Do not wrap the reply in quotes or add commentary.",
          "Reply with ONLY the rewritten message.",
          languageLock,
        ].join("\n"),
      },
      { role: "user", content: draft },
    ],
  });

  const rewritten = completion.choices[0]?.message?.content?.trim();
  return rewritten || draft;
}
