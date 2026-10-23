import { z } from "zod";
import type { Locale } from "@/lib/i18n";
import {
  chatTemperature,
  getOpenAIChatModel,
  getOpenAIClient,
  parseJsonFromModelResponse,
} from "@/lib/pipeline/openai-client";
import { isLegalDocumentCategory, LEGAL_DOCUMENT_CATEGORIES } from "@/lib/rag/categories";
import type { LegalDocumentCategory, RoomJurisdiction } from "@/lib/rag/types";
import { getUsaSubJurisdictionLabel, type UsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";

export type PreparedLegalSearch = {
  searchQueries: string[];
  category?: LegalDocumentCategory;
  issues: string[];
};

type PrepareLegalSearchParams = {
  situation: string;
  jurisdiction: RoomJurisdiction;
  usaSubJurisdiction?: UsaSubJurisdiction;
  locale?: Locale;
};

const preparedSearchSchema = z.object({
  category: z.string().nullable().optional(),
  issues: z.array(z.string()).max(6).default([]),
  searchQueries: z.array(z.string().min(3)).min(1).max(5),
  keywords: z.array(z.string()).max(12).optional(),
});

const PLANNER_SYSTEM_PROMPT = `You are a legal retrieval query planner. Your ONLY job is to transform a dispute situation into search queries for a statute/legal document corpus.

STRICT RULES:
- Do NOT answer the legal question or state what the law says.
- Do NOT invent article numbers, statute names, or legal conclusions unless explicitly mentioned in the situation.
- Output 3–5 short search queries phrased like statutory/legal text (formal legal vocabulary), NOT like a personal story.
- Prefer the language of the corpus: Ukrainian for Ukraine jurisdiction, English for United States jurisdiction.
- Pick at most one category from: ${LEGAL_DOCUMENT_CATEGORIES.join(", ")} only when the situation clearly belongs to one domain; otherwise omit category.
- For Ukraine labor disputes, use terms like "трудовий спір", "трудовий конфлікт", "примирення сторін" — not mediation/ODR vocabulary unless explicitly about international arbitration.
- For United States HOA, homeowners association, condominium, covenant, or architectural review disputes, prefer category property and queries using statutory phrasing (e.g. "architectural review committee standards", "homeowners association enforcement", "Chapter 720").
- searchQueries must be distinct and target different legal angles (rights, procedures, definitions, remedies).
- keywords: optional extra terms for keyword search (single words or short phrases).

Respond with JSON only:
{
  "category": "labor" | null,
  "issues": ["issue 1", "issue 2"],
  "searchQueries": ["query 1", "query 2", "query 3"],
  "keywords": ["term1", "term2"]
}`;

function fallbackPlan(situation: string): PreparedLegalSearch {
  const trimmed = situation.trim();
  if (!trimmed) {
    return { searchQueries: ["legal rights obligations"], issues: [] };
  }
  if (trimmed.length <= 200) {
    return { searchQueries: [trimmed], issues: [] };
  }
  return {
    searchQueries: [trimmed.slice(0, 200), trimmed.slice(200, 400)].filter(Boolean),
    issues: [],
  };
}

function jurisdictionContext(params: PrepareLegalSearchParams): string {
  if (params.jurisdiction === "ukraine") {
    return "Jurisdiction: Ukraine. Corpus language: Ukrainian.";
  }
  const stateLabel = params.usaSubJurisdiction
    ? getUsaSubJurisdictionLabel(params.usaSubJurisdiction, params.locale ?? "en")
    : null;
  return stateLabel
    ? `Jurisdiction: United States (${stateLabel}). Corpus language: English.`
    : "Jurisdiction: United States. Corpus language: English.";
}

function normalizePlan(raw: z.infer<typeof preparedSearchSchema>): PreparedLegalSearch {
  const category =
    raw.category && isLegalDocumentCategory(raw.category) ? raw.category : undefined;
  const queries = [...raw.searchQueries];
  if (raw.keywords?.length) {
    const keywordQuery = raw.keywords.join(" ");
    if (keywordQuery.length >= 3 && !queries.includes(keywordQuery)) {
      queries.push(keywordQuery);
    }
  }
  return {
    searchQueries: queries.slice(0, 6),
    category,
    issues: raw.issues,
  };
}

export async function prepareLegalSearch(params: PrepareLegalSearchParams): Promise<PreparedLegalSearch> {
  const situation = params.situation.trim();
  if (!situation) return fallbackPlan(situation);

  try {
    const client = await getOpenAIClient();
    const model = await getOpenAIChatModel();
    const completion = await client.chat.completions.create({
      model,
      ...chatTemperature(model, 0),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PLANNER_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            jurisdictionContext(params),
            `Locale for issue labels: ${params.locale ?? "en"}`,
            `Situation:\n${situation}`,
          ].join("\n\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = preparedSearchSchema.safeParse(parseJsonFromModelResponse(raw));
    if (!parsed.success || parsed.data.searchQueries.length === 0) {
      return fallbackPlan(situation);
    }
    return normalizePlan(parsed.data);
  } catch {
    return fallbackPlan(situation);
  }
}
