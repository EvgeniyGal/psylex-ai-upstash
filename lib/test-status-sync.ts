import { eq } from "drizzle-orm";
import {
  PERSONAL_BOT_AIRTABLE_CONFIG,
  TEST_AIRTABLE_CONFIG,
} from "@/lib/airtable-config";
import { findAirtableRecordByLogin, hasAirtableRecordForLogin } from "@/lib/airtable";
import { db } from "@/lib/db";
import { finalizePersonalBotPrompt } from "@/lib/personal-bot-prompt";
import { getPlatformSettings } from "@/lib/platform-settings";
import { isParticipantRole } from "@/lib/participant-roles";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { userTestCompletions, users } from "@/drizzle/schema";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

export type TestStatusSyncResult = {
  completedTests: TestKey[];
  testsComplete: boolean;
  personalBotReady: boolean;
  personalBotPrompt: string | null;
  synced: boolean;
};

async function getCompletedTestKeys(userId: string): Promise<Set<TestKey>> {
  const rows = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  return new Set(
    rows
      .map((row) => row.testKey)
      .filter((key): key is TestKey => TEST_KEYS.includes(key as TestKey)),
  );
}

export async function syncUserTestStatus(
  userId: string,
  login: string,
): Promise<TestStatusSyncResult> {
  const settings = await getPlatformSettings();
  const apiKey = settings.airtableApiKey.trim();
  const completedSet = await getCompletedTestKeys(userId);
  const testsComplete = TEST_KEYS.every((key) => completedSet.has(key));

  const [user] = await db
    .select({
      role: users.role,
      personalBotPrompt: users.personalBotPrompt,
      personalBotReadyAt: users.personalBotReadyAt,
      roomId: users.roomId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userRole = user?.role && isParticipantRole(user.role) ? user.role : null;
  let personalBotPrompt = user?.personalBotPrompt?.trim() ?? null;

  if (personalBotPrompt && userRole) {
    const finalized = finalizePersonalBotPrompt(personalBotPrompt, login, userRole);
    if (finalized !== personalBotPrompt) {
      personalBotPrompt = finalized;
      await db
        .update(users)
        .set({ personalBotPrompt: finalized })
        .where(eq(users.id, userId));
      notifyUser(userId);
      notifyRoom(user?.roomId);
    }
  }

  const personalBotReady = !!user?.personalBotReadyAt && !!personalBotPrompt;

  if (testsComplete && personalBotReady) {
    return {
      completedTests: [...completedSet],
      testsComplete: true,
      personalBotReady: true,
      personalBotPrompt,
      synced: false,
    };
  }

  if (!apiKey) {
    return {
      completedTests: [...completedSet],
      testsComplete,
      personalBotReady,
      personalBotPrompt,
      synced: false,
    };
  }

  let updated = false;

  for (const testKey of TEST_KEYS) {
    if (completedSet.has(testKey)) continue;

    const config = TEST_AIRTABLE_CONFIG[testKey];
    const found = await hasAirtableRecordForLogin(apiKey, config, login);
    if (!found) continue;

    await db
      .insert(userTestCompletions)
      .values({ userId, testKey })
      .onConflictDoNothing({
        target: [userTestCompletions.userId, userTestCompletions.testKey],
      });

    completedSet.add(testKey);
    updated = true;
  }

  const allTestsComplete = TEST_KEYS.every((key) => completedSet.has(key));
  let syncedBotPrompt: string | null = personalBotPrompt;
  let syncedBotReady = personalBotReady;

  if (allTestsComplete) {
    const record = await findAirtableRecordByLogin(
      apiKey,
      PERSONAL_BOT_AIRTABLE_CONFIG,
      login,
    );
    const promptValue = record?.fields[PERSONAL_BOT_AIRTABLE_CONFIG.promptField];
    const prompt =
      typeof promptValue === "string"
        ? promptValue.trim()
        : promptValue != null
          ? String(promptValue).trim()
          : "";

    if (prompt && userRole) {
      syncedBotPrompt = finalizePersonalBotPrompt(prompt, login, userRole);
      syncedBotReady = true;
    } else {
      syncedBotPrompt = null;
      syncedBotReady = false;
    }

    const promptChanged = (user?.personalBotPrompt ?? null) !== syncedBotPrompt;
    const readyChanged =
      !!user?.personalBotReadyAt !== syncedBotReady ||
      (syncedBotReady && promptChanged);

    if (promptChanged || readyChanged) {
      await db
        .update(users)
        .set({
          personalBotPrompt: syncedBotPrompt,
          personalBotReadyAt: syncedBotReady ? new Date() : null,
        })
        .where(eq(users.id, userId));
      updated = true;
    }
  } else {
    if (user?.personalBotReadyAt) {
      await db
        .update(users)
        .set({
          personalBotPrompt: null,
          personalBotReadyAt: null,
        })
        .where(eq(users.id, userId));
      updated = true;
      syncedBotPrompt = null;
      syncedBotReady = false;
    }
  }

  if (updated) {
    notifyUser(userId);
    notifyRoom(user?.roomId);
  }

  return {
    completedTests: [...completedSet],
    testsComplete: allTestsComplete,
    personalBotReady: syncedBotReady,
    personalBotPrompt: syncedBotPrompt,
    synced: updated,
  };
}
