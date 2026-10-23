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
import { SUPPORTED_MESSAGE_LOCALES } from "@/lib/mediation/translate";
import type { DraftAgreement, MediationOption } from "@/lib/mediation/types";
import { normalizeLocale } from "@/lib/pipeline/locale";

/** Always generate both product languages for documents and cross-locale rooms. */
const ARTIFACT_LOCALES: Locale[] = SUPPORTED_MESSAGE_LOCALES;

function artifactLocales(_partyALocale?: string | null, _partyBLocale?: string | null): Locale[] {
  return [...ARTIFACT_LOCALES];
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

  const byId = new Map<
    string,
    Partial<Record<Locale, ReturnType<typeof optionFieldsFrom> & { id: string }>>
  >();

  for (const { locale, options } of results) {
    for (const option of options) {
      const existing = byId.get(option.id) ?? {};
      existing[locale] = { id: option.id, ...optionFieldsFrom(option) };
      byId.set(option.id, existing);
    }
  }

  // If ids diverge across locales, fall back to index alignment from primary result.
  const primaryCount = results.find((r) => r.locale === primary)?.options.length ?? 0;
  if (byId.size === 0 || (locales.length > 1 && byId.size < primaryCount)) {
    console.warn(
      "[generateLocalizedOptions] option ids diverged across locales; aligning by index",
      { byIdSize: byId.size, primaryCount },
    );
    const primaryOptions =
      results.find((r) => r.locale === primary)?.options ?? results[0]?.options ?? [];
    return primaryOptions.map((option, index) => {
      const byLocale: Partial<
        Record<Locale, ReturnType<typeof optionFieldsFrom> & { id: string }>
      > = {};
      for (const { locale, options } of results) {
        const match = options[index] ?? options.find((o) => o.id === option.id) ?? option;
        byLocale[locale] = { id: option.id, ...optionFieldsFrom(match) };
      }
      return mergeOptionLocales(primary, byLocale);
    });
  }

  return [...byId.values()].map((byLocale) => mergeOptionLocales(primary, byLocale));
}

export async function generateLocalizedCompromise(params: {
  context: MediationContext;
  extraInstruction: string;
  partyALocale?: string | null;
  partyBLocale?: string | null;
}): Promise<MediationOption> {
  const locales = artifactLocales(params.partyALocale, params.partyBLocale);
  const primary: Locale = "en";
  const byLocale: Partial<
    Record<Locale, ReturnType<typeof optionFieldsFrom> & { id: string }>
  > = {};

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

  return mergeOptionLocales(primary, byLocale);
}

export async function generateLocalizedAgreementDraft(params: {
  context: MediationContext;
  /** Prefer a per-locale builder so each generation gets locale-matched option text. */
  extraInstruction: string | ((locale: Locale) => string);
  partyALocale?: string | null;
  partyBLocale?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalize: (raw: any, opts: { suggestProtectiveIds: string[] }) => DraftAgreement;
  mergeProtective: (draft: DraftAgreement, ids: string[], locale: Locale) => DraftAgreement;
  suggestedProtectiveIds: string[];
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

    let agreement = params.normalize(
      {
        ...draft,
        generatedAt: new Date().toISOString(),
        status: params.status,
        publishedAt: params.publishedAt,
      },
      { suggestProtectiveIds: params.suggestedProtectiveIds },
    );
    agreement = params.mergeProtective(agreement, params.suggestedProtectiveIds, locale);
    byLocale[locale] = await repairDraftFieldsLocale(draftFieldsFrom(agreement), locale);
    if (!baseMeta) baseMeta = agreement;
  }

  if (!baseMeta) throw new Error("Failed to generate agreement draft.");

  return mergeDraftLocales(normalizeLocale(primary), baseMeta, byLocale);
}
