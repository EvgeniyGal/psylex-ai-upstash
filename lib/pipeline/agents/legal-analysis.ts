import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { RAG_DEFAULTS } from "@/lib/rag/config";
import { ragSearchForRoom } from "@/lib/rag/agent-tool";
import {
  assembleLegalAnalysisDisputeInput,
} from "@/lib/pipeline/assemble-input";
import { getRoomPartiesForPipeline, isRoomLegalAnalysisComplete } from "@/lib/pipeline/gate";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { loadAgentPrompt } from "@/lib/pipeline/load-prompt";
import { prepareLegalSearch } from "@/lib/rag/prepare-search";
import { parseUsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";
import {
  buildNotFoundLegalAnalysis,
  LEGAL_ANALYSIS_STRICT_RULES,
} from "@/lib/pipeline/legal-analysis-not-found";
import {
  getUniqueRoomLocales,
  localeInstruction,
  mergeLocalizedOutputs,
  normalizeLocale,
} from "@/lib/pipeline/locale";
import { getOpenAIClient, parseJsonFromModelResponse } from "@/lib/pipeline/openai-client";
import { notifyRoom } from "@/lib/realtime/notify";
import type { LegalAnalysis } from "@/lib/pipeline/schemas";
import { legalAnalysisSchema } from "@/lib/pipeline/schemas";

type RunLegalAnalysisParams = {
  roomId: string;
  draftPrompt?: string;
  dryRun?: boolean;
  targetLocale?: Locale;
};

function filterRelevantResults<T extends { score: number }>(results: T[]) {
  return results.filter((result) => result.score >= RAG_DEFAULTS.minInquiryScore);
}

function formatExcerpts(
  ragResults: Awaited<ReturnType<typeof ragSearchForRoom>>,
): string {
  if (ragResults.length === 0) {
    return "";
  }

  return ragResults
    .map(
      (result, index) =>
        `[${index + 1}] Document: ${result.documentName}\nURL: ${result.sourceUrl}\nExcerpt:\n${result.content}`,
    )
    .join("\n\n");
}

async function generateLegalAnalysisForLocale(params: {
  disputeInput: string;
  excerpts: string;
  hasRelevantExcerpts: boolean;
  draftPrompt?: string;
  locale: Locale;
}) {
  if (!params.hasRelevantExcerpts) {
    return buildNotFoundLegalAnalysis(params.locale);
  }

  const basePrompt = await loadAgentPrompt("legal_analysis", params.draftPrompt);
  const systemPrompt = `${basePrompt}\n\n${LEGAL_ANALYSIS_STRICT_RULES}`;
  const client = await getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          params.disputeInput,
          `Retrieved legal excerpts (ONLY source for citations):\n${params.excerpts}`,
          localeInstruction(params.locale),
        ].join("\n\n"),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
  const parsed = legalAnalysisSchema.safeParse(parseJsonFromModelResponse(raw));

  if (!parsed.success) {
    return buildNotFoundLegalAnalysis(params.locale);
  }

  if (parsed.data.status === "not_found") {
    return parsed.data;
  }

  if (parsed.data.citations.length === 0 && parsed.data.applicableLaws.length === 0) {
    return buildNotFoundLegalAnalysis(params.locale);
  }

  return parsed.data;
}

export async function runLegalAnalysisAgent(params: RunLegalAnalysisParams) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, params.roomId)).limit(1);
  if (!room) throw new Error("Room not found.");

  const { partyA, partyB } = await getRoomPartiesForPipeline(params.roomId);
  if (!partyA || !partyB) throw new Error("Room must have both parties.");

  if (!params.dryRun && isRoomLegalAnalysisComplete(room)) {
    await logPipelineEvent({
      roomId: params.roomId,
      agentKey: "legal_analysis",
      eventType: "agent_skipped",
    });
    return room.legalAnalysis;
  }

  if (!params.dryRun) {
    await logPipelineEvent({
      roomId: params.roomId,
      agentKey: "legal_analysis",
      eventType: "agent_started",
    });
  }

  try {
    const disputeInput = assembleLegalAnalysisDisputeInput({ room, partyA, partyB });
    const locales = params.dryRun
      ? [params.targetLocale ?? normalizeLocale(partyA.preferredLocale)]
      : getUniqueRoomLocales([partyA, partyB]);
    const plannerLocale = locales[0] ?? normalizeLocale(partyA.preferredLocale);

    const searchPlan = await prepareLegalSearch({
      situation: disputeInput,
      jurisdiction: room.jurisdiction,
      usaSubJurisdiction: parseUsaSubJurisdiction(room.usaSubJurisdiction) ?? undefined,
      locale: plannerLocale,
    });

    const searchQueries = [
      ...new Set([...searchPlan.searchQueries, disputeInput.trim()]),
    ].filter(Boolean);

    let ragResults = filterRelevantResults(
      await ragSearchForRoom(params.roomId, searchQueries, searchPlan.category),
    );
    if (ragResults.length === 0 && searchPlan.category) {
      ragResults = filterRelevantResults(
        await ragSearchForRoom(params.roomId, searchQueries, undefined),
      );
    }
    const hasRelevantExcerpts = ragResults.length > 0;
    const excerpts = formatExcerpts(ragResults);

    const byLocale: Partial<Record<Locale, LegalAnalysis>> = {};

    for (const locale of locales) {
      byLocale[locale] = await generateLegalAnalysisForLocale({
        disputeInput,
        excerpts,
        hasRelevantExcerpts,
        draftPrompt: params.draftPrompt,
        locale,
      });
    }

    const result = params.dryRun
      ? byLocale[locales[0]!]!
      : mergeLocalizedOutputs(byLocale);

    if (!params.dryRun) {
      await db
        .update(rooms)
        .set({
          legalAnalysis: result,
          legalAnalysisAt: new Date(),
        })
        .where(eq(rooms.id, params.roomId));
      notifyRoom(params.roomId);

      await logPipelineEvent({
        roomId: params.roomId,
        agentKey: "legal_analysis",
        eventType: "agent_completed",
      });
    }

    return result;
  } catch (error) {
    if (!params.dryRun) {
      await logPipelineEvent({
        roomId: params.roomId,
        agentKey: "legal_analysis",
        eventType: "agent_failed",
        payload: { message: error instanceof Error ? error.message : "Unknown error" },
      });
    }
    throw error;
  }
}
