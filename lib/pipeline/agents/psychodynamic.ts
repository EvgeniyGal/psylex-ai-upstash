import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { assemblePsychodynamicInput } from "@/lib/pipeline/assemble-input";
import {
  isPersonalBotReady,
  isUserPsychodynamicComplete,
} from "@/lib/pipeline/gate";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { runAgent } from "@/lib/pipeline/run-agent";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

type RunPsychodynamicParams = {
  userId: string;
  roomId?: string;
  draftPrompt?: string;
  dryRun?: boolean;
};

export async function runPsychodynamicAgent(params: RunPsychodynamicParams) {
  if (!params.dryRun && !params.roomId) {
    throw new Error("roomId is required for pipeline runs.");
  }

  const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  if (!user || !isPersonalBotReady(user)) {
    throw new Error("User does not have a ready personal bot prompt.");
  }

  if (!params.dryRun && isUserPsychodynamicComplete(user)) {
    await logPipelineEvent({
      roomId: params.roomId!,
      userId: user.id,
      agentKey: "psychodynamic",
      eventType: "agent_skipped",
    });
    return user.psychodynamicProfile;
  }

  if (!params.dryRun) {
    await logPipelineEvent({
      roomId: params.roomId!,
      userId: user.id,
      agentKey: "psychodynamic",
      eventType: "agent_started",
    });
  }

  try {
    const { result } = await runAgent({
      agentKey: "psychodynamic",
      userMessage: assemblePsychodynamicInput(user),
      draftPrompt: params.draftPrompt,
      targetLocale: normalizeLocale(user.preferredLocale),
    });

    if (!params.dryRun) {
      await db
        .update(users)
        .set({
          psychodynamicProfile: result,
          psychodynamicProfileAt: new Date(),
        })
        .where(eq(users.id, user.id));
      notifyUser(user.id);
      notifyRoom(params.roomId);

      await logPipelineEvent({
        roomId: params.roomId!,
        userId: user.id,
        agentKey: "psychodynamic",
        eventType: "agent_completed",
      });
    }

    return result;
  } catch (error) {
    if (!params.dryRun) {
      await logPipelineEvent({
        roomId: params.roomId!,
        userId: user.id,
        agentKey: "psychodynamic",
        eventType: "agent_failed",
        payload: { message: error instanceof Error ? error.message : "Unknown error" },
      });
    }
    throw error;
  }
}
