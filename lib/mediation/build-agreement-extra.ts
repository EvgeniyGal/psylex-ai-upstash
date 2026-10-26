import type { Locale } from "@/lib/i18n";
import { resolveOptionForLocale } from "@/lib/mediation/localize-artifacts";
import type { MediationOption } from "@/lib/mediation/types";

/** Extra instruction for agreement_draft including full selected option text. */
export function buildAgreementDraftExtraInstruction(params: {
  optionId: string;
  option: MediationOption | null;
  /** When set, feed locale-matched option fields into the prompt (avoids EN contamination of UK drafts). */
  targetLocale?: Locale;
}) {
  const resolved = params.option
    ? resolveOptionForLocale(params.option, params.targetLocale ?? "en")
    : null;

  const optionBlock = resolved
    ? [
        `Selected option id: ${params.optionId}`,
        `Canonical description: ${resolved.canonicalDescription}`,
        `Party A presentation (voting only, do NOT copy first-person into the agreement): ${resolved.partyA}`,
        `Party B presentation (voting only, do NOT copy first-person into the agreement): ${resolved.partyB}`,
        `Legal norms (information): ${resolved.legalNorms}`,
      ].join("\n")
    : `Selected option id: ${params.optionId}`;

  return [
    optionBlock,
    "",
    "Write the agreement body and obligations in third person referring to the parties by role or name.",
    "If the dialogue confirms different payment or duty terms than the option template, follow the dialogue.",
    "Include only case-specific safeguards and obligations grounded in this dispute — do not invent generic neighbor, boundary, survey, or vegetation terms unless they are actually at issue.",
  ].join("\n");
}

export function findOptionInRoom(
  options: MediationOption[] | null | undefined,
  compromise: MediationOption | null | undefined,
  optionId: string,
): MediationOption | null {
  return (
    options?.find((o) => o.id === optionId) ??
    (compromise?.id === optionId ? compromise : null) ??
    null
  );
}
