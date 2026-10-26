"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/locale-provider";
import {
  type AttentionSurface,
  syncAttentionReadyPersistent,
  syncAttentionWait,
} from "@/hooks/attention-toasts";
import { clearMediatorAttention } from "@/lib/mediator-attention-dock";
import type { MediationPhase } from "@/lib/mediation/types";
import type { MediatorHandshakeStatus } from "@/lib/mediator-session/handshake";

const IDS = {
  pipeline: "mode-b-pipeline",
  waitingSchedule: "mode-b-waiting-schedule",
  startWindow: "mode-b-start-window",
  handshakeWaiting: "mode-b-handshake-waiting",
  peerReady: "mode-b-peer-ready",
  sessionStarting: "mode-b-session-starting",
  waitingQuestion: "mode-b-waiting-question",
  newQuestion: "mode-b-new-question",
  otherAnswering: "mode-b-other-answering",
  options: "mode-b-options",
  optionsReady: "mode-b-options-ready",
  waitingVote: "mode-b-waiting-vote",
  compromise: "mode-b-compromise",
  compromiseReady: "mode-b-compromise-ready",
  agreement: "mode-b-agreement",
  agreementReady: "mode-b-agreement-ready",
  otherAccept: "mode-b-other-accept",
  mediatorComplete: "mode-b-mediator-complete",
  waitPartyA: "mode-b-med-wait-a",
  waitPartyB: "mode-b-med-wait-b",
  readyNext: "mode-b-med-ready-next",
  genCandidates: "mode-b-med-gen-candidates",
  candidatesReady: "mode-b-med-candidates-ready",
  genOptions: "mode-b-med-gen-options",
  waitVotes: "mode-b-med-wait-votes",
  genCompromise: "mode-b-med-gen-compromise",
  compromiseDraftReady: "mode-b-med-compromise-draft",
  waitCompromiseVotes: "mode-b-med-wait-compromise-votes",
  genAgreement: "mode-b-med-gen-agreement",
  agreementDraftReady: "mode-b-med-agreement-draft",
  waitAccepts: "mode-b-med-wait-accepts",
  bothAcceptedEnd: "mode-b-med-both-accepted",
} as const;

/** Shared lobby stack for parties and mediator. */
export function useModeBLobbyWaitToasts(params: {
  status: MediatorHandshakeStatus;
  selfClicked: boolean;
  partyAClicked: boolean;
  partyBClicked: boolean;
  mediatorClicked: boolean;
  canClickStart: boolean;
  pipelineRunning?: boolean;
  enabled?: boolean;
  surface?: AttentionSurface;
}) {
  const { portal: t } = useLocale();
  const {
    status,
    selfClicked,
    partyAClicked,
    partyBClicked,
    mediatorClicked,
    canClickStart,
    pipelineRunning = false,
    enabled = true,
    surface = "toast",
  } = params;

  const waitingSchedule = status === "not_scheduled";
  const startWindowOpen =
    (status === "idle" || status === "too_early") && canClickStart && !selfClicked;
  const waitingOthers =
    (status === "waiting" || status === "idle") &&
    selfClicked &&
    !(partyAClicked && partyBClicked && mediatorClicked);
  const peerReadyNudge =
    (status === "waiting" || status === "idle") &&
    !selfClicked &&
    (partyAClicked || partyBClicked || mediatorClicked) &&
    canClickStart;
  const sessionStarting =
    status === "countdown" ||
    (status === "waiting" && partyAClicked && partyBClicked && mediatorClicked);

  useEffect(() => {
    syncAttentionWait(enabled, pipelineRunning, IDS.pipeline, t.modeAToastPipelineWorking, surface);
  }, [enabled, pipelineRunning, t.modeAToastPipelineWorking, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingSchedule && !pipelineRunning,
      IDS.waitingSchedule,
      t.modeBToastWaitingSchedule,
      surface,
    );
  }, [enabled, waitingSchedule, pipelineRunning, t.modeBToastWaitingSchedule, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      startWindowOpen && !pipelineRunning && !waitingSchedule,
      IDS.startWindow,
      t.modeBNotifyStartWindow,
      surface,
    );
  }, [
    enabled,
    startWindowOpen,
    pipelineRunning,
    waitingSchedule,
    t.modeBNotifyStartWindow,
    surface,
  ]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingOthers && !sessionStarting,
      IDS.handshakeWaiting,
      t.mediationHandshakeWaiting,
      surface,
    );
  }, [enabled, waitingOthers, sessionStarting, t.mediationHandshakeWaiting, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      peerReadyNudge && !waitingOthers,
      IDS.peerReady,
      t.modeBNotifyPeerReady,
      surface,
    );
  }, [enabled, peerReadyNudge, waitingOthers, t.modeBNotifyPeerReady, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      sessionStarting,
      IDS.sessionStarting,
      t.modeBToastSessionStarting,
      surface,
    );
  }, [enabled, sessionStarting, t.modeBToastSessionStarting, surface]);

  useEffect(() => {
    if (surface !== "mediator-dock") return;
    return () => clearMediatorAttention();
  }, [surface]);
}

