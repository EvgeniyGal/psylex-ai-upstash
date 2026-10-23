import type { Locale } from "@/lib/i18n";
import { repairTextLocale, translateText } from "@/lib/mediation/translate";
import { normalizeLocale } from "@/lib/pipeline/locale";
import type {
  QuestionCandidate,
  QuestionCandidateLocaleFields,
} from "@/lib/mediator-session/types";

export function candidateFieldsFrom(
  fields: QuestionCandidateLocaleFields,
): QuestionCandidateLocaleFields {
  return {
    canonicalContent: fields.canonicalContent,
    partyA: fields.partyA,
    partyB: fields.partyB,
  };
}

export function resolveQuestionCandidate(
  candidate: QuestionCandidate,
  locale: Locale | string | null | undefined,
): QuestionCandidateLocaleFields & { id: string } {
  const lang = normalizeLocale(locale);
  const localized = candidate.byLocale?.[lang];
  if (localized) return { id: candidate.id, ...candidateFieldsFrom(localized) };
  return {
    id: candidate.id,
    canonicalContent: candidate.canonicalContent,
    partyA: candidate.partyA,
    partyB: candidate.partyB,
  };
}

async function repairCandidateFields(
  fields: QuestionCandidateLocaleFields,
  targetLocale: Locale,
): Promise<QuestionCandidateLocaleFields> {
  const [canonicalContent, partyA, partyB] = await Promise.all([
    repairTextLocale(fields.canonicalContent, targetLocale),
    repairTextLocale(fields.partyA, targetLocale),
    repairTextLocale(fields.partyB, targetLocale),
  ]);
  return { canonicalContent, partyA, partyB };
}

async function translateCandidateFields(
  fields: QuestionCandidateLocaleFields,
  from: Locale,
  to: Locale,
): Promise<QuestionCandidateLocaleFields> {
  const [canonicalContent, partyA, partyB] = await Promise.all([
    translateText({ text: fields.canonicalContent, from, to }),
    translateText({ text: fields.partyA, from, to }),
    translateText({ text: fields.partyB, from, to }),
  ]);
  return { canonicalContent, partyA, partyB };
}

type LocaleRun = {
  locale: Locale;
  candidates: (QuestionCandidateLocaleFields & { id: string })[];
};

function idsFullyAligned(primary: LocaleRun, other: LocaleRun): boolean {
  if (primary.candidates.length !== other.candidates.length) return false;
  return primary.candidates.every((c) => other.candidates.some((o) => o.id === c.id));
}

/**
 * Merge parallel en/uk candidate generations for one party bucket.
 * Index-align when ids diverge so we never double the list.
 */
export async function mergeCandidateLocaleRuns(params: {
  primaryLocale: Locale;
  locales: Locale[];
  runs: LocaleRun[];
}): Promise<QuestionCandidate[]> {
  const primaryRun =
    params.runs.find((r) => r.locale === params.primaryLocale) ?? params.runs[0];
  if (!primaryRun || primaryRun.candidates.length === 0) return [];

  const others = params.runs.filter((r) => r.locale !== primaryRun.locale);
  const aligned = others.every((o) => idsFullyAligned(primaryRun, o));
  if (!aligned) {
    console.warn(
      "[mergeCandidateLocaleRuns] candidate ids diverged; aligning by index",
      {
        primaryIds: primaryRun.candidates.map((c) => c.id),
        others: others.map((o) => ({
          locale: o.locale,
          ids: o.candidates.map((c) => c.id),
        })),
      },
    );
  }

  return Promise.all(
    primaryRun.candidates.map(async (primaryCandidate, index) => {
      const byLocale: Partial<Record<Locale, QuestionCandidateLocaleFields>> = {
        [primaryRun.locale]: candidateFieldsFrom(primaryCandidate),
      };

      for (const run of params.runs) {
        if (run.locale === primaryRun.locale) continue;
        const match = aligned
          ? run.candidates.find((c) => c.id === primaryCandidate.id)
          : run.candidates[index];
        if (match) {
          byLocale[run.locale] = await repairCandidateFields(
            candidateFieldsFrom(match),
            run.locale,
          );
        }
      }

      for (const locale of params.locales) {
        if (byLocale[locale]) continue;
        const sourceLocale =
          (Object.keys(byLocale)[0] as Locale | undefined) ?? primaryRun.locale;
        const source = byLocale[sourceLocale] ?? candidateFieldsFrom(primaryCandidate);
        byLocale[locale] = await repairCandidateFields(
          await translateCandidateFields(source, sourceLocale, locale),
          locale,
        );
      }

      const primaryFields =
        byLocale[params.primaryLocale] ?? candidateFieldsFrom(primaryCandidate);

      return {
        id: primaryCandidate.id,
        ...primaryFields,
        byLocale,
      };
    }),
  );
}
