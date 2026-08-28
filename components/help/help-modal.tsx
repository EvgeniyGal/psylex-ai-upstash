"use client";

import { useEffect, useState } from "react";
import { loadVisibleHelpDocuments } from "@/app/help/actions";
import { HelpMarkdown } from "@/components/help/help-markdown";
import { ModalOverlay } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import type { HelpDocument, HelpSlug } from "@/lib/help/types";
import { cn } from "@/lib/utils";

function slugLabel(slug: HelpSlug, portal: ReturnType<typeof useLocale>["portal"]) {
  if (slug === "overview") return portal.helpDocOverview;
  if (slug === "parties") return portal.helpDocParties;
  if (slug === "mediator") return portal.helpDocMediator;
  return portal.helpDocAdmin;
}

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, portal } = useLocale();
  const [fetched, setFetched] = useState<{ locale: string; documents: HelpDocument[] } | null>(null);
  const [activeSlug, setActiveSlug] = useState<HelpSlug | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadVisibleHelpDocuments(locale).then((docs) => {
      if (cancelled) return;
      setFetched({ locale, documents: docs });
      setActiveSlug((current) => {
        if (current && docs.some((doc) => doc.slug === current)) return current;
        return docs[0]?.slug ?? null;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, locale]);

  const documents = fetched?.locale === locale ? fetched.documents : [];
  const loading = open && fetched?.locale !== locale;
  const active = documents.find((doc) => doc.slug === activeSlug) ?? documents[0];

  return (
    <ModalOverlay open={open} onClose={onClose} panelClassName="w-full max-w-5xl">
      <div className="flex max-h-[88vh] flex-col overflow-hidden rounded border border-hair bg-surface-container shadow-modal">
        <div className="flex items-center justify-between gap-3 border-b border-hair px-6 py-4">
          <h2 className="font-display text-[22px] font-medium leading-tight text-ink">{portal.helpTitle}</h2>
          <button
            className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full border border-hair bg-paper text-ink-soft transition-colors hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-hair p-3 md:w-56 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
            {documents.map((doc) => (
              <button
                className={cn(
                  "rounded-md px-3 py-2 text-left text-body-sm transition-colors",
                  active?.slug === doc.slug
                    ? "bg-law-fill font-medium text-ink"
                    : "text-ink-soft hover:bg-paper hover:text-ink",
                )}
                key={doc.slug}
                onClick={() => setActiveSlug(doc.slug)}
                type="button"
              >
                {slugLabel(doc.slug, portal)}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : !active ? (
              <p className="text-body-md text-ink-soft">{portal.helpNoDocuments}</p>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap gap-2">
                  <a
                    className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-body-sm"
                    href={`/api/help/download?slug=${active.slug}&format=pdf&locale=${locale}`}
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    {portal.helpDownloadPdf}
                  </a>
                  <a
                    className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-body-sm"
                    href={`/api/help/download?slug=${active.slug}&format=docx&locale=${locale}`}
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    {portal.helpDownloadDocx}
                  </a>
                </div>
                <HelpMarkdown
                  markdown={active.body}
                  onDocLink={(slug) => {
                    if (documents.some((doc) => doc.slug === slug)) {
                      setActiveSlug(slug);
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
