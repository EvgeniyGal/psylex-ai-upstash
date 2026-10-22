import type { MediationOption } from "@/lib/mediation/types";

/** Extra instruction for agreement_draft including full selected option text. */
export function buildAgreementDraftExtraInstruction(params: {
  optionId: string;
  option: MediationOption | null;
  suggestedProtectiveIds: string[];
}) {
  const optionBlock = params.option
    ? [
        `Selected option id: ${params.optionId}`,
        `Canonical description: ${params.option.canonicalDescription}`,
        `Party A presentation (voting only, do NOT copy first-person into the agreement): ${params.option.partyA}`,
        `Party B presentation (voting only, do NOT copy first-person into the agreement): ${params.option.partyB}`,
        `Legal norms (information): ${params.option.legalNorms}`,
      ].join("\n")
    : `Selected option id: ${params.optionId}`;

  return [
    optionBlock,
    "",
    "Write the agreement body and obligations in third person referring to the parties by role or name.",
    "If the dialogue confirms different payment or duty terms than the option template, follow the dialogue.",
    `Suggested protective clause ids to consider incorporating when relevant: ${params.suggestedProtectiveIds.join(", ") || "(none)"}.`,
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
