"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { submitDisputeIntake } from "@/app/dispute-intake/actions";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import {
  dismissModeAIntakeToast,
  showModeAIntakeToast,
} from "@/hooks/use-mode-a-wait-toasts";
import { fadeInUp } from "@/lib/motion";

const textareaClass =
  "w-full rounded-md border border-outline-variant/40 bg-surface-container px-4 py-3 font-sans text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-law focus:bg-paper focus:ring-2 focus:ring-law/20";

const readOnlyFieldClass =
  "w-full rounded-md border border-outline-variant/40 bg-surface-container px-4 py-3 font-sans text-body-md text-on-surface shadow-sm";

function SubmitButton({
  label,
  loadingLabel,
  toastMessage,
}: {
  label: string;
  loadingLabel: string;
  toastMessage: string;
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      showModeAIntakeToast(toastMessage);
      return () => dismissModeAIntakeToast();
    }
    dismissModeAIntakeToast();
  }, [pending, toastMessage]);

  return (
    <button
      className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-4 font-display text-label-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <Spinner size="sm" className="text-white" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

type DisputeAnswers = {
  disputeDescription: string;
  disputePriority: string;
  disputeAcceptableOutcome: string;
};

type DisputeIntakeFormProps = {
  review?: boolean;
  answers?: DisputeAnswers;
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export function DisputeIntakeForm({ review = false, answers }: DisputeIntakeFormProps) {
  const { portal: t } = useLocale();

  return (
    <PortalPageShell flowStep={3}>
      <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="mb-2 font-display text-display-lg text-on-surface">{t.disputeIntakeTitle}</h1>
          <p className="font-sans text-body-lg text-on-surface-variant">{t.disputeIntakeSubtitle}</p>
        </motion.div>

        {review && answers ? (
          <motion.div
            className="flex flex-col gap-stack-md"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex flex-col gap-2" variants={fadeInUp}>
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ1}</span>
              <p className={`${readOnlyFieldClass} min-h-32 whitespace-pre-wrap`}>{answers.disputeDescription}</p>
            </motion.div>
            <motion.div className="flex flex-col gap-2" variants={fadeInUp}>
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ2}</span>
              <p className={`${readOnlyFieldClass} min-h-24 whitespace-pre-wrap`}>{answers.disputePriority}</p>
            </motion.div>
            <motion.div className="flex flex-col gap-2" variants={fadeInUp}>
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ3}</span>
              <p className={`${readOnlyFieldClass} min-h-24 whitespace-pre-wrap`}>{answers.disputeAcceptableOutcome}</p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <FlowReviewNext step={3} />
              <p className="mt-4 text-center">
                <Link className="text-body-sm text-on-surface-variant underline" href="/room">
                  {t.flowReviewBackToCurrent}
                </Link>
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            action={submitDisputeIntake}
            className="flex flex-col gap-stack-md"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.label className="flex flex-col gap-2" variants={fadeInUp}>
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ1}</span>
              <textarea
                className={`${textareaClass} min-h-32`}
                name="disputeDescription"
                required
                rows={5}
              />
            </motion.label>

            <motion.label className="flex flex-col gap-2" variants={fadeInUp}>
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ2}</span>
              <textarea
                className={`${textareaClass} min-h-24`}
                name="disputePriority"
                required
                rows={4}
              />
            </motion.label>

            <motion.label className="flex flex-col gap-2" variants={fadeInUp}>
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ3}</span>
              <textarea
                className={`${textareaClass} min-h-24`}
                name="disputeAcceptableOutcome"
                required
                rows={4}
              />
            </motion.label>

            <motion.div className="mt-4 flex justify-center" variants={fadeInUp}>
              <SubmitButton
                label={t.disputeIntakeSubmit}
                loadingLabel={t.disputeIntakeSubmitting}
                toastMessage={t.modeAToastIntakeSubmitting}
              />
            </motion.div>
          </motion.form>
        )}
      </main>
    </PortalPageShell>
  );
}
