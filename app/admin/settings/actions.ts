"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformSettings } from "@/drizzle/schema";
import { listOpenAIChatModelIds } from "@/lib/pipeline/openai-client";
import {
  FALLBACK_OPENAI_CHAT_MODEL,
  isLikelyChatModelId,
  OPENAI_CHAT_MODEL_SLOTS,
  type OpenAIModelSlot,
} from "@/lib/pipeline/openai-models";
import { getPlatformSettings } from "@/lib/platform-settings";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function optionalString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseChatModelField(formData: FormData, name: string, fallback: string) {
  const raw = optionalString(formData.get(name));
  if (!raw) return fallback;
  return isLikelyChatModelId(raw) ? raw : fallback;
}

const SLOT_FORM_NAMES: Record<OpenAIModelSlot, string> = {
  dialogue: "openaiModelDialogue",
  artifacts: "openaiModelArtifacts",
  fast: "openaiModelFast",
  pipeline: "openaiModelPipeline",
  ragChat: "openaiModelRagChat",
  help: "openaiModelHelp",
};

export async function saveApiCredentials(formData: FormData) {
  await requireAdmin();

  const openaiApiKey = optionalString(formData.get("openaiApiKey"));
  const airtableApiKey = optionalString(formData.get("airtableApiKey"));

  const current = await getPlatformSettings();
  const fallbackModel = isLikelyChatModelId(current.openaiModel)
    ? current.openaiModel
    : FALLBACK_OPENAI_CHAT_MODEL;

  const slotValues = Object.fromEntries(
    OPENAI_CHAT_MODEL_SLOTS.map((slot) => [
      SLOT_FORM_NAMES[slot],
      parseChatModelField(formData, SLOT_FORM_NAMES[slot], fallbackModel),
    ]),
  ) as Record<(typeof SLOT_FORM_NAMES)[OpenAIModelSlot], string>;

  // Keep openaiModel in sync with dialogue for any legacy single-model readers.
  const openaiModel = slotValues.openaiModelDialogue || fallbackModel;

  await db
    .update(platformSettings)
    .set({
      openaiApiKey,
      openaiModel,
      openaiModelDialogue: slotValues.openaiModelDialogue,
      openaiModelArtifacts: slotValues.openaiModelArtifacts,
      openaiModelFast: slotValues.openaiModelFast,
      openaiModelPipeline: slotValues.openaiModelPipeline,
      openaiModelRagChat: slotValues.openaiModelRagChat,
      openaiModelHelp: slotValues.openaiModelHelp,
      airtableApiKey,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, "default"));

  revalidatePath("/admin/settings");
}

export async function loadOpenAIChatModels(apiKeyOverride?: string) {
  await requireAdmin();
  const key = apiKeyOverride?.trim();
  return listOpenAIChatModelIds(key || undefined);
}

export async function saveTestLinks(formData: FormData) {
  await requireAdmin();

  const testPersonalityTypeUrl = optionalString(formData.get("testPersonalityTypeUrl"));
  const testFaceFearUrl = optionalString(formData.get("testFaceFearUrl"));
  const testCharacterTraitsUrl = optionalString(formData.get("testCharacterTraitsUrl"));
  const testPersonalityConflictsUrl = optionalString(formData.get("testPersonalityConflictsUrl"));

  await getPlatformSettings();

  await db
    .update(platformSettings)
    .set({
      testPersonalityTypeUrl,
      testFaceFearUrl,
      testCharacterTraitsUrl,
      testPersonalityConflictsUrl,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, "default"));

  revalidatePath("/admin/settings");
}
