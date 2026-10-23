/** Fallback when settings are empty; preserved for existing installs. */
export const FALLBACK_OPENAI_CHAT_MODEL = "gpt-4o-mini";

/**
 * Recommended for PsyLex (mediation agents, legal RAG, JSON pipelines).
 * OpenAI: GPT-6.1 Sol balances intelligence and cost; Luna is cheaper for volume-only.
 * @see https://developers.openai.com/api/docs/models
 */
export const RECOMMENDED_OPENAI_CHAT_MODEL = "gpt-6.1-sol";

const NON_CHAT_MODEL_RE =
  /(embedding|whisper|tts|transcribe|realtime|audio|image|dall-e|moderation|computer-use|codex|search-preview)/i;

export function isLikelyChatModelId(id: string) {
  if (!id || NON_CHAT_MODEL_RE.test(id)) return false;
  return /^(gpt-|o[0-9]|chatgpt-)/i.test(id);
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
