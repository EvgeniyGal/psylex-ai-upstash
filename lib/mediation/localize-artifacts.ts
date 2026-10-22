import type { Locale } from "@/lib/i18n";
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
  const fields = localized ?? optionFieldsFrom(option);
  return { id: option.id, ...fields };
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
