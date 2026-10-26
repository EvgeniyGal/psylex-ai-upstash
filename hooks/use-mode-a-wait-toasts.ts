"use client";

import { createElement, useEffect } from "react";
import { toast } from "sonner";
import { ModeAToastSpinner } from "@/components/ui/mode-a-toast-spinner";
import { useLocale } from "@/components/locale-provider";
import type { MediationPhase } from "@/lib/mediation/types";

/** Orange — AI working / waiting on other party / saving. */
export const modeAWaitToastClassName =
  "mode-a-toast-attention !bg-amber-100 !text-amber-950 !border-2 !border-amber-400 shadow-md [&_[data-icon]]:!text-amber-700";

/** Green — user must act (new question, vote, start, accept). */
export const modeAReadyToastClassName =
  "mode-a-toast-attention mode-a-toast-attention-ready !bg-emerald-100 !text-emerald-950 !border-2 !border-emerald-500 shadow-md [&_[data-icon]]:!text-emerald-700";

const WAIT_CLASS = modeAWaitToastClassName;
const READY_CLASS = modeAReadyToastClassName;

const WAIT_IDS = {
  pipeline: "mode-a-pipeline",
  opening: "mode-a-opening",
  question: "mode-a-question",
  awaitingAgent: "mode-a-awaiting-agent",
  options: "mode-a-options",
  compromise: "mode-a-compromise",
  agreement: "mode-a-agreement",
  intake: "mode-a-intake",
  tests: "mode-a-tests",
  otherAnswering: "mode-a-other-answering",
  otherReady: "mode-a-other-ready",
  otherAccept: "mode-a-other-accept",
  oppositeNotReady: "mode-a-opposite-not-ready",
  handshakeWaiting: "mode-a-handshake-waiting",
  handshakeOppositeReady: "mode-a-handshake-opposite-ready",
  handshakeStarting: "mode-a-handshake-starting",
  otherPartyReadyForOptions: "mode-a-other-ready-for-options",
  newQuestion: "mode-a-new-question",
  optionsReady: "mode-a-options-ready",
  compromiseReady: "mode-a-compromise-ready",
  agreementReady: "mode-a-agreement-ready",
} as const;

function waitIcon() {
  return createElement(ModeAToastSpinner);
}

const MODE_A_TOASTER = "mode-a";

function showWait(id: string, message: string) {
  toast.loading(message, {
    id,
    toasterId: MODE_A_TOASTER,
    duration: Infinity,
    className: WAIT_CLASS,
    icon: waitIcon(),
  });
}

function dismissWait(id: string) {
  toast.dismiss(id);
}

function showReady(id: string, message: string, persistent = false) {
  toast.success(message, {
    id,
    toasterId: MODE_A_TOASTER,
    duration: persistent ? Infinity : 7000,
    className: READY_CLASS,
  });
}

function syncWait(enabled: boolean, active: boolean, id: string, message: string) {
  if (!enabled) {
    dismissWait(id);
    return;
  }
  if (active) showWait(id, message);
  else dismissWait(id);
}

function syncReadyPersistent(
  enabled: boolean,
  active: boolean,
  id: string,
  message: string,
) {
  if (!enabled) {
    dismissWait(id);
    return;
  }
  if (active) showReady(id, message, true);
  else dismissWait(id);
}

