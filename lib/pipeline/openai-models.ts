import type OpenAI from "openai";

/** Fallback when settings are empty; preserved for existing installs. */
export const FALLBACK_OPENAI_CHAT_MODEL = "gpt-4o-mini";

/**
 * Recommended for PsyLex (mediation agents, legal RAG, JSON pipelines).
 * OpenAI: GPT-6.1 Sol balances intelligence and cost; Luna is cheaper for volume-only.
 * @see https://developers.openai.com/api/docs/models
 */
export const RECOMMENDED_OPENAI_CHAT_MODEL = "gpt-6.1-sol";

export const OPENAI_CHAT_MODEL_SLOTS = [
  "dialogue",
  "artifacts",
  "fast",
  "pipeline",
  "ragChat",
  "help",
] as const;

export type OpenAIModelSlot = (typeof OPENAI_CHAT_MODEL_SLOTS)[number];

/** Curated embedding models that produce (or can be forced to) 1536 dimensions. */
export const OPENAI_EMBEDDING_MODELS = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
] as const;

export type OpenAIEmbeddingModel = (typeof OPENAI_EMBEDDING_MODELS)[number];

export const FALLBACK_OPENAI_EMBEDDING_MODEL: OpenAIEmbeddingModel = "text-embedding-3-small";

/** Postgres `document_chunks.embedding` is vector(1536). */
export const OPENAI_EMBEDDING_DIMENSIONS = 1536;

const NON_CHAT_MODEL_RE =
  /(embedding|whisper|tts|transcribe|realtime|audio|image|dall-e|moderation|computer-use|codex|search-preview)/i;

export function isLikelyChatModelId(id: string) {
  if (!id || NON_CHAT_MODEL_RE.test(id)) return false;
  return /^(gpt-|o[0-9]|chatgpt-)/i.test(id);
}

export function isOpenAIEmbeddingModel(id: string): id is OpenAIEmbeddingModel {
  return (OPENAI_EMBEDDING_MODELS as readonly string[]).includes(id);
}

/**
 * Some chat models (GPT-5+, GPT-6 Sol/Luna, o-series) reject any temperature
 * other than the API default (1). Omit the param for those; keep custom values
 * for classic chat models (gpt-4o, etc.).
 */
export function modelSupportsCustomTemperature(model: string) {
  const id = model.trim().toLowerCase();
  if (!id) return true;
  if (/^o[0-9]/.test(id)) return false;
  if (id.startsWith("gpt-5") || id.startsWith("gpt-6")) return false;
  return true;
}

/** Spread into chat.completions.create(…). Empty object when temperature must be omitted. */
export function chatTemperature(model: string, temperature: number): { temperature?: number } {
  return modelSupportsCustomTemperature(model) ? { temperature } : {};
}

export type BuildChatCompletionBodyParams = {
  model: string;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  /** When set, included only if the model supports custom temperature. */
  temperature?: number;
  responseFormat?: OpenAI.Chat.ChatCompletionCreateParams["response_format"];
};

/**
 * Build chat.completions.create params with model-specific quirks applied
 * (e.g. omit temperature for GPT-5/6 and o-series).
 */
export function buildChatCompletionBody(
  params: BuildChatCompletionBodyParams,
): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming {
  return {
    model: params.model,
    messages: params.messages,
    ...(params.temperature !== undefined ? chatTemperature(params.model, params.temperature) : {}),
    ...(params.responseFormat ? { response_format: params.responseFormat } : {}),
  };
}

/** Whether to pass `dimensions` so vector(1536) stays valid for v3 models. */
export function embeddingRequestDimensions(model: string): number | undefined {
  const id = model.trim().toLowerCase();
  if (id.startsWith("text-embedding-3-")) return OPENAI_EMBEDDING_DIMENSIONS;
  return undefined;
}
