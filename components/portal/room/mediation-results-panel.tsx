"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { fadeInUp } from "@/lib/motion";
import type { LegislationContentSection } from "@/lib/mediation/legislation-summary";
import type { MediationResultsSummary } from "@/lib/mediation/results-summary";

type MediationResultsPanelProps = {
  summary: MediationResultsSummary;
};

const chapterStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

function ChapterSection({
  index,
  heading,
  children,
}: {
  index: number;
  heading: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      className="rounded-xl border border-hair bg-surface-container/40 p-5 md:p-6"
      variants={fadeInUp}
    >
      <div className="mb-4 flex items-center gap-3 border-b border-hair pb-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-law/40 bg-law-fill/40 text-label-sm font-semibold text-on-surface">
          {index}
        </span>
        <h3 className="font-display text-headline-sm text-on-surface">{heading}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function SubchapterSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-hair bg-paper p-4">
      <h4 className="font-display text-headline-sm text-on-surface">{heading}</h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function LegislationSubsection({
  section,
  excerptLabel,
  relevanceLabel,
  sourceLabel,
}: {
  section: LegislationContentSection;
  excerptLabel: string;
  relevanceLabel: string;
  sourceLabel: string;
}) {
  if (section.kind === "laws" && section.laws?.length) {
    return (
      <div className="space-y-3">
        {section.laws.map((law, index) => (
          <article className="rounded-lg border border-hair bg-[#F7F5F0] p-4" key={`${law.name}-${index}`}>
            <h4 className="font-display text-headline-sm text-on-surface">{law.name}</h4>
            <p className="mt-2 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {law.summary}
            </p>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{relevanceLabel}:</strong> {law.relevance}
            </p>
          </article>
        ))}
      </div>
    );
  }

  if (section.kind === "regulations" && section.regulations?.length) {
    return (
      <div className="space-y-3">
        {section.regulations.map((regulation, index) => (
          <article
            className="rounded-lg border border-hair bg-[#F7F5F0] p-4"
            key={`${regulation.name}-${index}`}
          >
            <h4 className="font-display text-headline-sm text-on-surface">{regulation.name}</h4>
            <p className="mt-2 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {regulation.summary}
            </p>
          </article>
        ))}
      </div>
    );
  }

  if (section.kind === "citations" && section.citations?.length) {
    return (
      <div className="space-y-3">
        {section.citations.map((citation, index) => (
          <article
            className="rounded-lg border border-hair bg-[#F7F5F0] p-4"
            key={`${citation.documentName}-${index}`}
          >
            <h4 className="font-display text-headline-sm text-on-surface">{citation.documentName}</h4>
            <p className="mt-2 text-label-sm uppercase text-on-surface-variant">{excerptLabel}</p>
            <p className="mt-1 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {citation.excerpt}
            </p>
            {citation.sourceUrl ? (
              <p className="mt-3 text-body-sm">
                <span className="text-on-surface-variant">{sourceLabel}: </span>
                <a
                  className="break-all text-law underline underline-offset-2 hover:text-ink"
                  href={citation.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {citation.sourceUrl}
                </a>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">{section.body}</p>
  );
}

function formatDocumentDate(locale: string) {
  return new Date().toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function MediationResultsPanel({ summary }: MediationResultsPanelProps) {
  const { locale, portal: t } = useLocale();
  const [documentDate, setDocumentDate] = useState("");

  useEffect(() => {
    setDocumentDate(formatDocumentDate(locale));
  }, [locale]);

  return (
    <motion.article
      className="overflow-hidden rounded-xl border border-hair bg-paper shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="space-y-6 px-6 py-6 md:px-8"
        variants={chapterStagger}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          className="rounded-lg border border-law/50 bg-[#F7F5F0] p-4 text-body-sm leading-relaxed text-on-surface-variant"
          variants={fadeInUp}
        >
          {t.mediationPdfTopDisclaimer}
        </motion.p>

        <motion.div className="space-y-1 border-b border-hair pb-5" variants={fadeInUp}>
          <h2 className="font-display text-headline-lg text-on-surface">{summary.agreementTitle}</h2>
          <p className="text-body-sm text-on-surface-variant" suppressHydrationWarning>
            {documentDate}
          </p>
        </motion.div>

        <ChapterSection heading={t.mediationPdfLegislation} index={1}>
          {summary.legislationSections.length > 0 ? (
            summary.legislationSections.map((section, index) => (
              <SubchapterSection heading={section.heading} key={`${section.heading}-${index}`}>
                <LegislationSubsection
                  excerptLabel={t.mediationLegislationExcerpt}
                  relevanceLabel={t.mediationLegislationRelevance}
                  section={section}
                  sourceLabel={t.mediationLegislationSource}
                />
              </SubchapterSection>
            ))
          ) : (
            <p className="text-body-md text-on-surface-variant">{t.mediationPdfNotAvailable}</p>
          )}
        </ChapterSection>

        <ChapterSection heading={t.mediationPdfSolution} index={2}>
          <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
            {summary.solution}
          </p>
        </ChapterSection>

        <ChapterSection heading={t.mediationAgreementTitle} index={3}>
          {summary.agreementBody || summary.terms.length > 0 ? (
            <>
            {summary.agreementBody ? (
              <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
                {summary.agreementBody}
              </p>
            ) : null}
            {summary.terms.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-hair bg-paper p-4">
                <h4 className="font-display text-headline-sm text-on-surface">{t.mediationPdfTerms}</h4>
                <ul className="list-disc space-y-1 pl-5 text-body-md text-on-surface">
                  {summary.terms.map((term, index) => (
                    <li key={`${term}-${index}`}>{term}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            </>
          ) : (
            <p className="text-body-md text-on-surface-variant">{t.mediationPdfNotAvailable}</p>
          )}
        </ChapterSection>

        <motion.p
          className="rounded-lg border border-hair bg-surface-container p-4 text-body-sm leading-relaxed text-on-surface-variant"
          variants={fadeInUp}
        >
          {t.mediationUplDisclaimer}
        </motion.p>
      </motion.div>
    </motion.article>
  );
}
