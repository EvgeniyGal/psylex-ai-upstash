"use server";

import { listHelpDocuments } from "@/lib/help/documents";
import { getHelpViewer, resolveHelpLocale } from "@/lib/help/viewer";
import type { Locale } from "@/lib/i18n";

export async function loadVisibleHelpDocuments(locale: Locale) {
  const { role, preferredLocale } = await getHelpViewer();
  const resolved = resolveHelpLocale(locale, preferredLocale);
  return listHelpDocuments(resolved, role);
}
