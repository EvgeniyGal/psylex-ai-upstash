import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { assembleEmotionalTriggersInput } from "@/lib/pipeline/assemble-input";
import {
  isPersonalBotReady,
  isUserEmotionalTriggersComplete,
} from "@/lib/pipeline/gate";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { runAgent } from "@/lib/pipeline/run-agent";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

type RunEmotionalTriggersParams = {
  userId: string;
  roomId?: string;
  draftPrompt?: string;
  dryRun?: boolean;
};

export async function runEmotionalTriggersAgent(params: RunEmotionalTriggersParams) {
  if (!params.dryRun && !params.roomId) {
    throw new Error("roomId is required for pipeline runs.");
  }

  const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  if (!user || !isPersonalBotReady(user) || !hasSubmittedDisputeIntake(user)) {
    throw new Error("User must have a ready personal bot prompt and completed dispute intake.");
  }

  if (!params.dryRun && isUserEmotionalTriggersComplete(user)) {
    await logPipelineEvent({
      roomId: params.roomId!,
      userId: user.id,
      agentKey: "emotional_triggers",
      eventType: "agent_skipped",
    });
    return user.emotionalTriggers;
  }

  if (!params.dryRun) {
    await logPipelineEvent({
      roomId: params.roomId!,
      userId: user.id,
      agentKey: "emotional_triggers",
      eventType: "agent_started",
    });
  }

  try {
    const { result } = await runAgent({
      agentKey: "emotional_triggers",
      userMessage: assembleEmotionalTriggersInput(user),
      draftPrompt: params.draftPrompt,
      targetLocale: normalizeLocale(user.preferredLocale),
    });

    if (!params.dryRun) {
      await db
        .update(users)
        .set({
          emotionalTriggers: result,
          emotionalTriggersAt: new Date(),
        })
        .where(eq(users.id, user.id));
      notifyUser(user.id);
      notifyRoom(params.roomId);

      await logPipelineEvent({
        roomId: params.roomId!,
        userId: user.id,
        agentKey: "emotional_triggers",
        eventType: "agent_completed",
      });
    }

    return result;
  } catch (error) {
    if (!params.dryRun) {
      await logPipelineEvent({
        roomId: params.roomId!,
        userId: user.id,
        agentKey: "emotional_triggers",
        eventType: "agent_failed",
        payload: { message: error instanceof Error ? error.message : "Unknown error" },
      });
    }
    throw error;
  }
}
