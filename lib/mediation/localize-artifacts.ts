import type { Locale } from "@/lib/i18n";
import { repairTextLocale } from "@/lib/mediation/translate";
import type {
  DraftAgreement,
  DraftAgreementLocaleFields,
  MediationOption,
  MediationOptionLocaleFields,
} from "@/lib/mediation/types";
import { normalizeLocale } from "@/lib/pipeline/locale";

export function optionFieldsFrom(option: MediationOptionLocaleFields): MediationOptionLocaleFields {
  return {
    canonicalDescription: option.canonicalDescription,
    legalNorms: option.legalNorms,
    fulfillmentProbability: option.fulfillmentProbability,
    refusalRisks: option.refusalRisks,
    partyA: option.partyA,
    partyB: option.partyB,
  };
}

export function resolveOptionForLocale(
  option: MediationOption,
  locale: Locale | string | null | undefined,
): MediationOptionLocaleFields & { id: string } {
  const lang = normalizeLocale(locale);
  const localized = option.byLocale?.[lang];
  if (localized) return { id: option.id, ...optionFieldsFrom(localized) };
  // Legacy rows without byLocale[lang]: use top-level (primary) fields.
  return { id: option.id, ...optionFieldsFrom(option) };
}

/** Re-translate option string fields that are clearly not in the target locale. */
export async function repairOptionFieldsLocale(
  fields: MediationOptionLocaleFields,
  targetLocale: Locale,
): Promise<MediationOptionLocaleFields> {
  const keys = [
    "canonicalDescription",
    "legalNorms",
    "fulfillmentProbability",
    "refusalRisks",
    "partyA",
    "partyB",
  ] as const;
  const repaired = { ...fields };
  await Promise.all(
    keys.map(async (key) => {
      repaired[key] = await repairTextLocale(fields[key], targetLocale);
    }),
  );
  return repaired;
}

export async function repairDraftFieldsLocale(
  fields: DraftAgreementLocaleFields,
  targetLocale: Locale,
): Promise<DraftAgreementLocaleFields> {
  const [title, body, ...obligationTexts] = await Promise.all([
    repairTextLocale(fields.title, targetLocale),
    repairTextLocale(fields.body, targetLocale),
    ...fields.obligations.map((o) => repairTextLocale(o.text, targetLocale)),
  ]);
  const terms = await Promise.all(fields.terms.map((t) => repairTextLocale(t, targetLocale)));
  return {
    title,
    body,
    terms,
    obligations: fields.obligations.map((o, index) => ({
      ...o,
      text: obligationTexts[index] ?? o.text,
    })),
  };
}

export function mergeOptionLocales(
  primaryLocale: Locale,
  byLocale: Partial<Record<Locale, MediationOptionLocaleFields & { id: string }>>,
): MediationOption {
  const primary = byLocale[primaryLocale] ?? Object.values(byLocale).find(Boolean);
  if (!primary) {
    throw new Error("No option locale payload to merge.");
  }
  const locales: Partial<Record<Locale, MediationOptionLocaleFields>> = {};
  for (const [key, value] of Object.entries(byLocale)) {
    if (!value) continue;
    locales[key as Locale] = optionFieldsFrom(value);
  }
  return {
    id: primary.id,
    ...optionFieldsFrom(primary),
    byLocale: locales,
  };
}

export function draftFieldsFrom(draft: DraftAgreementLocaleFields): DraftAgreementLocaleFields {
  return {
    title: draft.title,
    body: draft.body,
    obligations: draft.obligations,
    terms: draft.terms,
  };
}

export function resolveDraftForLocale(
  draft: DraftAgreement,
  locale: Locale | string | null | undefined,
): DraftAgreement {
  const lang = normalizeLocale(locale);
  const localized = draft.byLocale?.[lang];
  if (!localized) return draft;
  return {
    ...draft,
    ...localized,
  };
}

export function mergeDraftLocales(
  primaryLocale: Locale,
  base: Omit<DraftAgreement, keyof DraftAgreementLocaleFields | "byLocale"> &
    DraftAgreementLocaleFields,
  byLocale: Partial<Record<Locale, DraftAgreementLocaleFields>>,
): DraftAgreement {
  const primary = byLocale[primaryLocale] ?? draftFieldsFrom(base);
  return {
    ...base,
    ...primary,
    byLocale: {
      ...byLocale,
      [primaryLocale]: primary,
    },
  };
}

export function descriptionForViewerRole(
  option: MediationOption,
  role: "party_a" | "party_b",
  locale: Locale | string | null | undefined,
) {
  const resolved = resolveOptionForLocale(option, locale);
  return role === "party_a" ? resolved.partyA : resolved.partyB;
}
