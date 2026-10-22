import type { Locale } from "@/lib/i18n";
import { getOpenAIChatModel, getOpenAIClient } from "@/lib/pipeline/openai-client";
import { RAG_DEFAULTS, RAG_INQUIRY_NOT_FOUND } from "@/lib/rag/config";
import { prepareLegalSearch } from "@/lib/rag/prepare-search";
import { searchLegalCorpusWithFallback } from "@/lib/rag/search";
import type { LegalDocumentCategory, RagInquiryResult, RoomJurisdiction } from "@/lib/rag/types";
import type { UsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";

type RunInquiryParams = {
  question: string;
  jurisdiction: RoomJurisdiction;
  usaSubJurisdiction?: UsaSubJurisdiction;
  category?: LegalDocumentCategory;
  documentId?: string;
  locale?: Locale;
};

const nothingFoundMessage: Record<Locale, string> = {
  en: "No relevant information was found in the uploaded documents for this question.",
  uk: "У завантажених документах не знайдено релевантної інформації для цього запиту.",
};

const SYSTEM_PROMPT = `You are a legal document research assistant for an admin test inquiry.

STRICT RULES:
- Answer ONLY using the retrieved legal excerpts provided in the user message.
- Do NOT use outside knowledge, general legal training, or assumptions.
- Do NOT invent citations, articles, or legal conclusions that are not supported by the excerpts.
- If the excerpts do not contain enough information to answer the question, respond with exactly: ${RAG_INQUIRY_NOT_FOUND}
- When you can answer, cite document names from the excerpts and stay faithful to the source text.`;

function isNotFoundAnswer(answer: string) {
  const normalized = answer.trim().toUpperCase();
  return normalized === RAG_INQUIRY_NOT_FOUND || normalized.startsWith(`${RAG_INQUIRY_NOT_FOUND} `);
}

function filterRelevantResults<T extends { score: number }>(results: T[]) {
  return results.filter((result) => result.score >= RAG_DEFAULTS.minInquiryScore);
}

export function getInquiryNothingFoundMessage(locale: Locale = "en") {
  return nothingFoundMessage[locale];
}

export async function runRagInquiry(params: RunInquiryParams): Promise<RagInquiryResult> {
  const locale = params.locale ?? "en";
  const answerLocale = params.jurisdiction === "usa" ? "en" : locale;

  const plan = await prepareLegalSearch({
    situation: params.question,
    jurisdiction: params.jurisdiction,
    usaSubJurisdiction: params.usaSubJurisdiction,
    locale: answerLocale,
  });

  const situation = params.question.trim();
  const searchQueries = [
    ...new Set([
      ...plan.searchQueries,
      ...(situation.length > 0 && situation.length <= 300 ? [situation] : []),
    ]),
  ].filter(Boolean);

  const results = await searchLegalCorpusWithFallback(searchQueries, {
    jurisdiction: params.jurisdiction,
    usaSubJurisdiction: params.usaSubJurisdiction,
    category: params.documentId ? undefined : params.category,
    documentId: params.documentId,
    topK: 6,
  });

  const relevantResults = filterRelevantResults(results);

  if (relevantResults.length === 0) {
    return {
      answer: getInquiryNothingFoundMessage(answerLocale),
      citations: [],
      preparedQueries: searchQueries,
    };
  }

  const context = relevantResults
    .map(
      (result, index) =>
        `[${index + 1}] Document: ${result.documentName}\nURL: ${result.sourceUrl}\nCategory: ${result.category}\nExcerpt:\n${result.content}`,
    )
    .join("\n\n");

  const client = await getOpenAIClient();
  const model = await getOpenAIChatModel();
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Question:\n${params.question}\n\nRetrieved legal excerpts (ONLY source you may use):\n${context}`,
      },
    ],
  });

  const rawAnswer = completion.choices[0]?.message?.content?.trim() ?? "";

  const citations = relevantResults.map((result) => ({
    documentName: result.documentName,
    sourceUrl: result.sourceUrl,
    excerpt: result.content.slice(0, 500),
    chunkIndex: result.chunkIndex,
  }));

  if (!rawAnswer || isNotFoundAnswer(rawAnswer)) {
    return {
      answer: getInquiryNothingFoundMessage(answerLocale),
      citations,
      preparedQueries: searchQueries,
    };
  }

  return {
    answer: rawAnswer,
    citations,
    preparedQueries: searchQueries,
  };
}
