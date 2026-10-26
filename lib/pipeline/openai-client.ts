import OpenAI from "openai";
import {
  buildChatCompletionBody,
  FALLBACK_OPENAI_CHAT_MODEL,
  FALLBACK_OPENAI_EMBEDDING_MODEL,
  isLikelyChatModelId,
  isOpenAIEmbeddingModel,
  type OpenAIModelSlot,
} from "@/lib/pipeline/openai-models";
import { getPlatformSettings } from "@/lib/platform-settings";
import type { MediationAgentMode } from "@/lib/mediation/schemas";

export {
  buildChatCompletionBody,
  chatTemperature,
  embeddingRequestDimensions,
  FALLBACK_OPENAI_CHAT_MODEL,
  FALLBACK_OPENAI_EMBEDDING_MODEL,
  isLikelyChatModelId,
  isOpenAIEmbeddingModel,
  modelSupportsCustomTemperature,
  OPENAI_CHAT_MODEL_SLOTS,
  OPENAI_EMBEDDING_DIMENSIONS,
  OPENAI_EMBEDDING_MODELS,
  RECOMMENDED_OPENAI_CHAT_MODEL,
  type OpenAIEmbeddingModel,
  type OpenAIModelSlot,
} from "@/lib/pipeline/openai-models";

const SLOT_SETTING_KEY: Record<OpenAIModelSlot, keyof Awaited<ReturnType<typeof getPlatformSettings>>> = {
  dialogue: "openaiModelDialogue",
  artifacts: "openaiModelArtifacts",
  fast: "openaiModelFast",
  pipeline: "openaiModelPipeline",
  ragChat: "openaiModelRagChat",
  help: "openaiModelHelp",
};

export async function getOpenAIClient() {
  const settings = await getPlatformSettings();
  if (!settings.openaiApiKey) {
    throw new Error("OpenAI API key is not configured in Settings → Credentials.");
  }
  return new OpenAI({ apiKey: settings.openaiApiKey });
}

/**
 * Resolve chat model for a workload slot.
 * Slot value → openaiModel fallback → FALLBACK_OPENAI_CHAT_MODEL.
 */
export async function getOpenAIChatModel(slot?: OpenAIModelSlot) {
  const settings = await getPlatformSettings();
  if (slot) {
    const slotValue = String(settings[SLOT_SETTING_KEY[slot]] ?? "").trim();
    if (slotValue) return slotValue;
  }
  const fallback = settings.openaiModel?.trim();
  return fallback || FALLBACK_OPENAI_CHAT_MODEL;
}

export function mediationModeToModelSlot(mode: MediationAgentMode): OpenAIModelSlot {
  if (mode === "options" || mode === "compromise" || mode === "agreement_draft") {
    return "artifacts";
  }
  return "dialogue";
}

export async function getOpenAIEmbeddingModel() {
  const settings = await getPlatformSettings();
  const model = settings.openaiEmbeddingModel?.trim();
  if (model && isOpenAIEmbeddingModel(model)) return model;
  return FALLBACK_OPENAI_EMBEDDING_MODEL;
}

export async function listOpenAIChatModelIds(apiKey?: string): Promise<string[]> {
  const key = apiKey?.trim() || (await getPlatformSettings()).openaiApiKey;
  if (!key) {
    throw new Error("OpenAI API key is not configured in Settings → Credentials.");
  }
  const client = new OpenAI({ apiKey: key });
  const page = await client.models.list();
  const ids = page.data.map((model) => model.id).filter(isLikelyChatModelId);
  ids.sort((a, b) => a.localeCompare(b));
  return ids;
}

export function parseJsonFromModelResponse(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

/** Convenience: create a chat completion with model-quirk-aware params. */
export async function createChatCompletion(
  params: Parameters<typeof buildChatCompletionBody>[0],
) {
  const client = await getOpenAIClient();
  return client.chat.completions.create(buildChatCompletionBody(params));
}