export function useModeALobbyWaitToasts(params: {
  pipelineRunning: boolean;
  preparingRoom: boolean;
  bothReady: boolean;
  waitingForOpposite: boolean;
  oppositeReadyToStart: boolean;
  handshakeStarting: boolean;
  enabled?: boolean;
}) {
  const { portal: t } = useLocale();
  const {
    pipelineRunning,
    preparingRoom,
    bothReady,
    waitingForOpposite,
    oppositeReadyToStart,
    handshakeStarting,
    enabled = true,
  } = params;

  useEffect(() => {
    syncWait(enabled, pipelineRunning, WAIT_IDS.pipeline, t.modeAToastPipelineWorking);
  }, [enabled, pipelineRunning, t.modeAToastPipelineWorking]);

  useEffect(() => {
    syncWait(enabled, preparingRoom, WAIT_IDS.opening, t.modeAToastOpeningPreparing);
  }, [enabled, preparingRoom, t.modeAToastOpeningPreparing]);

  useEffect(() => {
    syncWait(
      enabled,
      !bothReady && !pipelineRunning && !preparingRoom,
      WAIT_IDS.oppositeNotReady,
      t.mediationOppositeNotReady,
    );
  }, [
    enabled,
    bothReady,
    pipelineRunning,
    preparingRoom,
    t.mediationOppositeNotReady,
  ]);

  useEffect(() => {
    syncWait(
      enabled,
      waitingForOpposite,
      WAIT_IDS.handshakeWaiting,
      t.mediationHandshakeWaiting,
    );
  }, [enabled, waitingForOpposite, t.mediationHandshakeWaiting]);

  useEffect(() => {
    syncReadyPersistent(
      enabled,
      oppositeReadyToStart,
      WAIT_IDS.handshakeOppositeReady,
      t.mediationHandshakeOppositeReady,
    );
  }, [enabled, oppositeReadyToStart, t.mediationHandshakeOppositeReady]);

  useEffect(() => {
    syncWait(
      enabled,
      handshakeStarting,
      WAIT_IDS.handshakeStarting,
      t.mediationHandshakeStarting,
    );
  }, [enabled, handshakeStarting, t.mediationHandshakeStarting]);
}

