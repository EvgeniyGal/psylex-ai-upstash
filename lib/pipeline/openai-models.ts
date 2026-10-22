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
