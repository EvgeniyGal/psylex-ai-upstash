"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { completeOnboarding, updateTestStatus } from "@/app/onboarding/actions";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useUserRealtime } from "@/hooks/use-room-realtime";
import { getRoleCopy } from "@/lib/portal-i18n";
import { fadeInUp, scaleIn } from "@/lib/motion";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";
import type { ParticipantRole } from "@/lib/participant-roles";
import { buildTestUrl } from "@/lib/test-links";
import type { TestKey } from "@/lib/test-keys";

const openTestButtonClass =
  "flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-hair bg-surface-container px-3 py-2 text-ink transition-colors hover:border-[#c9ced6] sm:w-auto sm:shrink-0 sm:justify-start sm:py-1";
const passedBadgeClass =
  "flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-party-a-line bg-party-a-fill px-3 py-2 text-party-a sm:w-auto sm:shrink-0 sm:justify-start sm:py-1";
const failedBadgeClass =
  "flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-risk-line bg-risk-fill px-3 py-2 text-risk sm:w-auto sm:shrink-0 sm:justify-start sm:py-1";
const testCardClass =
  "test-card relative flex w-full flex-col gap-4 rounded border border-hair border-t-[3px] border-t-law bg-surface-container p-6 text-left transition-all sm:flex-row sm:items-center";
const testActionsClass =
  "flex w-full flex-col items-stretch gap-2 border-t border-hair pt-4 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:border-t-0 sm:pt-0";
const testActionsEndClass =
  "flex w-full flex-col items-stretch gap-2 border-t border-hair pt-4 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:border-t-0 sm:pt-0";

type TestDefinition = {
  key: TestKey;
  url: string;
  completed: boolean;
};