export function useModeARoomWaitToasts(params: {
  phase: MediationPhase | null | undefined;
  isAwaitingAgent: boolean;
  isMyTurn: boolean;
  isOtherPartyAnswering: boolean;
  questionReady: boolean;
  hasOptions: boolean;
  hasCompromise: boolean;
  hasDraftAgreement: boolean;
  isCompromiseGenerating: boolean;
  waitingOtherReady: boolean;
  waitingOtherAccept: boolean;
  otherReadyForOptions: boolean;
  /** True until the viewer votes on options. */
  needsOptionsVote: boolean;
  /** True until the viewer accepts/rejects compromise. */
  needsCompromiseVote: boolean;
  /** True until the viewer accepts the draft agreement. */
  needsAgreementAccept: boolean;
  enabled?: boolean;
}) {
  const { portal: t } = useLocale();
  const {
    phase,
    isAwaitingAgent,
    isMyTurn,
    isOtherPartyAnswering,
    questionReady,
    hasOptions,
    hasCompromise,
    hasDraftAgreement,
    isCompromiseGenerating,
    waitingOtherReady,
    waitingOtherAccept,
    otherReadyForOptions,
    needsOptionsVote,
    needsCompromiseVote,
    needsAgreementAccept,
    enabled = true,
  } = params;

  const waitingForQuestion =
    phase === "dialogue" && isMyTurn && !questionReady;
  const awaitingAgentWork =
    isAwaitingAgent && !(phase === "dialogue" && isOtherPartyAnswering);
  const optionsWait = phase === "generating_options";
  const compromiseWait =
    isCompromiseGenerating || (phase === "voting_discrepancy" && !hasCompromise);
  const agreementWait = phase === "agreement" && !hasDraftAgreement;
  const actionNewQuestion = isMyTurn && questionReady && phase === "dialogue";
  const actionOptionsReady = needsOptionsVote && hasOptions && phase === "voting";
  const actionCompromiseReady =
    needsCompromiseVote && hasCompromise && phase === "voting_discrepancy";
  const actionAgreementReady =
    needsAgreementAccept && hasDraftAgreement && phase === "agreement";

  useEffect(() => {
    syncWait(
      enabled,
      waitingForQuestion,
      WAIT_IDS.question,
      t.modeAToastGeneratingQuestion,
    );
  }, [enabled, waitingForQuestion, t.modeAToastGeneratingQuestion]);

  useEffect(() => {
    syncWait(
      enabled,
      awaitingAgentWork && !waitingForQuestion && !optionsWait && !compromiseWait && !agreementWait,
      WAIT_IDS.awaitingAgent,
      t.mediationAwaitingAgent,
    );
  }, [
    enabled,
    awaitingAgentWork,
    waitingForQuestion,
    optionsWait,
    compromiseWait,
    agreementWait,
    t.mediationAwaitingAgent,
  ]);

  useEffect(() => {
    syncWait(
      enabled,
      isOtherPartyAnswering,
      WAIT_IDS.otherAnswering,
      t.mediationOtherPartyAnsweringHint,
    );
  }, [enabled, isOtherPartyAnswering, t.mediationOtherPartyAnsweringHint]);

  useEffect(() => {
    syncWait(
      enabled,
      waitingOtherReady,
      WAIT_IDS.otherReady,
      t.mediationWaitingOtherReady,
    );
  }, [enabled, waitingOtherReady, t.mediationWaitingOtherReady]);

  useEffect(() => {
    syncReadyPersistent(
      enabled,
      otherReadyForOptions && !waitingOtherReady,
      WAIT_IDS.otherPartyReadyForOptions,
      t.mediationOtherReady,
    );
  }, [enabled, otherReadyForOptions, waitingOtherReady, t.mediationOtherReady]);

  useEffect(() => {
    syncWait(
      enabled,
      waitingOtherAccept,
      WAIT_IDS.otherAccept,
      t.mediationWaitingOtherAccept,
    );
  }, [enabled, waitingOtherAccept, t.mediationWaitingOtherAccept]);

  useEffect(() => {
    syncWait(enabled, optionsWait, WAIT_IDS.options, t.modeAToastGeneratingOptions);
  }, [enabled, optionsWait, t.modeAToastGeneratingOptions]);

  useEffect(() => {
    syncWait(
      enabled,
      compromiseWait,
      WAIT_IDS.compromise,
      t.modeAToastGeneratingCompromise,
    );
  }, [enabled, compromiseWait, t.modeAToastGeneratingCompromise]);

  useEffect(() => {
    syncWait(
      enabled,
      agreementWait,
      WAIT_IDS.agreement,
      t.modeAToastGeneratingAgreement,
    );
  }, [enabled, agreementWait, t.modeAToastGeneratingAgreement]);

  // Persist until the user acts — do not auto-dismiss action toasts.
  useEffect(() => {
    syncReadyPersistent(
      enabled,
      actionNewQuestion,
      WAIT_IDS.newQuestion,
      t.modeAToastNewQuestion,
    );
  }, [enabled, actionNewQuestion, t.modeAToastNewQuestion]);

  useEffect(() => {
    syncReadyPersistent(
      enabled,
      actionOptionsReady,
      WAIT_IDS.optionsReady,
      t.modeAToastOptionsReady,
    );
  }, [enabled, actionOptionsReady, t.modeAToastOptionsReady]);

  useEffect(() => {
    syncReadyPersistent(
      enabled,
      actionCompromiseReady,
      WAIT_IDS.compromiseReady,
      t.modeAToastCompromiseReady,
    );
  }, [enabled, actionCompromiseReady, t.modeAToastCompromiseReady]);

  useEffect(() => {
    syncReadyPersistent(
      enabled,
      actionAgreementReady,
      WAIT_IDS.agreementReady,
      t.modeAToastAgreementReady,
    );
  }, [enabled, actionAgreementReady, t.modeAToastAgreementReady]);
}

export function showModeAIntakeToast(message: string) {
  showWait(WAIT_IDS.intake, message);
}

export function dismissModeAIntakeToast() {
  dismissWait(WAIT_IDS.intake);
}

export function showModeATestsToast(message: string) {
  showWait(WAIT_IDS.tests, message);
}

export function dismissModeATestsToast() {
  dismissWait(WAIT_IDS.tests);
}