export function useModeBPartyRoomWaitToasts(params: {
  phase: MediationPhase | null | undefined;
  pendingQuestion: boolean;
  peerHasPendingQuestion: boolean;
  hasOptions: boolean;
  hasCompromise: boolean;
  agreementPublished: boolean;
  awaitingCompromisePublish: boolean;
  awaitingMediatorPublish: boolean;
  selfVote: string | null | undefined;
  peerHasVoted: boolean;
  selfCompromiseVote: boolean | null | undefined;
  agreementAccepted: boolean;
  otherAgreementAccepted: boolean;
  waitingForMediatorComplete: boolean;
  enabled?: boolean;
}) {
  const { portal: t } = useLocale();
  const {
    phase,
    pendingQuestion,
    peerHasPendingQuestion,
    hasOptions,
    hasCompromise,
    agreementPublished,
    awaitingCompromisePublish,
    awaitingMediatorPublish,
    selfVote,
    peerHasVoted,
    selfCompromiseVote,
    agreementAccepted,
    otherAgreementAccepted,
    waitingForMediatorComplete,
    enabled = true,
  } = params;

  const dialogueLike = phase === "dialogue" || phase === "opening";
  const waitingMediatorQuestion =
    dialogueLike && !pendingQuestion && !peerHasPendingQuestion;
  const otherAnswering = dialogueLike && peerHasPendingQuestion && !pendingQuestion;
  const optionsWait = phase === "generating_options";
  const needsOptionsVote = phase === "voting" && hasOptions && !selfVote;
  const waitingOtherVote = phase === "voting" && !!selfVote && !peerHasVoted;
  const compromiseWait = awaitingCompromisePublish;
  const needsCompromiseVote =
    phase === "voting_discrepancy" && hasCompromise && selfCompromiseVote == null;
  const agreementWait = awaitingMediatorPublish;
  const needsAgreementAccept =
    phase === "agreement" && agreementPublished && !agreementAccepted;
  const waitingOtherAccept =
    phase === "agreement" && agreementAccepted && !otherAgreementAccepted;

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingMediatorQuestion,
      IDS.waitingQuestion,
      t.modeBToastWaitingMediatorQuestion,
    );
  }, [enabled, waitingMediatorQuestion, t.modeBToastWaitingMediatorQuestion]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      pendingQuestion,
      IDS.newQuestion,
      t.modeBNotifyQuestion,
    );
  }, [enabled, pendingQuestion, t.modeBNotifyQuestion]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      otherAnswering,
      IDS.otherAnswering,
      t.mediationOtherPartyAnsweringHint,
    );
  }, [enabled, otherAnswering, t.mediationOtherPartyAnsweringHint]);

  useEffect(() => {
    syncAttentionWait(enabled, optionsWait, IDS.options, t.modeAToastGeneratingOptions);
  }, [enabled, optionsWait, t.modeAToastGeneratingOptions]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      needsOptionsVote,
      IDS.optionsReady,
      t.modeAToastOptionsReady,
    );
  }, [enabled, needsOptionsVote, t.modeAToastOptionsReady]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingOtherVote,
      IDS.waitingVote,
      t.modeBToastWaitingOtherVote,
    );
  }, [enabled, waitingOtherVote, t.modeBToastWaitingOtherVote]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      compromiseWait,
      IDS.compromise,
      t.modeBWaitingCompromisePublish,
    );
  }, [enabled, compromiseWait, t.modeBWaitingCompromisePublish]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      needsCompromiseVote,
      IDS.compromiseReady,
      t.modeAToastCompromiseReady,
    );
  }, [enabled, needsCompromiseVote, t.modeAToastCompromiseReady]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      agreementWait,
      IDS.agreement,
      t.modeBWaitingAgreementPublish,
    );
  }, [enabled, agreementWait, t.modeBWaitingAgreementPublish]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      needsAgreementAccept,
      IDS.agreementReady,
      t.modeAToastAgreementReady,
    );
  }, [enabled, needsAgreementAccept, t.modeAToastAgreementReady]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingOtherAccept,
      IDS.otherAccept,
      t.mediationWaitingOtherAccept,
    );
  }, [enabled, waitingOtherAccept, t.mediationWaitingOtherAccept]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingForMediatorComplete,
      IDS.mediatorComplete,
      t.modeBWaitingMediatorComplete,
    );
  }, [enabled, waitingForMediatorComplete, t.modeBWaitingMediatorComplete]);
}

