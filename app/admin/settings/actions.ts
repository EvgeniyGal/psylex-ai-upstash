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

export async function saveApiCredentials(formData: FormData) {
  await requireAdmin();

  const openaiApiKey = optionalString(formData.get("openaiApiKey"));
  const airtableApiKey = optionalString(formData.get("airtableApiKey"));
  const openaiModelRaw = optionalString(formData.get("openaiModel"));
  const openaiModel = isLikelyChatModelId(openaiModelRaw)
    ? openaiModelRaw
    : FALLBACK_OPENAI_CHAT_MODEL;

  await getPlatformSettings();

  await db
    .update(platformSettings)
    .set({
      openaiApiKey,
      openaiModel,
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
