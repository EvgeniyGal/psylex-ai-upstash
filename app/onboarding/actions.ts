"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getParticipantNextPath, getUserOnboardingStatus } from "@/lib/onboarding";
import { isParticipantRole, type ParticipantRole } from "@/lib/participant-roles";
import { syncUserTestStatus } from "@/lib/test-status-sync";
import { notifyRoom, notifyUser } from "@/lib/realtime/notify";

async function requireParticipantUser() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  let userId = session?.user?.id;

  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }

  if (!userId || !role || !isParticipantRole(role)) {
    redirect("/login");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  return { user, role };
}

export async function markWelcomeSeen() {
  const { user } = await requireParticipantUser();
  if (user.welcomeSeenAt) {
    redirect("/onboarding/consent");
  }

  await db
    .update(users)
    .set({ welcomeSeenAt: new Date() })
    .where(eq(users.id, user.id));
  notifyUser(user.id);
  notifyRoom(user.roomId);

  revalidatePath("/onboarding/welcome");
  redirect("/onboarding/consent");
}

export async function acceptDisclaimer(formData: FormData) {
  const { user } = await requireParticipantUser();
  if (user.disclaimerAcceptedAt) redirect("/onboarding/tests");
  if (formData.get("consent") !== "on") return;

  const now = new Date();
  await db
    .update(users)
    .set({
      welcomeSeenAt: user.welcomeSeenAt ?? now,
      disclaimerAcceptedAt: now,
    })
    .where(eq(users.id, user.id));
  notifyUser(user.id);
  notifyRoom(user.roomId);

  revalidatePath("/onboarding/consent");
  revalidatePath("/onboarding/welcome");

  await syncUserTestStatus(user.id, user.login);

  revalidatePath("/onboarding/tests");
  redirect("/onboarding/tests");
}

export async function updateTestStatus() {
  const { user } = await requireParticipantUser();
  if (!user.disclaimerAcceptedAt) redirect("/onboarding/consent");

  await syncUserTestStatus(user.id, user.login);
  revalidatePath("/onboarding/tests");
}

export async function completeOnboarding() {
  const { user, role } = await requireParticipantUser();
  const status = await getUserOnboardingStatus(user.id);

  if (!status.canProceed) {
    redirect("/onboarding/tests");
  }

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(users.id, user.id));
  notifyUser(user.id);
  notifyRoom(user.roomId);

  revalidatePath("/onboarding/tests");
  redirect(await getParticipantNextPath(user.id, role as ParticipantRole));
}