export function useModeBMediatorRoomWaitToasts(params: {
  phase: MediationPhase | null | undefined;
  partyAPendingReply: boolean;
  partyBPendingReply: boolean;
  generatingCandidates: boolean;
  hasQuestionCandidates: boolean;
  generatingOptions: boolean;
  hasOptions: boolean;
  partyAVote: string | null | undefined;
  partyBVote: string | null | undefined;
  generatingCompromise: boolean;
  hasCompromiseDraft: boolean;
  compromisePublished: boolean;
  partyACompromiseVote: boolean | null | undefined;
  partyBCompromiseVote: boolean | null | undefined;
  generatingAgreement: boolean;
  hasAgreementDraft: boolean;
  agreementPublished: boolean;
  partyAAccepted: boolean;
  partyBAccepted: boolean;
  enabled?: boolean;
}) {
  const { portal: t } = useLocale();
  const {
    phase,
    partyAPendingReply,
    partyBPendingReply,
    generatingCandidates,
    hasQuestionCandidates,
    generatingOptions,
    hasOptions,
    partyAVote,
    partyBVote,
    generatingCompromise,
    hasCompromiseDraft,
    compromisePublished,
    partyACompromiseVote,
    partyBCompromiseVote,
    generatingAgreement,
    hasAgreementDraft,
    agreementPublished,
    partyAAccepted,
    partyBAccepted,
    enabled = true,
  } = params;

  const surface: AttentionSurface = "mediator-dock";

  const dialogueLike = phase === "dialogue" || phase === "opening";
  const waitingVotes =
    phase === "voting" && hasOptions && (!partyAVote || !partyBVote);
  const compromiseGen =
    generatingCompromise ||
    (phase === "voting_discrepancy" && !hasCompromiseDraft && !compromisePublished);
  const compromiseDraftReady =
    phase === "voting_discrepancy" && hasCompromiseDraft && !compromisePublished;
  const waitingCompromiseVotes =
    phase === "voting_discrepancy" &&
    compromisePublished &&
    (partyACompromiseVote == null || partyBCompromiseVote == null);
  const agreementGen =
    generatingAgreement || (phase === "agreement" && !hasAgreementDraft && !agreementPublished);
  const agreementDraftReady =
    phase === "agreement" && hasAgreementDraft && !agreementPublished;
  const waitingAccepts =
    phase === "agreement" &&
    agreementPublished &&
    (!partyAAccepted || !partyBAccepted);
  const bothAcceptedEnd =
    phase === "agreement" && agreementPublished && partyAAccepted && partyBAccepted;
  const readyNext =
    dialogueLike &&
    !partyAPendingReply &&
    !partyBPendingReply &&
    !generatingCandidates &&
    !generatingOptions;

  useEffect(() => {
    syncAttentionWait(
      enabled,
      partyAPendingReply,
      IDS.waitPartyA,
      t.modeBToastMediatorWaitingPartyA,
      surface,
    );
  }, [enabled, partyAPendingReply, t.modeBToastMediatorWaitingPartyA, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      partyBPendingReply,
      IDS.waitPartyB,
      t.modeBToastMediatorWaitingPartyB,
      surface,
    );
  }, [enabled, partyBPendingReply, t.modeBToastMediatorWaitingPartyB, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      readyNext && !hasQuestionCandidates,
      IDS.readyNext,
      t.modeBToastMediatorReadyNext,
      surface,
    );
  }, [enabled, readyNext, hasQuestionCandidates, t.modeBToastMediatorReadyNext, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      generatingCandidates,
      IDS.genCandidates,
      t.modeBToastGeneratingCandidates,
      surface,
    );
  }, [enabled, generatingCandidates, t.modeBToastGeneratingCandidates, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      !generatingCandidates && hasQuestionCandidates && dialogueLike,
      IDS.candidatesReady,
      t.modeBToastCandidatesReady,
      surface,
    );
  }, [
    enabled,
    generatingCandidates,
    hasQuestionCandidates,
    dialogueLike,
    t.modeBToastCandidatesReady,
    surface,
  ]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      generatingOptions || phase === "generating_options",
      IDS.genOptions,
      t.modeAToastGeneratingOptions,
      surface,
    );
  }, [enabled, generatingOptions, phase, t.modeAToastGeneratingOptions, surface]);

  useEffect(() => {
    syncAttentionWait(enabled, waitingVotes, IDS.waitVotes, t.modeBToastWaitingVotes, surface);
  }, [enabled, waitingVotes, t.modeBToastWaitingVotes, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      compromiseGen,
      IDS.genCompromise,
      t.modeAToastGeneratingCompromise,
      surface,
    );
  }, [enabled, compromiseGen, t.modeAToastGeneratingCompromise, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      compromiseDraftReady,
      IDS.compromiseDraftReady,
      t.modeBToastCompromiseDraftReady,
      surface,
    );
  }, [enabled, compromiseDraftReady, t.modeBToastCompromiseDraftReady, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingCompromiseVotes,
      IDS.waitCompromiseVotes,
      t.modeBToastWaitingCompromiseVotes,
      surface,
    );
  }, [enabled, waitingCompromiseVotes, t.modeBToastWaitingCompromiseVotes, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      agreementGen,
      IDS.genAgreement,
      t.modeAToastGeneratingAgreement,
      surface,
    );
  }, [enabled, agreementGen, t.modeAToastGeneratingAgreement, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      agreementDraftReady,
      IDS.agreementDraftReady,
      t.modeBToastAgreementDraftReady,
      surface,
    );
  }, [enabled, agreementDraftReady, t.modeBToastAgreementDraftReady, surface]);

  useEffect(() => {
    syncAttentionWait(
      enabled,
      waitingAccepts,
      IDS.waitAccepts,
      t.mediationWaitingOtherAccept,
      surface,
    );
  }, [enabled, waitingAccepts, t.mediationWaitingOtherAccept, surface]);

  useEffect(() => {
    syncAttentionReadyPersistent(
      enabled,
      bothAcceptedEnd,
      IDS.bothAcceptedEnd,
      t.modeBToastBothAcceptedEnd,
      surface,
    );
  }, [enabled, bothAcceptedEnd, t.modeBToastBothAcceptedEnd, surface]);

  useEffect(() => {
    return () => clearMediatorAttention();
  }, []);
}
