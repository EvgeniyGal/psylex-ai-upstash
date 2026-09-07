import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { assembleInterestsInput } from "@/lib/pipeline/assemble-input";
import { getRoomPartiesForPipeline, isRoomInterestsComplete } from "@/lib/pipeline/gate";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import {
  getUniqueRoomLocales,
  mergeLocalizedOutputs,
  normalizeLocale,
} from "@/lib/pipeline/locale";
import { runAgent } from "@/lib/pipeline/run-agent";
import type { InterestsAnalysis, PsychodynamicProfile } from "@/lib/pipeline/schemas";
import { notifyRoom } from "@/lib/realtime/notify";

type RunInterestsParams = {
  roomId: string;
  draftPrompt?: string;
  dryRun?: boolean;
  targetLocale?: Locale;
};

async function generateInterestsForLocale(params: {
  partyA: Awaited<ReturnType<typeof getRoomPartiesForPipeline>>["partyA"];
  partyB: Awaited<ReturnType<typeof getRoomPartiesForPipeline>>["partyB"];
  locale: Locale;
  draftPrompt?: string;
}) {
  if (!params.partyA || !params.partyB) {
    throw new Error("Room must have both parties.");
  }

  const { result } = await runAgent({
    agentKey: "interests",
    userMessage: assembleInterestsInput({
      partyA: params.partyA,
      partyB: params.partyB,
      partyAProfile: params.partyA.psychodynamicProfile as PsychodynamicProfile | null,
      partyBProfile: params.partyB.psychodynamicProfile as PsychodynamicProfile | null,
      locale: params.locale,
    }),
    draftPrompt: params.draftPrompt,
    targetLocale: params.locale,
  });

  return result;
}

export async function runInterestsAgent(params: RunInterestsParams) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, params.roomId)).limit(1);
  if (!room) throw new Error("Room not found.");

  const { partyA, partyB } = await getRoomPartiesForPipeline(params.roomId);
  if (!partyA || !partyB) throw new Error("Room must have both parties.");

  if (!params.dryRun && isRoomInterestsComplete(room)) {
    await logPipelineEvent({
      roomId: params.roomId,
      agentKey: "interests",
      eventType: "agent_skipped",
    });
    return room.interestsAnalysis;
  }

  if (!params.dryRun) {
    await logPipelineEvent({
      roomId: params.roomId,
      agentKey: "interests",
      eventType: "agent_started",
    });
  }

  try {
    const locales = params.dryRun
      ? [params.targetLocale ?? normalizeLocale(partyA.preferredLocale)]
      : getUniqueRoomLocales([partyA, partyB]);

    const byLocale: Partial<Record<Locale, InterestsAnalysis>> = {};

    for (const locale of locales) {
      byLocale[locale] = await generateInterestsForLocale({
        partyA,
        partyB,
        locale,
        draftPrompt: params.draftPrompt,
      });
    }

    const result = params.dryRun
      ? byLocale[locales[0]!]!
      : mergeLocalizedOutputs(byLocale);

    if (!params.dryRun) {
      await db
        .update(rooms)
        .set({
          interestsAnalysis: result,
          interestsAnalysisAt: new Date(),
        })
        .where(eq(rooms.id, params.roomId));
      notifyRoom(params.roomId);

      await logPipelineEvent({
        roomId: params.roomId,
        agentKey: "interests",
        eventType: "agent_completed",
      });
    }

    return result;
  } catch (error) {
    if (!params.dryRun) {
      await logPipelineEvent({
        roomId: params.roomId,
        agentKey: "interests",
        eventType: "agent_failed",
        payload: { message: error instanceof Error ? error.message : "Unknown error" },
      });
    }
    throw error;
  }
}
