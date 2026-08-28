"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { resetHelpDocumentAction, saveHelpDocumentAction } from "@/app/admin/settings/help-actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { HELP_SLUGS, type HelpDocument, type HelpSlug } from "@/lib/help/types";
import type { Locale } from "@/lib/i18n";

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

type HelpSettingsContentProps = {
  documents: HelpDocument[];
};

function slugLabel(slug: HelpSlug, admin: ReturnType<typeof useLocale>["admin"]) {
  if (slug === "overview") return admin.helpSlugOverview;
  if (slug === "parties") return admin.helpSlugParties;
  if (slug === "mediator") return admin.helpSlugMediator;
  return admin.helpSlugAdmin;
}

export function HelpSettingsContent({ documents }: HelpSettingsContentProps) {
  const { admin } = useLocale();
  const [slug, setSlug] = useState<HelpSlug>("overview");
  const [locale, setLocale] = useState<Locale>("uk");
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>(() => {
    const initial: Record<string, { title: string; body: string }> = {};
    for (const doc of documents) {
      initial[`${doc.slug}:${doc.locale}`] = { title: doc.title, body: doc.body };
    }
    return initial;
  });
  const [pending, startTransition] = useTransition();

  const key = `${slug}:${locale}`;
  const draft = useMemo(
    () => drafts[key] ?? { title: "", body: "" },
    [drafts, key],
  );

  const updateDraft = (patch: Partial<{ title: string; body: string }>) => {
    setDrafts((current) => ({
      ...current,
      [key]: { ...draft, ...patch },
    }));
  };

  const onSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("locale", locale);
      formData.set("title", draft.title);
      formData.set("body", draft.body);
      await saveHelpDocumentAction(formData);
      toast.success(admin.helpSaved);
    });
  };

  const onReset = () => {
    if (!window.confirm(admin.helpResetConfirm)) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("locale", locale);
      const restored = await resetHelpDocumentAction(formData);
      setDrafts((current) => ({
        ...current,
        [key]: { title: restored.title, body: restored.body },
      }));
      toast.success(admin.helpSaved);
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-body-sm text-on-surface-variant">{admin.helpSettingsSubtitle}</p>

      <div className="flex flex-wrap gap-2">
        {HELP_SLUGS.map((item) => (
          <button
            className={
              slug === item
                ? "rounded-full bg-law-fill px-4 py-2 font-display text-body-sm font-semibold text-ink"
                : "rounded-full px-4 py-2 font-display text-body-sm text-on-surface-variant hover:bg-paper"
            }
            key={item}
            onClick={() => setSlug(item)}
            type="button"
          >
            {slugLabel(item, admin)}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["uk", "en"] as const).map((item) => (
          <button
            className={
              locale === item
                ? "rounded-full border border-law bg-law-fill px-4 py-1.5 text-body-sm text-ink"
                : "rounded-full border border-hair px-4 py-1.5 text-body-sm text-ink-soft hover:text-ink"
            }
            key={item}
            onClick={() => setLocale(item)}
            type="button"
          >
            {item === "uk" ? admin.helpLocaleUk : admin.helpLocaleEn}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.helpDocTitleLabel}</label>
        <input
          className={inputClass}
          onChange={(event) => updateDraft({ title: event.target.value })}
          value={draft.title}
        />
      </div>

      <div>
        <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.helpDocBodyLabel}</label>
        <textarea
          className={`${inputClass} min-h-[28rem] font-mono text-[13px] leading-relaxed`}
          onChange={(event) => updateDraft({ body: event.target.value })}
          value={draft.body}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="btn-primary flex items-center gap-1.5 px-6 py-2.5 text-body-sm disabled:opacity-60"
          disabled={pending}
          onClick={onSave}
          type="button"
        >
          {pending ? <Spinner size="sm" className="text-white" /> : null}
          {admin.save}
        </button>
        <button
          className="btn-secondary px-6 py-2.5 text-body-sm disabled:opacity-60"
          disabled={pending}
          onClick={onReset}
          type="button"
        >
          {admin.helpReset}
        </button>
      </div>
    </div>
  );
}
