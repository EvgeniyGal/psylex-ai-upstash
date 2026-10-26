"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { toastActionError } from "@/lib/toast-action-error";
import {
  clickReadyForOptions,
  downloadMediationResults,
  fetchMediationRoomState,
  helpFormulateReply,
  sendDialogueReply,
  submitAgreementAcceptance,
  submitCompromiseVote,
  submitVote,
} from "@/app/(participant)/room/actions";
import { MediationCountdown } from "@/components/portal/mediation-countdown";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { MediationOptionsPanel } from "@/components/portal/room/mediation-options-panel";
import { MediationCompromisePanel } from "@/components/portal/room/mediation-compromise-panel";
import { MediationVotesDiscrepancyNotice } from "@/components/portal/room/mediation-votes-discrepancy-notice";
import { MediationResultsPanel } from "@/components/portal/room/mediation-results-panel";
import {
  MediationChat,
  MediationChatComposer,
  MediationChatStatusBar,
} from "@/components/portal/room/mediation-chat";
import { useLocale } from "@/components/locale-provider";
import { useModeARoomWaitToasts } from "@/hooks/use-mode-a-wait-toasts";
import { useDeadlineRefresh, useRoomRealtime } from "@/hooks/use-room-realtime";
import { fadeInUp } from "@/lib/motion";
import type { MediationPhase } from "@/lib/mediation/types";

type MediationRoomState = NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;

type MediationRoomProps = {
  initialState: MediationRoomState;
  viewerRole: "party_a" | "party_b";
  onPhaseChange?: (phase: MediationPhase | null) => void;
  review?: boolean;
};

