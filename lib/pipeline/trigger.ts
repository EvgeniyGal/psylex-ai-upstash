import { scheduleMediationWork } from "@/lib/mediation/schedule-work";
import { runPostIntakePipeline } from "@/lib/pipeline/orchestrator";

export function tryRunPostIntakePipeline(roomId: string) {
  scheduleMediationWork(`postIntakePipeline:${roomId}`, () => runPostIntakePipeline(roomId));
}

/** Awaitable entry point for server actions — survives request lifecycle better than fire-and-forget. */
export async function ensurePostIntakePipeline(roomId: string) {
  await runPostIntakePipeline(roomId);
}
