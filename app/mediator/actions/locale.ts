"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { notifyUser } from "@/lib/realtime/notify";

/** Persist mediator/admin UI locale so console/PDF fallbacks match the switcher. */
export async function syncStaffLocale(locale: Locale) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "";
  if (!session?.user?.id || (role !== "mediator" && role !== "admin")) return;

  const preferredLocale: Locale = locale === "uk" ? "uk" : "en";
  await db
    .update(users)
    .set({ preferredLocale })
    .where(eq(users.id, session.user.id));
  notifyUser(session.user.id);
}
