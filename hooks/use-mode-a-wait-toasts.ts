"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import type { MediationPhase } from "@/lib/mediation/types";

const WAIT_CLASS =
  "!bg-amber-100 !text-amber-950 !border-amber-300/80 shadow-md [&_[data-icon]]:!text-amber-700";
const READY_CLASS =
  "!bg-emerald-100 !text-emerald-950 !border-emerald-300/80 shadow-md [&_[data-icon]]:!text-emerald-700";

const WAIT_IDS = {
  pipeline: "mode-a-pipeline",
  opening: "mode-a-opening",
  question: "mode-a-question",
  options: "mode-a-options",
  compromise: "mode-a-compromise",
  agreement: "mode-a-agreement",
  intake: "mode-a-intake",
  tests: "mode-a-tests",
  otherAnswering: "mode-a-other-answering",
  otherReady: "mode-a-other-ready",
  otherAccept: "mode-a-other-accept",
} as const;

function showWait(id: string, message: string) {
  toast.loading(message, {
    id,
    duration: Infinity,
    className: WAIT_CLASS,
  });
}

function dismissWait(id: string) {
  toast.dismiss(id);
}

function showReady(id: string, message: string) {
  toast.success(message, {
    id,
    duration: 7000,
    className: READY_CLASS,
  });
}

export function useModeALobbyWaitToasts(params: {
  pipelineRunning: boolean;
  preparingRoom: boolean;
  enabled?: boolean;
}) {
  const { portal: t } = useLocale();
  const { pipelineRunning, preparingRoom, enabled = true } = params;

  useEffect(() => {
    if (!enabled) return;
    if (pipelineRunning) {
      showWait(WAIT_IDS.pipeline, t.modeAToastPipelineWorking);
    } else {
      dismissWait(WAIT_IDS.pipeline);
    }
  }, [enabled, pipelineRunning, t.modeAToastPipelineWorking]);

  useEffect(() => {
    if (!enabled) return;
    if (preparingRoom) {
      showWait(WAIT_IDS.opening, t.modeAToastOpeningPreparing);
    } else {
      dismissWait(WAIT_IDS.opening);
    }
  }, [enabled, preparingRoom, t.modeAToastOpeningPreparing]);
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
    enabled = true,
  } = params;

  const prevMyQuestionReady = useRef(false);
  const prevHasOptions = useRef(false);
  const prevHasCompromise = useRef(false);
  const prevHasDraft = useRef(false);

  const waitingForQuestion =
    phase === "dialogue" && ((isMyTurn && !questionReady) || (isAwaitingAgent && !isMyTurn));
  const optionsWait = phase === "generating_options";
  const compromiseWait =
    isCompromiseGenerating || (phase === "voting_discrepancy" && !hasCompromise);
  const agreementWait = phase === "agreement" && !hasDraftAgreement;

  useEffect(() => {
    if (!enabled) return;
    if (waitingForQuestion) {
      showWait(WAIT_IDS.question, t.modeAToastGeneratingQuestion);
    } else {
      dismissWait(WAIT_IDS.question);
    }
  }, [enabled, waitingForQuestion, t.modeAToastGeneratingQuestion]);

  useEffect(() => {
    if (!enabled) return;
    if (isOtherPartyAnswering) {
      showWait(WAIT_IDS.otherAnswering, t.mediationOtherPartyAnsweringHint);
    } else {
      dismissWait(WAIT_IDS.otherAnswering);
    }
  }, [enabled, isOtherPartyAnswering, t.mediationOtherPartyAnsweringHint]);

  useEffect(() => {
    if (!enabled) return;
    if (waitingOtherReady) {
      showWait(WAIT_IDS.otherReady, t.mediationWaitingOtherReady);
    } else {
      dismissWait(WAIT_IDS.otherReady);
    }
  }, [enabled, waitingOtherReady, t.mediationWaitingOtherReady]);

  useEffect(() => {
    if (!enabled) return;
    if (waitingOtherAccept) {
      showWait(WAIT_IDS.otherAccept, t.mediationWaitingOtherAccept);
    } else {
      dismissWait(WAIT_IDS.otherAccept);
    }
  }, [enabled, waitingOtherAccept, t.mediationWaitingOtherAccept]);

  useEffect(() => {
    if (!enabled) return;
    if (optionsWait) {
      showWait(WAIT_IDS.options, t.modeAToastGeneratingOptions);
    } else {
      dismissWait(WAIT_IDS.options);
    }
  }, [enabled, optionsWait, t.modeAToastGeneratingOptions]);

  useEffect(() => {
    if (!enabled) return;
    if (compromiseWait) {
      showWait(WAIT_IDS.compromise, t.modeAToastGeneratingCompromise);
    } else {
      dismissWait(WAIT_IDS.compromise);
    }
  }, [enabled, compromiseWait, t.modeAToastGeneratingCompromise]);

  useEffect(() => {
    if (!enabled) return;
    if (agreementWait) {
      showWait(WAIT_IDS.agreement, t.modeAToastGeneratingAgreement);
    } else {
      dismissWait(WAIT_IDS.agreement);
    }
  }, [enabled, agreementWait, t.modeAToastGeneratingAgreement]);

  useEffect(() => {
    if (!enabled) return;
    const ready = isMyTurn && questionReady;
    if (ready && !prevMyQuestionReady.current) {
      showReady("mode-a-new-question", t.modeAToastNewQuestion);
    }
    prevMyQuestionReady.current = ready;
  }, [enabled, isMyTurn, questionReady, t.modeAToastNewQuestion]);

  useEffect(() => {
    if (!enabled) return;
    if (hasOptions && phase === "voting" && !prevHasOptions.current) {
      showReady("mode-a-options-ready", t.modeAToastOptionsReady);
    }
    prevHasOptions.current = hasOptions && phase === "voting";
  }, [enabled, hasOptions, phase, t.modeAToastOptionsReady]);

  useEffect(() => {
    if (!enabled) return;
    if (hasCompromise && phase === "voting_discrepancy" && !prevHasCompromise.current) {
      showReady("mode-a-compromise-ready", t.modeAToastCompromiseReady);
    }
    prevHasCompromise.current = hasCompromise && phase === "voting_discrepancy";
  }, [enabled, hasCompromise, phase, t.modeAToastCompromiseReady]);

  useEffect(() => {
    if (!enabled) return;
    if (hasDraftAgreement && phase === "agreement" && !prevHasDraft.current) {
      showReady("mode-a-agreement-ready", t.modeAToastAgreementReady);
    }
    prevHasDraft.current = hasDraftAgreement && phase === "agreement";
  }, [enabled, hasDraftAgreement, phase, t.modeAToastAgreementReady]);
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

/** Exported class names for one-off toasts (send errors stay default / error). */
export const modeAWaitToastClassName = WAIT_CLASS;
export const modeAReadyToastClassName = READY_CLASS;
