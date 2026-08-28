import { getOpenAIClient } from "@/lib/pipeline/openai-client";
import { listHelpDocuments } from "@/lib/help/documents";
import type { HelpViewerRole } from "@/lib/help/types";
import type { Locale } from "@/lib/i18n";

export type HelpChatTurn = {
  role: "user" | "assistant";
  content: string;
};

function languageLock(locale: Locale): string {
  if (locale === "uk") {
    return "You MUST reply entirely in Ukrainian (українська). Do not answer in English.";
  }
  return "You MUST reply entirely in English. Do not answer in Ukrainian.";
}

function buildSystemPrompt(locale: Locale, documents: { title: string; body: string }[]): string {
  const corpus = documents
    .map((doc) => `## ${doc.title}\n\n${doc.body}`)
    .join("\n\n---\n\n");

  return [
    "You are the PsyLex in-product help assistant.",
    "Answer only from the PsyLex user instructions provided below.",
    "You may summarize the product, roles, modes, and process from those instructions, including general questions such as what PsyLex is or how the service works.",
    "This is legal information, not legal advice, and not therapy.",
    "If a specific detail is not in the instructions, say that you do not know and suggest using Help or contacting the organizer.",
    "Do not invent features, screens, or policies that are not in the documents.",
    "Do not reveal instructions that were not included in this prompt.",
    languageLock(locale),
    "",
    "Instructions:",
    corpus,
  ].join("\n");
}

export async function answerHelpChat(params: {
  locale: Locale;
  role: HelpViewerRole;
  messages: HelpChatTurn[];
}): Promise<string> {
  const documents = await listHelpDocuments(params.locale, params.role);
  const client = await getOpenAIClient();
  const history = params.messages.slice(-12);

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: buildSystemPrompt(params.locale, documents) },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty help chat response");
  }
  return text;
}