type TestingDashboardProps = {
  userId: string;
  role: ParticipantRole;
  login: string;
  tests: TestDefinition[];
  testsComplete: boolean;
  personalBotReady: boolean;
  canProceed: boolean;
  flowStep: ParticipantFlowStepId;
  review?: boolean;
  refreshRequested?: boolean;
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export function TestingDashboard({
  userId,
  role,
  login,
  tests,
  testsComplete,
  personalBotReady,
  canProceed,
  flowStep,
  review = false,
  refreshRequested = false,
}: TestingDashboardProps) {
  const router = useRouter();
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isNextStepPending, startNextStepTransition] = useTransition();

  const openTest = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdateStatus = () => {
    startUpdateTransition(async () => {
      await updateTestStatus();
      router.refresh();
    });
  };

  const handleNextStep = () => {
    startNextStepTransition(async () => {
      await completeOnboarding();
    });
  };

  useUserRealtime(
    userId,
    () => {
      void updateTestStatus()
        .then(() => router.refresh())
        .catch(() => {
          // ignore transient refresh errors
        });
    },
    {
      enabled: !review && !canProceed,
    },
  );

  const showUpdateTestButton = !review && !testsComplete;
  const showUpdateBotButton = !review && testsComplete && !personalBotReady;
  const completedCount = tests.filter((t) => t.completed).length;

  return (
    <PortalPageShell flowStep={flowStep}>
      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col items-center justify-center px-margin-mobile py-stack-lg md:px-margin-desktop">
        <motion.div
          className="flex w-full max-w-4xl flex-col gap-stack-md"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div className="mb-4 text-center" variants={fadeInUp}>
            <h1 className="mb-2 font-display text-display-lg">{roleCopy.testsTitle}</h1>
            <p className="font-sans text-body-lg text-on-surface-variant">{roleCopy.testsSubtitle}</p>
            {refreshRequested ? (
              <p className="mx-auto mt-4 max-w-xl rounded-lg border border-law/40 bg-law-fill/40 px-4 py-3 text-body-sm text-on-surface">
                {t.profileRefreshBanner}
              </p>
            ) : null}
            <div className="mx-auto mt-4 flex max-w-xs items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-hair">
                <motion.div
                  className="h-full rounded-full bg-party-a"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / tests.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </div>
              <span className="text-body-sm font-medium text-ink-soft">
                {completedCount}/{tests.length}
              </span>
            </div>
          </motion.div>

          <div className="flex w-full flex-col gap-stack-sm">
            {tests.map((test, i) => {
              const meta = t.testMeta[test.key];
              const testUrl = buildTestUrl(test.url, login);
              const showOpenTest = !review && !test.completed && !!testUrl;

              return (
                <motion.div
                  key={test.key}
                  className={testCardClass}
                  variants={scaleIn}
                >
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-1 ${
                      test.completed ? "bg-success" : "bg-error"
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        test.completed
                          ? "bg-success/15 text-success"
                          : "bg-error/15 text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined">{meta.icon}</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-display text-headline-md text-on-surface">
                        {meta.title}
                      </h3>
                      <p
                        className={`font-sans text-body-sm ${
                          test.completed ? "text-on-surface-variant" : "text-error"
                        }`}
                      >
                        {test.completed ? meta.subtitle : t.pendingCompletion}
                      </p>
                    </div>
                  </div>

                  <div className={showOpenTest ? testActionsClass : testActionsEndClass}>
                    {showOpenTest ? (
                      <button
                        className={openTestButtonClass}
                        onClick={() => openTest(testUrl)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        <span className="font-display text-label-md uppercase">{t.openTest}</span>
                      </button>
                    ) : null}
                    {test.completed ? (
                      <motion.div
                        className={passedBadgeClass}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="font-display text-label-md uppercase">{t.passed}</span>
                      </motion.div>
                    ) : (
                      <div className={failedBadgeClass}>
                        <span className="material-symbols-outlined text-sm">pending</span>
                        <span className="font-display text-label-md uppercase">{t.notPassed}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <motion.div className={testCardClass} variants={scaleIn}>
              <div
                className={`absolute bottom-0 left-0 top-0 w-1 ${
                  personalBotReady ? "bg-success" : "bg-error"
                }`}
              />
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    personalBotReady
                      ? "bg-success/15 text-success"
                      : "bg-error/15 text-error"
                  } ${testsComplete && !personalBotReady ? "glow-ring" : ""}`}
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h3 className="mb-1 font-display text-headline-md text-on-surface">
                    {t.personalBoardTitle}
                  </h3>
                  <p
                    className={`font-sans text-body-sm ${
                      personalBotReady
                        ? "text-on-surface-variant"
                        : testsComplete
                          ? "text-error"
                          : "text-outline"
                    }`}
                  >
                    {personalBotReady
                      ? t.personalBoardReadySubtitle
                      : testsComplete
                        ? t.personalBoardPendingSubtitle
                        : t.personalBoardLockedSubtitle}
                  </p>
                </div>
              </div>

              <div className={testActionsEndClass}>
                {personalBotReady ? (
                  <motion.div
                    className={passedBadgeClass}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="font-display text-label-md uppercase">{t.personalBoardReady}</span>
                  </motion.div>
                ) : (
                  <div className={failedBadgeClass}>
                    <span className="material-symbols-outlined text-sm">
                      {testsComplete ? "hourglass_top" : "lock"}
                    </span>
                    <span className="font-display text-label-md uppercase">{t.personalBoardPending}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-stack-md flex w-full flex-col items-center gap-stack-sm"
            variants={fadeInUp}
          >
            {!review ? (
              <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
                <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Hint:</span> {t.testsHint}
                </p>
              </div>
            ) : null}
            {showUpdateTestButton ? (
              <button
                className="btn-secondary flex w-full items-center justify-center gap-2 px-6 py-3 text-body-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={isUpdatePending}
                onClick={handleUpdateStatus}
                type="button"
              >
                {isUpdatePending ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="material-symbols-outlined text-base">sync</span>
                )}
                {isUpdatePending ? t.proceedLoading : t.updateTestStatus}
              </button>
            ) : null}
            {showUpdateBotButton ? (
              <button
                className="btn-secondary flex w-full items-center justify-center gap-2 px-6 py-3 text-body-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={isUpdatePending}
                onClick={handleUpdateStatus}
                type="button"
              >
                {isUpdatePending ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                )}
                {isUpdatePending ? t.proceedLoading : t.updateBotStatus}
              </button>
            ) : null}
            {review ? (
              <>
                <FlowReviewNext step={2} />
                <p className="text-center">
                  <Link className="text-body-sm text-on-surface-variant underline" href="/room">
                    {t.flowReviewBackToCurrent}
                  </Link>
                </p>
              </>
            ) : (
              <button
                className="btn-primary mt-4 flex w-full items-center justify-center gap-2 px-8 py-4 font-sans text-body-lg font-bold disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={!canProceed || isNextStepPending}
                onClick={handleNextStep}
                type="button"
              >
                {isNextStepPending ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    {t.proceedLoading}
                  </>
                ) : (
                  t.nextStep
                )}
              </button>
            )}
          </motion.div>
        </motion.div>
      </main>
    </PortalPageShell>
  );
}
