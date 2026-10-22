import { eq } from "drizzle-orm";
import type { Locale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { formatViewerPsychodynamicProfile } from "@/lib/mediation/format-pdf-content";
import {
  buildLegislationSections,
  formatLegislationSections,
  type LegislationContentSection,
} from "@/lib/mediation/legislation-summary";
import type { PartyRole } from "@/lib/participant-roles";
import { getRoomPartiesForPipeline } from "@/lib/pipeline/gate";
import { portalCopy } from "@/lib/portal-i18n";

export type MediationResultsSummaryInput = {
  room: {
    id: string;
    selectedOptionId: string | null;
    draftAgreement: unknown;
  };
  options: Array<{
    id: string;
    description: string;
    canonicalDescription?: string | null;
    legalNorms?: string | null;
    fulfillmentProbability?: string | null;
    refusalRisks?: string | null;
  }>;
  compromise: {
    id: string;
    description: string;
    canonicalDescription?: string | null;
    legalNorms?: string | null;
    fulfillmentProbability?: string | null;
    refusalRisks?: string | null;
  } | null;
  viewerRole: PartyRole;
};

export type MediationResultsSummary = {
  psychodynamicProfile: string;
  legislation: string;
  legislationSections: LegislationContentSection[];
  solution: string;
  agreementTitle: string;
  agreementBody: string | null;
  terms: string[];
};

function findSelectedOption(state: MediationResultsSummaryInput) {
  const selectedId = state.room.selectedOptionId;
  if (!selectedId) return null;

  return (
    state.options.find((option) => option.id === selectedId) ??
    (state.compromise?.id === selectedId ? state.compromise : null)
  );
}

function termsFromDraft(draft: {
  title?: string;
  body?: string;
  terms?: string[];
  obligations?: Array<{ text: string; deadline?: string | null }>;
} | null): string[] {
  if (!draft) return [];
  if (draft.obligations && draft.obligations.length > 0) {
    return draft.obligations.map((o) =>
      o.deadline?.trim() ? `${o.text.trim()} (Deadline: ${o.deadline.trim()})` : o.text.trim(),
    );
  }
  return draft.terms ?? [];
}

export async function buildMediationResultsSummary(
  state: MediationResultsSummaryInput,
  locale: Locale = "en",
): Promise<MediationResultsSummary> {
  const draft = state.room.draftAgreement as {
    title?: string;
    body?: string;
    terms?: string[];
    obligations?: Array<{ text: string; deadline?: string | null }>;
  } | null;

  const copy = portalCopy[locale];
  const selectedOption = findSelectedOption(state);

  const [{ partyA, partyB }, [room]] = await Promise.all([
    getRoomPartiesForPipeline(state.room.id),
    db.select().from(rooms).where(eq(rooms.id, state.room.id)).limit(1),
  ]);

  const psychodynamicProfile =
    partyA && partyB
      ? formatViewerPsychodynamicProfile(state.viewerRole, partyA, partyB, locale)
      : copy.mediationPdfNotAvailable;

  const legislationSections = room
    ? buildLegislationSections({
        locale,
        room: {
          jurisdiction: room.jurisdiction,
          usaSubJurisdiction: room.usaSubJurisdiction,
          legalAnalysis: room.legalAnalysis,
        },
        optionLegalNorms: selectedOption?.legalNorms,
      })
    : [];

  const solutionParts: string[] = [];
  if (selectedOption) {
    const sharedSolution =
      selectedOption.canonicalDescription?.trim() ||
      draft?.body?.trim() ||
      selectedOption.description;
    solutionParts.push(sharedSolution);
    if (selectedOption.fulfillmentProbability) {
      solutionParts.push(`${copy.mediationFulfillment}: ${selectedOption.fulfillmentProbability}`);
    }
    if (selectedOption.refusalRisks) {
      solutionParts.push(`${copy.mediationRefusalRisks}: ${selectedOption.refusalRisks}`);
    }
  } else if (draft?.body?.trim()) {
    solutionParts.push(draft.body.trim());
  }

  return {
    psychodynamicProfile,
    legislationSections,
    legislation:
      legislationSections.length > 0
        ? formatLegislationSections(legislationSections)
        : copy.mediationPdfNotAvailable,
    solution: solutionParts.join("\n\n") || copy.mediationNoAgreementOutcome,
    agreementTitle: draft?.title ?? copy.mediationAgreementTitle,
    agreementBody: draft?.body ?? null,
    terms: termsFromDraft(draft),
  };
}
