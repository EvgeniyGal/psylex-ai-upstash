import type { Locale } from "@/lib/i18n";
import type { MediationContext } from "@/lib/mediation/assemble-input";
import {
  draftFieldsFrom,
  mergeDraftLocales,
  mergeOptionLocales,
  optionFieldsFrom,
  repairDraftFieldsLocale,
  repairOptionFieldsLocale,
} from "@/lib/mediation/localize-artifacts";
import { runMediationAgent } from "@/lib/mediation/run-agent";
import {
  mediationAgreementDraftSchema,
  mediationCompromiseSchema,
  mediationOptionsSchema,
} from "@/lib/mediation/schemas";
import { SUPPORTED_MESSAGE_LOCALES, translateText } from "@/lib/mediation/translate";
import type { DraftAgreement, MediationOption, MediationOptionLocaleFields } from "@/lib/mediation/types";
import { normalizeLocale } from "@/lib/pipeline/locale";

/** Always generate both product languages for documents and cross-locale rooms. */
const ARTIFACT_LOCALES: Locale[] = SUPPORTED_MESSAGE_LOCALES;

type LocalizedOptionPayload = MediationOptionLocaleFields & { id: string };

function artifactLocales(_partyALocale?: string | null, _partyBLocale?: string | null): Locale[] {
  return [...ARTIFACT_LOCALES];
}

function idsFullyAligned(
  results: { locale: Locale; options: LocalizedOptionPayload[] }[],
  primary: Locale,
): boolean {
  const primaryOptions = results.find((r) => r.locale === primary)?.options ?? [];
  if (primaryOptions.length === 0) return false;
  for (const { locale, options } of results) {
    if (locale === primary) continue;
    if (options.length !== primaryOptions.length) return false;
    for (const option of primaryOptions) {
      if (!options.some((o) => o.id === option.id)) return false;
    }
  }
  return true;
}

async function fillMissingOptionLocale(
  fields: MediationOptionLocaleFields,
  from: Locale,
  to: Locale,
): Promise<MediationOptionLocaleFields> {
  const keys = [
    "canonicalDescription",
    "legalNorms",
    "fulfillmentProbability",
    "refusalRisks",
    "partyA",
    "partyB",
  ] as const;
  const translated = await Promise.all(
    keys.map(async (key) => [
      key,
      await translateText({ text: fields[key], from, to }),
    ]),
  );
  return Object.fromEntries(translated) as MediationOptionLocaleFields;
}

async function ensureCompleteOptionLocales(
  primary: Locale,
  byLocale: Partial<Record<Locale, LocalizedOptionPayload>>,
  locales: Locale[],
): Promise<MediationOption> {
  const source =
    byLocale[primary] ??
    (Object.values(byLocale).find(Boolean) as LocalizedOptionPayload | undefined);
  if (!source) throw new Error("No option locale payload to merge.");

  const complete: Partial<Record<Locale, LocalizedOptionPayload>> = { ...byLocale };
  for (const locale of locales) {
    if (complete[locale]) continue;
    const sourceLocale = (Object.keys(complete)[0] as Locale | undefined) ?? primary;
    const sourceFields = complete[sourceLocale] ?? source;
    const filled = await fillMissingOptionLocale(
      optionFieldsFrom(sourceFields),
      sourceLocale,
      locale,
    );
    const repaired = await repairOptionFieldsLocale(filled, locale);
    complete[locale] = { id: source.id, ...repaired };
  }

  return mergeOptionLocales(primary, complete);
}

/**
 * Merge parallel locale generations into one option list.
 * Prefer id alignment; if ids diverge or counts mismatch, index-align from primary
 * so we never emit mono-locale duplicate options (mixed EN/UK list).
 */
