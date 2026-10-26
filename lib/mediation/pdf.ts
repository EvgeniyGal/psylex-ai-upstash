import type { Locale } from "@/lib/i18n";
import { buildAdminMediationDownload } from "@/lib/mediation/admin-room-details";
import { generateMediationPdf } from "@/lib/mediation/generate-pdf";
import {
  buildMediationResultsSummary,
  type MediationResultsSummary,
  type MediationResultsSummaryInput,
} from "@/lib/mediation/results-summary";
import { portalCopy } from "@/lib/portal-i18n";

function formatLegislationChapterBody(summary: MediationResultsSummary) {
  if (summary.legislationSections.length === 0) {
    return summary.legislation;
  }

  return summary.legislationSections
    .map((section) => `${section.heading}\n${section.body}`)
    .join("\n\n");
}

function formatDraftAgreementChapterBody(params: {
  agreementBody: string | null;
  terms: string[];
  termsHeading: string;
  notAvailable: string;
}) {
  const parts: string[] = [];

  if (params.agreementBody?.trim()) {
    parts.push(params.agreementBody.trim());
  }

  if (params.terms.length > 0) {
    const terms = params.terms.map((term) => `• ${term}`).join("\n");
    parts.push(`${params.termsHeading}\n${terms}`);
  }

  if (parts.length === 0) {
    return params.notAvailable;
  }

  return parts.join("\n\n");
}

export async function buildAgreementDownloadFromSummary(
  summary: MediationResultsSummary,
  locale: Locale = "en",
) {
  const copy = portalCopy[locale];
  const termsHeading = locale === "uk" ? "Умови" : "Terms";

  const sections = [
    {
      heading: copy.mediationPdfLegislation,
      body: formatLegislationChapterBody(summary),
    },
    {
      heading: copy.mediationPdfSolution,
      body: summary.solution,
    },
    {
      heading: copy.mediationAgreementTitle,
      body: formatDraftAgreementChapterBody({
        agreementBody: summary.agreementBody,
        terms: summary.terms,
        termsHeading,
        notAvailable: copy.mediationPdfNotAvailable,
      }),
    },
  ].map((section, index) => ({
    heading: `${index + 1}. ${section.heading}`,
    body: section.body,
  }));

  const pdfBuffer = await generateMediationPdf({
    title: summary.agreementTitle,
    documentLabel: copy.mediationPdfDocumentTitle,
    companyName: copy.mediationPdfCompanyName,
    generatedAt: new Date(),
    sections,
    agreementBody: undefined,
    agreementHeading: copy.mediationAgreementTitle,
    terms: [],
    topDisclaimer: copy.mediationPdfTopDisclaimer,
    disclaimer: copy.mediationUplDisclaimer,
    termsHeading,
  });

  return {
    filename: "mediation-results.pdf",
    mimeType: "application/pdf",
    base64: pdfBuffer.toString("base64"),
  };
}

export async function buildAgreementDownload(
  state: MediationResultsSummaryInput,
  locale: Locale = "en",
) {
  const summary = await buildMediationResultsSummary(state, locale);
  return buildAgreementDownloadFromSummary(summary, locale);
}

export async function buildAdminAgreementDownload(roomId: string, locale: Locale = "en") {
  const { summary } = await buildAdminMediationDownload(roomId, locale);
  return buildAgreementDownloadFromSummary(summary, locale);
}
