import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { users } from "@/drizzle/schema";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { HelpViewerRole } from "@/lib/help/types";
import type { Locale } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/pipeline/locale";

export async function getHelpViewer(): Promise<{
  role: HelpViewerRole;
  userId: string | null;
  preferredLocale: Locale | null;
}> {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as HelpViewerRole | undefined) ?? null;
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return { role, userId: null, preferredLocale: null };
  }

  const [row] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    role,
    userId,
    preferredLocale: row?.preferredLocale ? normalizeLocale(row.preferredLocale) : null,
  };
}

export function resolveHelpLocale(clientLocale: string | null | undefined, preferredLocale: Locale | null): Locale {
  if (clientLocale === "uk" || clientLocale === "en") return clientLocale;
  if (preferredLocale) return preferredLocale;
  return "en";
}