async function mergeLocalizedOptionResults(params: {
  results: { locale: Locale; options: LocalizedOptionPayload[] }[];
  locales: Locale[];
  primary: Locale;
}): Promise<MediationOption[]> {
  const { results, locales, primary } = params;
  const primaryOptions =
    results.find((r) => r.locale === primary)?.options ?? results[0]?.options ?? [];

  if (primaryOptions.length === 0) return [];

  if (idsFullyAligned(results, primary)) {
    return Promise.all(
      primaryOptions.map(async (option) => {
        const byLocale: Partial<Record<Locale, LocalizedOptionPayload>> = {};
        for (const { locale, options } of results) {
          const match = options.find((o) => o.id === option.id);
          if (match) byLocale[locale] = { id: option.id, ...optionFieldsFrom(match) };
        }
        return ensureCompleteOptionLocales(primary, byLocale, locales);
      }),
    );
  }

  console.warn(
    "[generateLocalizedOptions] option ids diverged across locales; aligning by index",
    {
      primaryCount: primaryOptions.length,
      perLocale: results.map((r) => ({
        locale: r.locale,
        ids: r.options.map((o) => o.id),
      })),
    },
  );

  return Promise.all(
    primaryOptions.map(async (option, index) => {
      const byLocale: Partial<Record<Locale, LocalizedOptionPayload>> = {};
      for (const { locale, options } of results) {
        const match = options[index] ?? options.find((o) => o.id === option.id);
        if (match) {
          byLocale[locale] = { id: option.id, ...optionFieldsFrom(match) };
        }
      }
      return ensureCompleteOptionLocales(primary, byLocale, locales);
    }),
  );
}

export async function generateLocalizedOptions(params: {
  context: MediationContext;
  partyALocale?: string | null;
  partyBLocale?: string | null;
}): Promise<MediationOption[]> {
  const locales = artifactLocales(params.partyALocale, params.partyBLocale);
  const primary: Locale = "en";

  const results = await Promise.all(
    locales.map(async (locale) => {
      const result = await runMediationAgent({
        mode: "options",
        context: params.context,
        schema: mediationOptionsSchema,
        targetLocale: locale,
      });
      const options = await Promise.all(
        result.options.map(async (option) => ({
          id: option.id,
          ...(await repairOptionFieldsLocale(optionFieldsFrom(option), locale)),
        })),
      );
      return { locale, options };
    }),
  );

  return mergeLocalizedOptionResults({ results, locales, primary });
}

export async function generateLocalizedCompromise(params: {
  context: MediationContext;
  extraInstruction: string;
  partyALocale?: string | null;
  partyBLocale?: string | null;
}): Promise<MediationOption> {
  const locales = artifactLocales(params.partyALocale, params.partyBLocale);
  const primary: Locale = "en";
  const byLocale: Partial<Record<Locale, LocalizedOptionPayload>> = {};

  let sharedId: string | null = null;
  for (const locale of locales) {
    const compromise = await runMediationAgent({
      mode: "compromise",
      context: params.context,
      schema: mediationCompromiseSchema,
      targetLocale: locale,
      extraInstruction: params.extraInstruction,
    });
    sharedId = sharedId ?? compromise.option.id;
    const repaired = await repairOptionFieldsLocale(
      optionFieldsFrom(compromise.option),
      locale,
    );
    byLocale[locale] = {
      id: sharedId,
      ...repaired,
    };
  }

  return ensureCompleteOptionLocales(primary, byLocale, locales);
}

export async function generateLocalizedAgreementDraft(params: {
  context: MediationContext;
  /** Prefer a per-locale builder so each generation gets locale-matched option text. */
  extraInstruction: string | ((locale: Locale) => string);
  partyALocale?: string | null;
  partyBLocale?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalize: (raw: any) => DraftAgreement;
  status: DraftAgreement["status"];
  publishedAt?: string;
}): Promise<DraftAgreement> {
  const locales = artifactLocales(params.partyALocale, params.partyBLocale);
  const primary: Locale = "en";
  const byLocale: Partial<Record<Locale, ReturnType<typeof draftFieldsFrom>>> = {};

  let baseMeta: DraftAgreement | null = null;

  for (const locale of locales) {
    const extra =
      typeof params.extraInstruction === "function"
        ? params.extraInstruction(locale)
        : params.extraInstruction;

    const draft = await runMediationAgent({
      mode: "agreement_draft",
      context: params.context,
      schema: mediationAgreementDraftSchema,
      targetLocale: locale,
      extraInstruction: extra,
    });

    const agreement = params.normalize({
      ...draft,
      generatedAt: new Date().toISOString(),
      status: params.status,
      publishedAt: params.publishedAt,
    });
    byLocale[locale] = await repairDraftFieldsLocale(draftFieldsFrom(agreement), locale);
    if (!baseMeta) baseMeta = agreement;
  }

  if (!baseMeta) throw new Error("Failed to generate agreement draft.");

  return mergeDraftLocales(normalizeLocale(primary), baseMeta, byLocale);
}
