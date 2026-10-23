import OpenAI from "openai";
import {
  FALLBACK_OPENAI_CHAT_MODEL,
  isLikelyChatModelId,
} from "@/lib/pipeline/openai-models";
import { getPlatformSettings } from "@/lib/platform-settings";

export {
  chatTemperature,
  FALLBACK_OPENAI_CHAT_MODEL,
  isLikelyChatModelId,
  modelSupportsCustomTemperature,
  RECOMMENDED_OPENAI_CHAT_MODEL,
} from "@/lib/pipeline/openai-models";

export async function getOpenAIClient() {
  const settings = await getPlatformSettings();
  if (!settings.openaiApiKey) {
    throw new Error("OpenAI API key is not configured in Settings → Credentials.");
  }
  return new OpenAI({ apiKey: settings.openaiApiKey });
}

export async function getOpenAIChatModel() {
  const settings = await getPlatformSettings();
  const model = settings.openaiModel?.trim();
  return model || FALLBACK_OPENAI_CHAT_MODEL;
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
