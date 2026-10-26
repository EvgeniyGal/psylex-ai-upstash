import type { Locale } from "@/lib/i18n";

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "uk" ? "uk" : "en";
}

export function localeInstruction(locale: Locale): string {
  if (locale === "uk") {
    return "Write all human-readable string values in the JSON response in Ukrainian (українська). Keep JSON property names in English.";
  }
  return "Write all human-readable string values in the JSON response in English. Keep JSON property names in English.";
}

function languageName(locale: Locale): string {
  return locale === "uk" ? "Ukrainian (українська)" : "English";
}

/**
 * Split-locale instruction for Mode A agent outputs that include partyA/partyB adaptations.
 * Prefer this over {@link localeInstruction} when parties may use different preferred locales.
 */
export function partyAdaptationLocaleInstruction(
  partyALocale: Locale,
  partyBLocale: Locale,
): string {
  return [
    "Write canonicalContent in English.",
    `Write partyA in ${languageName(normalizeLocale(partyALocale))}.`,
    `Write partyB in ${languageName(normalizeLocale(partyBLocale))}.`,
    "Keep JSON property names in English.",
  ].join(" ");
}

export function getUniqueRoomLocales(
  sides: { preferredLocale: string | null }[],
): Locale[] {
  const locales = new Set(sides.map((side) => normalizeLocale(side.preferredLocale)));
  return [...locales];
}

export type LocalizedByLocale<T> = {
  byLocale: Partial<Record<Locale, T>>;
};

export function wrapLocalizedOutput<T>(locale: Locale, value: T): LocalizedByLocale<T> {
  return { byLocale: { [locale]: value } };
}

export function mergeLocalizedOutputs<T>(
  outputs: Partial<Record<Locale, T>>,
): LocalizedByLocale<T> {
  return { byLocale: outputs };
}

export function resolveLocalizedOutput<T>(
  stored: unknown,
  viewerLocale: Locale,
): T | null {
  if (!stored || typeof stored !== "object") return null;

  const record = stored as Record<string, unknown>;
  if ("byLocale" in record && record.byLocale && typeof record.byLocale === "object") {
    const byLocale = record.byLocale as Partial<Record<Locale, T>>;
    return byLocale[viewerLocale] ?? byLocale.en ?? byLocale.uk ?? null;
  }

  return stored as T;
}