function formatReplyRemaining(deadlineIso: string | null) {
  if (!deadlineIso) return null;
  const ms = new Date(deadlineIso).getTime() - Date.now();
  if (ms <= 0) return "00:00";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const panelTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export function MediationRoom({ initialState, viewerRole, onPhaseChange, review = false }: MediationRoomProps) {
  const { portal: t } = useLocale();
  const [state, setState] = useState(initialState);
  const [reply, setReply] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [formulatePending, startFormulate] = useTransition();

  const isSessionComplete = state.room.phase === "completed";

  useEffect(() => {
    if (review) return;
    onPhaseChange?.(state.room.phase);
  }, [onPhaseChange, review, state.room.phase]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediationRoomState();
      if (next) setState(next);
    } catch {
      // ignore transient realtime errors
    }
  }, []);

  const isAwaitingAgent = state.room.isAwaitingAgent;

  useRoomRealtime(state.room.id, () => {
    void refresh();
  }, {
    enabled: !review && !isSessionComplete,
    watchUsers: false,
    // Safety net while agent prepares the next question — SSE from after() can be missed.
    pollIntervalMs: isAwaitingAgent ? 2500 : undefined,
  });

  const sessionEndsAt = useMemo(() => {
    if (!state.room.mediationStartedAt) return null;
    return new Date(
      new Date(state.room.mediationStartedAt).getTime() +
        state.room.mediationDurationMinutes * 60_000,
    ).toISOString();
  }, [state.room.mediationStartedAt, state.room.mediationDurationMinutes]);

  useDeadlineRefresh(state.room.turnDeadlineAt, () => {
    void refresh();
  }, !review && !isSessionComplete);

  useDeadlineRefresh(sessionEndsAt, () => {
    void refresh();
  }, !review && !isSessionComplete);

  const isMyTurn =
    state.room.phase === "dialogue" && state.room.activeParty === viewerRole;
  const isOtherPartyAnswering =
    state.room.phase === "dialogue" && !!state.room.activeParty && state.room.activeParty !== viewerRole;

  // Deadline is set only after the question is inserted — source of truth for composer/toasts.
  const questionReady =
    state.room.phase !== "dialogue" ||
    !isMyTurn ||
    !!state.room.turnDeadlineAt;

  const [replyRemaining, setReplyRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!isMyTurn || !state.room.turnDeadlineAt) {
      setReplyRemaining(null);
      return;
    }

    const tick = () => setReplyRemaining(formatReplyRemaining(state.room.turnDeadlineAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isMyTurn, state.room.turnDeadlineAt]);

  const showReadyButton =
    state.room.phase === "opening" ||
    state.room.phase === "dialogue" ||
    state.room.phase === "generating_options";

  const draft = state.room.draftAgreement as {
    title?: string;
    body?: string;
    terms?: string[];
  } | null;

  const onSendReply = () => {
    const text = reply.trim();
    if (!text) return;
    setReply("");
    startTransition(async () => {
      try {
        const result = await sendDialogueReply(text);
        if (result.moderated) toast.message(t.mediationAttackRedirected);
        await refresh();
      } catch (error) {
        setReply(text);
        toastActionError(error, t.modeAToastSendFailedRetry);
      }
    });
  };

  const onReady = () => {
    startTransition(async () => {
      try {
        const next = await clickReadyForOptions();
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onVote = (optionId: string) => {
    startTransition(async () => {
      try {
        const next = await submitVote(optionId);
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onCompromiseVote = (accepted: boolean) => {
    startTransition(async () => {
      try {
        const next = await submitCompromiseVote(accepted);
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onAccept = () => {
    startTransition(async () => {
      try {
        const next = await submitAgreementAcceptance();
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onDownload = () => {
    startTransition(async () => {
      try {
        const file = await downloadMediationResults();
        const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.filename;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onEmailPlaceholder = () => {
    toast.message(t.mediationEmailComingSoon);
  };

  const resultsSummary = "resultsSummary" in state ? state.resultsSummary : undefined;

  const votesDiffer =
    !!state.room.partyAVoteOptionId &&
    !!state.room.partyBVoteOptionId &&
    state.room.partyAVoteOptionId !== state.room.partyBVoteOptionId;

  const showOptionsPanel = state.options.length > 0 && (review || votesDiffer || state.room.phase === "voting");
  const showCompromisePanel = votesDiffer && !!state.compromise;
  const isCompromiseGenerating = votesDiffer && !state.compromise && !review;

  const waitingOtherReady = !!(
    showReadyButton &&
    state.room.selfReady &&
    !state.room.otherReady
  );
  const waitingOtherAccept = !!(
    state.room.phase === "agreement" &&
    state.room.selfAccepted &&
    !state.room.otherAccepted
  );
  const otherReadyForOptions = !!(showReadyButton && state.room.otherReady);

  useModeARoomWaitToasts({
    phase: state.room.phase,
    isAwaitingAgent,
    isMyTurn,
    isOtherPartyAnswering,
    questionReady,
    hasOptions: state.options.length > 0,
    hasCompromise: !!state.compromise,
    hasDraftAgreement: !!draft,
    isCompromiseGenerating,
    waitingOtherReady,
    waitingOtherAccept,
    otherReadyForOptions,
    needsOptionsVote: !state.room.selfVote,
    needsCompromiseVote: state.room.selfCompromiseVote == null,
    needsAgreementAccept: !state.room.selfAccepted,
    enabled: !review && !isSessionComplete,
  });

  const optionsPanel = showOptionsPanel ? (
    <MediationOptionsPanel
      canVote={!review && state.room.phase === "voting" && !state.room.selfVote}
      onVote={review ? undefined : onVote}
      options={state.options}
      partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
      partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
      pending={pending}
      phase={state.room.phase}
      review={review}
      selectedOptionId={state.room.selectedOptionId}
      selfVote={state.room.selfVote}
      showHeading={review || votesDiffer || state.room.phase !== "voting"}
      viewerRole={viewerRole}
    />
  ) : null;

  const compromisePanel = showCompromisePanel ? (
    <MediationCompromisePanel
      compromise={state.compromise!}
      onAccept={review ? undefined : () => onCompromiseVote(true)}
      onReject={review ? undefined : () => onCompromiseVote(false)}
      options={state.options}
      partyACompromiseVote={state.room.partyACompromiseVote ?? null}
      partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
      partyBCompromiseVote={state.room.partyBCompromiseVote ?? null}
      partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
      pending={pending}
      phase={state.room.phase}
      review={review}
      selectedOptionId={state.room.selectedOptionId}
      selfCompromiseVote={state.room.selfCompromiseVote}
    />
  ) : null;

  const reviewOptionsPanel = review ? optionsPanel : null;
  const reviewCompromisePanel = review ? compromisePanel : null;

  const chatLabels = {
    you: t.mediationYou,
    agent: t.mediationAgent,
    system: t.mediationSystem,
    preparing: t.mediationPreparing,
    translatedBadge: t.mediationTranslatedBadge,
    showOriginal: t.mediationShowOriginal,
    hideOriginal: t.mediationHideOriginal,
  };

  const onHelpFormulate = () => {
    const draft = reply.trim();
    if (!draft) return;
    startFormulate(async () => {
      try {
        const rewritten = await helpFormulateReply(draft);
        setReply(rewritten);
      } catch {
        toast.error(t.mediationHelpFormulateFailed);
      }
    });
  };

  const chatStatusHeader = (
    <MediationChatStatusBar tone={isMyTurn ? "own" : "neutral"}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-on-surface shadow-sm">
        <span className="material-symbols-outlined text-[16px] text-tertiary">forum</span>
        {t.mediationPhases[state.room.phase ?? "opening"]}
      </span>
      {state.room.phase === "dialogue" ? (
        <>
          <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-medium text-on-surface shadow-sm">
            {t.mediationRoundLabel} {state.room.round}
          </span>
          {isMyTurn ? (
            <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-law">
              <span className="material-symbols-outlined text-[18px]">edit_square</span>
              {t.mediationYourTurn}
            </span>
          ) : null}
          {isMyTurn ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 font-mono text-[12px] font-semibold text-law shadow-sm">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              {replyRemaining ?? "--:--"}
            </span>
          ) : null}
        </>
      ) : null}
    </MediationChatStatusBar>
  );

  const chatComposer =
    !review && isMyTurn && questionReady ? (
      <MediationChatComposer
        disabled={pending}
        helpFormulateLabel={t.mediationHelpFormulate}
        helpFormulatePending={formulatePending}
        helpFormulatePendingLabel={t.mediationHelpFormulatePending}
        onChange={setReply}
        onHelpFormulate={onHelpFormulate}
        onSend={onSendReply}
        pending={pending}
        placeholder={t.mediationReplyPlaceholder}
        sendLabel={t.mediationSendReply}
        value={reply}
      />
    ) : null;

  if (review) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <MediationChat
          header={chatStatusHeader}
          labels={chatLabels}
          messages={state.messages}
        />
        {reviewOptionsPanel}
        {reviewCompromisePanel}
        <FlowReviewNext step={4} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isSessionComplete && resultsSummary ? (
          <motion.div key="completed" className="space-y-6" {...panelTransition}>
            <motion.p
              className="font-display text-headline-md text-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {t.mediationSessionCompleted}
            </motion.p>
            {optionsPanel}
            {compromisePanel}
            <MediationResultsPanel summary={resultsSummary} />
            <motion.div
              className="space-y-3 border-t border-hair pt-4"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <button className="btn-secondary px-4 py-2 text-body-sm" disabled={pending} onClick={onDownload} type="button">
                {t.mediationDownloadResults}
              </button>
              <div className="flex flex-wrap gap-2">
                <input
                  className="min-w-[200px] flex-1 rounded-lg border border-hair bg-paper px-3 py-2 text-body-sm"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t.mediationEmailPlaceholder}
                  type="email"
                  value={email}
                />
                <button className="btn-secondary px-4 py-2 text-body-sm" onClick={onEmailPlaceholder} type="button">
                  {t.mediationEmailSend}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="active" className="space-y-6" {...panelTransition}>
            {!isSessionComplete ? (
              <MediationCountdown
                durationMinutes={state.room.mediationDurationMinutes}
                onEnded={refresh}
                sessionComplete={isSessionComplete}
                startedAt={state.room.mediationStartedAt}
              />
            ) : null}

            <AnimatePresence>
              {showReadyButton ? (
                <motion.div
                  key="ready-button"
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-law-line bg-law-fill/40 p-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, padding: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    className="btn-secondary px-4 py-2 text-body-sm disabled:opacity-60"
                    disabled={pending || state.room.selfReady}
                    onClick={onReady}
                    type="button"
                    whileHover={!state.room.selfReady ? { scale: 1.02 } : undefined}
                    whileTap={!state.room.selfReady ? { scale: 0.97 } : undefined}
                  >
                    {state.room.selfReady ? t.mediationReadyConfirmed : t.mediationReadyForOptions}
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <MediationChat
              footer={chatComposer ?? undefined}
              header={chatStatusHeader}
              labels={chatLabels}
              messages={state.messages}
            />

            <AnimatePresence>
              {optionsPanel ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {optionsPanel}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {isCompromiseGenerating ? (
                <motion.div
                  key="compromise-generating"
                  className="space-y-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <MediationVotesDiscrepancyNotice
                    options={state.options}
                    partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
                    partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
                    pending
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {compromisePanel ? (
                <motion.div
                  key="compromise"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {compromisePanel}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {state.room.phase === "agreement" && draft ? (
                <motion.div
                  key="agreement"
                  className="space-y-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="font-display text-headline-md text-on-surface">
                    {draft.title ?? t.mediationAgreementTitle}
                  </h2>
                  <div className="glass-panel whitespace-pre-wrap rounded-xl p-4 text-body-md text-on-surface">
                    {draft.body}
                  </div>
                  {draft.terms?.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-body-md text-on-surface">
                      {draft.terms.map((term, index) => (
                        <li key={`${term}-${index}`}>{term}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="rounded-lg border border-hair bg-surface-container p-3 text-body-sm text-on-surface-variant">
                    {t.mediationUplDisclaimer}
                  </p>
                  <motion.button
                    className="btn-primary px-4 py-2 text-body-sm disabled:opacity-60"
                    disabled={pending || state.room.selfAccepted}
                    onClick={onAccept}
                    type="button"
                    whileHover={!state.room.selfAccepted ? { scale: 1.02 } : undefined}
                    whileTap={!state.room.selfAccepted ? { scale: 0.97 } : undefined}
                  >
                    {state.room.selfAccepted ? t.mediationAccepted : t.mediationIAccept}
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {isSessionComplete && !resultsSummary ? (
              <motion.p
                className="text-body-md text-on-surface-variant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {t.mediationNoAgreementOutcome}
              </motion.p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
