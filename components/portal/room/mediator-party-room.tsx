"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { toastActionError } from "@/lib/toast-action-error";

import {
  downloadMediatorPartyResults,
  fetchMediatorPartyRoomState,
  helpFormulateMediatorPartyReply,
  sendMediatorPartyReply,
  submitMediatorPartyAgreement,
  submitMediatorPartyCompromiseVote,
  submitMediatorPartyVote,
} from "@/app/mediator/rooms/party-actions";
import { MediationCountdown } from "@/components/portal/mediation-countdown";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationOptionsPanel } from "@/components/portal/room/mediation-options-panel";
import { MediationCompromisePanel } from "@/components/portal/room/mediation-compromise-panel";
import { MediationResultsPanel } from "@/components/portal/room/mediation-results-panel";
import { MediationChat, MediationChatComposer } from "@/components/portal/room/mediation-chat";
import { useLocale } from "@/components/locale-provider";
import { useModeBPartyRoomWaitToasts } from "@/hooks/use-mode-b-wait-toasts";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { resolveRoomFlowStep } from "@/lib/participant-flow";
import { partyDisplayLabel, type PartyRole } from "@/lib/participant-roles";
import { cn } from "@/lib/utils";
import type { MediatorSessionRoomState } from "@/lib/mediator-session/orchestrator";
import type { MediationPhase } from "@/lib/mediation/types";
import { useSession } from "next-auth/react";

type MediatorPartyRoomProps = {
  initialState: MediatorSessionRoomState;
  viewerRole: PartyRole;
  review?: boolean;
};

