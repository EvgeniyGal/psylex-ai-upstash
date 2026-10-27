"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/locale-provider";
import type { MediationPhase } from "@/lib/mediation/types";
import {
  dismissAttentionToast,
  modeAReadyToastClassName,
  modeAWaitToastClassName,
  showAttentionWait,
  syncAttentionReadyPersistent,
  syncAttentionWait,
} from "@/hooks/attention-toasts";

export { modeAWaitToastClassName, modeAReadyToastClassName };

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
  waitingCompromiseVote: "mode-a-waiting-compromise-vote",
  agreementReady: "mode-a-agreement-ready",
} as const;

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
    syncAttentionWait(enabled, pipelineRunning, WAIT_IDS.pipeline, t.modeAToastPipelineWorking);
  }, [enabled, pipelineRunning, t.modeAToastPipelineWorking]);

  useEffect(() => {
    syncAttentionWait(enabled, preparingRoom, WAIT_IDS.opening, t.modeAToastOpeningPreparing);
  }, [enabled, preparingRoom, t.modeAToastOpeningPreparing]);

  useEffect(() => {
    syncAttentionWait(
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
    syncAttentionWait(
      enabled,
      waitingForOpposite,
      WAIT_IDS.handshakeWaiting,
      t.mediationHandshakeWaiting,
    );
  }, [enabled, waitingForOpposite, t.mediationHandshakeWaiting]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      oppositeReadyToStart,
      WAIT_IDS.handshakeOppositeReady,
      t.mediationHandshakeOppositeReady,
    );
  }, [enabled, oppositeReadyToStart, t.mediationHandshakeOppositeReady]);

  useEffect(() => {
    syncAttentionWait(
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
  waitingOtherCompromiseVote: boolean;
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
    waitingOtherCompromiseVote,
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
    syncAttentionWait(
      enabled,
      waitingForQuestion,
      WAIT_IDS.question,
      t.modeAToastGeneratingQuestion,
    );
  }, [enabled, waitingForQuestion, t.modeAToastGeneratingQuestion]);

  useEffect(() => {
    syncAttentionWait(
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
    syncAttentionWait(
      enabled,
      isOtherPartyAnswering,
      WAIT_IDS.otherAnswering,
      t.mediationOtherPartyAnsweringHint,
    );
  }, [enabled, isOtherPartyAnswering, t.mediationOtherPartyAnsweringHint]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingOtherReady,
      WAIT_IDS.otherReady,
      t.mediationWaitingOtherReady,
    );
  }, [enabled, waitingOtherReady, t.mediationWaitingOtherReady]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      otherReadyForOptions && !waitingOtherReady,
      WAIT_IDS.otherPartyReadyForOptions,
      t.mediationOtherReady,
    );
  }, [enabled, otherReadyForOptions, waitingOtherReady, t.mediationOtherReady]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingOtherAccept,
      WAIT_IDS.otherAccept,
      t.mediationWaitingOtherAccept,
    );
  }, [enabled, waitingOtherAccept, t.mediationWaitingOtherAccept]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingOtherCompromiseVote,
      WAIT_IDS.waitingCompromiseVote,
      t.modeBToastWaitingOtherCompromiseVote,
    );
  }, [
    enabled,
    waitingOtherCompromiseVote,
    t.modeBToastWaitingOtherCompromiseVote,
  ]);

  useEffect(() => {
    syncAttentionWait(enabled, optionsWait, WAIT_IDS.options, t.modeAToastGeneratingOptions);
  }, [enabled, optionsWait, t.modeAToastGeneratingOptions]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      compromiseWait,
      WAIT_IDS.compromise,
      t.modeAToastGeneratingCompromise,
    );
  }, [enabled, compromiseWait, t.modeAToastGeneratingCompromise]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      agreementWait,
      WAIT_IDS.agreement,
      t.modeAToastGeneratingAgreement,
    );
  }, [enabled, agreementWait, t.modeAToastGeneratingAgreement]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      actionNewQuestion,
      WAIT_IDS.newQuestion,
      t.modeAToastNewQuestion,
    );
  }, [enabled, actionNewQuestion, t.modeAToastNewQuestion]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      actionOptionsReady,
      WAIT_IDS.optionsReady,
      t.modeAToastOptionsReady,
    );
  }, [enabled, actionOptionsReady, t.modeAToastOptionsReady]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      actionCompromiseReady,
      WAIT_IDS.compromiseReady,
      t.modeAToastCompromiseReady,
    );
  }, [enabled, actionCompromiseReady, t.modeAToastCompromiseReady]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      actionAgreementReady,
      WAIT_IDS.agreementReady,
      t.modeAToastAgreementReady,
    );
  }, [enabled, actionAgreementReady, t.modeAToastAgreementReady]);
}

export function showModeAIntakeToast(message: string) {
  showAttentionWait(WAIT_IDS.intake, message);
}

export function dismissModeAIntakeToast() {
  dismissAttentionToast(WAIT_IDS.intake);
}

export function showModeATestsToast(message: string) {
  showAttentionWait(WAIT_IDS.tests, message);
}

export function dismissModeATestsToast() {
  dismissAttentionToast(WAIT_IDS.tests);
}