export function MediatorPartyRoom({
  initialState,
  viewerRole,
  review = false,
}: MediatorPartyRoomProps) {
  const { portal: t } = useLocale();
  const { data: session } = useSession();
  const [state, setState] = useState(initialState);
  const [reply, setReply] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [formulatePending, startFormulate] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorPartyRoomState();
      if (next) setState(next);
    } catch {
      /* ignore */
    }
  }, []);

  const phase = state.room.phase as MediationPhase | null;
  const isSessionComplete = phase === "completed";
  const isTreatyView = isSessionComplete && !review;
  const resultsSummary = state.resultsSummary;
  const awaitingCompromisePublish = !!state.room.awaitingCompromisePublish;
  const awaitingMediatorPublish = !!state.room.awaitingMediatorPublish;
  const hasOptions = (state.options?.length ?? 0) > 0;
  const hasCompromise = !!state.compromise;
  const agreementPublished = !!state.room.agreementPublished;
  const selfVote = state.room.selfVote;
  const selfCompromiseVote = state.room.selfCompromiseVote;
  const agreementAccepted = !!state.room.agreementAccepted;
  // Mode A–style: fast poll while generating or while party must act (SSE often stalls on Vercel).
  const isAwaitingUpdate =
    phase === "generating_options" ||
    awaitingCompromisePublish ||
    awaitingMediatorPublish ||
    (phase === "voting" && hasOptions && !selfVote) ||
    (phase === "voting_discrepancy" && hasCompromise && selfCompromiseVote == null) ||
    (phase === "agreement" && agreementPublished && !agreementAccepted);

  useRoomRealtime(state.room.id, () => {
    if (!review && !isSessionComplete) void refresh();
  }, {
    enabled: !review && !isSessionComplete,
    watchUsers: false,
    pollIntervalMs: isAwaitingUpdate ? 2_500 : 4_000,
  });

  const flowStep = resolveRoomFlowStep(phase, review);

  const bothAccepted =
    agreementAccepted && !!state.room.otherAgreementAccepted;
  const waitingForMediatorComplete =
    phase === "agreement" && bothAccepted && !isSessionComplete;

  useModeBPartyRoomWaitToasts({
    phase,
    pendingQuestion: !!state.room.pendingQuestion,
    peerHasPendingQuestion: !!state.room.peerHasPendingQuestion,
    hasOptions,
    hasCompromise,
    agreementPublished,
    awaitingCompromisePublish,
    awaitingMediatorPublish,
    selfVote,
    peerHasVoted: !!state.room.peerHasVoted,
    selfCompromiseVote,
    agreementAccepted,
    otherAgreementAccepted: !!state.room.otherAgreementAccepted,
    waitingForMediatorComplete,
    enabled: !review && !isSessionComplete,
  });

  const onSend = () => {
    if (!reply.trim()) return;
    startTransition(async () => {
      try {
        const result = await sendMediatorPartyReply(reply);
        if (result.moderated) toast.message(t.mediationAttackRedirected);
        setReply("");
        await refresh();
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onVote = (optionId: string) => {
    startTransition(async () => {
      try {
        const next = await submitMediatorPartyVote(optionId);
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onCompromise = (accepted: boolean) => {
    startTransition(async () => {
      try {
        const next = await submitMediatorPartyCompromiseVote(accepted);
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onAcceptAgreement = () => {
    startTransition(async () => {
      try {
        const next = await submitMediatorPartyAgreement();
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onDownload = () => {
    startTransition(async () => {
      try {
        const file = await downloadMediatorPartyResults();
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

  const draft = state.draftAgreement;

  return (
    <PortalPageShell flowStep={flowStep}>
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4 px-margin-mobile py-stack-md md:px-margin-desktop",
          isTreatyView ? "max-w-container-max" : "max-w-3xl",
        )}
      >
        <div className="space-y-1">
          <h1 className="font-display text-headline-md text-on-surface">
            {partyDisplayLabel(viewerRole, t.roles, session?.user?.title)}
          </h1>
          <p className="text-body-md text-on-surface-variant">{state.room.title}</p>
        </div>
        {!isSessionComplete && state.room.mediationStartedAt ? (
          <MediationCountdown
            durationMinutes={state.room.mediationDurationMinutes}
            sessionComplete={isSessionComplete}
            startedAt={state.room.mediationStartedAt}
            onEnded={() => {
              void refresh();
            }}
          />
        ) : null}

        {isTreatyView && resultsSummary ? (
          <div className="space-y-6">
            <p className="font-display text-headline-md text-success">{t.mediationSessionCompleted}</p>
            <MediationResultsPanel summary={resultsSummary} />
            <div className="space-y-3 border-t border-hair pt-4">
              <button
                className="btn-secondary px-4 py-2 text-body-sm"
                disabled={pending}
                onClick={onDownload}
                type="button"
              >
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
                <button
                  className="btn-secondary px-4 py-2 text-body-sm"
                  onClick={onEmailPlaceholder}
                  type="button"
                >
                  {t.mediationEmailSend}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <MediationChat
              header={
                <div className="px-4 py-3">
                  <p className="font-display text-label-md uppercase text-on-surface-variant">
                    {t.mediationPhaseLabel}:{" "}
                    {phase ? (t.mediationPhases[phase] ?? phase) : "—"}
                  </p>
                </div>
              }
              labels={{
                preparing: t.mediationPreparing,
                you: t.mediationYou,
                agent: t.mediationAgent,
                system: t.mediationSystem,
                translatedBadge: t.mediationTranslatedBadge,
                showOriginal: t.mediationShowOriginal,
                hideOriginal: t.mediationHideOriginal,
              }}
              messages={state.messages.map((m) => {
                let senderLabel: string | null = null;
                if (!m.isOwn) {
                  if (m.isMediatorAuthored) {
                    senderLabel = t.mediationMediatorLabel(state.mediatorTitle);
                  } else if (m.senderType === "participant" && m.senderPartyRole) {
                    senderLabel = t.roles[m.senderPartyRole] ?? m.senderPartyRole;
                  }
                }
                return {
                  id: m.id,
                  senderType: m.senderType,
                  content: m.content,
                  createdAt: m.createdAt,
                  isOwn: m.isOwn,
                  senderLabel,
                  isTranslated: m.isTranslated,
                  originalText: m.originalText,
                };
              })}
              footer={
                state.room.canReply && !review ? (
                  <MediationChatComposer
                    disabled={pending}
                    helpFormulateLabel={t.mediationHelpFormulate}
                    helpFormulatePending={formulatePending}
                    helpFormulatePendingLabel={t.mediationHelpFormulatePending}
                    onChange={setReply}
                    onHelpFormulate={() => {
                      const draft = reply.trim();
                      if (!draft) return;
                      startFormulate(async () => {
                        try {
                          const rewritten = await helpFormulateMediatorPartyReply(draft);
                          setReply(rewritten);
                        } catch {
                          toast.error(t.mediationHelpFormulateFailed);
                        }
                      });
                    }}
                    onSend={onSend}
                    pending={pending}
                    placeholder={t.mediationReplyPlaceholder}
                    sendLabel={t.mediationSendReply}
                    value={reply}
                  />
                ) : undefined
              }
            />

            {(phase === "voting" ||
              phase === "voting_discrepancy" ||
              phase === "agreement" ||
              phase === "completed") &&
            state.options.length > 0 ? (
              <MediationOptionsPanel
                canVote={phase === "voting" && !state.room.selfVote && !review}
                onVote={onVote}
                options={state.options}
                partyAVoteOptionId={viewerRole === "party_a" ? state.room.selfVote : state.room.otherVote}
                partyBVoteOptionId={viewerRole === "party_b" ? state.room.selfVote : state.room.otherVote}
                pending={pending}
                phase={phase}
                review={review || phase !== "voting"}
                selectedOptionId={state.room.selectedOptionId}
                selfVote={state.room.selfVote}
                showHeading
                viewerRole={viewerRole}
              />
            ) : null}

            {state.compromise &&
            (phase === "voting_discrepancy" ||
              phase === "agreement" ||
              phase === "completed") ? (
              <MediationCompromisePanel
                compromise={{
                  id: state.compromise.id,
                  description: state.compromise.description,
                  legalNorms: state.compromise.legalNorms,
                  fulfillmentProbability: state.compromise.fulfillmentProbability,
                  refusalRisks: state.compromise.refusalRisks,
                }}
                onAccept={() => onCompromise(true)}
                onReject={() => onCompromise(false)}
                options={state.options}
                partyACompromiseVote={
                  viewerRole === "party_a" ? state.room.selfCompromiseVote : state.room.otherCompromiseVote
                }
                partyBCompromiseVote={
                  viewerRole === "party_b" ? state.room.selfCompromiseVote : state.room.otherCompromiseVote
                }
                partyAVoteOptionId={viewerRole === "party_a" ? state.room.selfVote : state.room.otherVote}
                partyBVoteOptionId={viewerRole === "party_b" ? state.room.selfVote : state.room.otherVote}
                pending={pending}
                phase={phase}
                review={review || phase !== "voting_discrepancy"}
                selectedOptionId={state.room.selectedOptionId}
                selfCompromiseVote={state.room.selfCompromiseVote}
              />
            ) : null}

            {phase === "agreement" && draft && state.room.agreementPublished ? (
              <div className="space-y-4">
                <h2 className="font-display text-headline-md text-on-surface">
                  {draft.title ?? t.mediationAgreementTitle}
                </h2>
                <div className="glass-panel whitespace-pre-wrap rounded-xl p-4 text-body-md text-on-surface">
                  {draft.body}
                </div>
                {draft.obligations?.length ? (
                  <ul className="list-disc space-y-2 pl-5 text-body-md text-on-surface">
                    {draft.obligations.map((obligation) => (
                      <li key={obligation.id}>
                        <span>{obligation.text}</span>
                        {obligation.deadline ? (
                          <span className="mt-0.5 block text-body-sm text-on-surface-variant">
                            {obligation.deadline}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : draft.terms?.length ? (
                  <ul className="list-disc space-y-1 pl-5 text-body-md text-on-surface">
                    {draft.terms.map((term, index) => (
                      <li key={`${term}-${index}`}>{term}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="rounded-lg border border-hair bg-surface-container p-3 text-body-sm text-on-surface-variant">
                  {t.mediationUplDisclaimer}
                </p>
                {!review ? (
                  <button
                    className="btn-primary px-4 py-2 text-body-sm disabled:opacity-60"
                    disabled={pending || state.room.agreementAccepted}
                    onClick={onAcceptAgreement}
                    type="button"
                  >
                    {state.room.agreementAccepted ? t.mediationAccepted : t.mediationIAccept}
                  </button>
                ) : null}
              </div>
            ) : null}

            {isSessionComplete && !resultsSummary ? (
              <p className="text-body-md text-on-surface-variant">{t.mediationNoAgreementOutcome}</p>
            ) : null}
          </>
        )}
      </div>
    </PortalPageShell>
  );
}
