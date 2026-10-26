"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toastActionError } from "@/lib/toast-action-error";
import {
  endMediatorSessionAction,
  fetchMediatorSessionState,
  generateMediatorOptionsAction,
  generateMediatorQuestionCandidatesAction,
  publishMediatorCompromiseAction,
  publishMediatorDraftAgreementAction,
  returnMediatorSessionToDialogueAction,
  saveMediatorDraftAgreementAction,
  helpFormulateMediatorText,
  sendCustomMediatorQuestionAction,
  sendMediatorQuestionAction,
} from "@/app/mediator/rooms/actions";
import { MediationCountdown } from "@/components/portal/mediation-countdown";
import { MediationCompromisePanel } from "@/components/portal/room/mediation-compromise-panel";
import { MediationOptionsPanel } from "@/components/portal/room/mediation-options-panel";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useModeBMediatorRoomWaitToasts } from "@/hooks/use-mode-b-wait-toasts";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { SESSION_END_REDIRECT_MS } from "@/lib/mediator-session/constants";
import { isMediatorSessionEnded } from "@/lib/mediator-session/room-mode";
import type {
  MediatorAudience,
  MediatorSessionRoomState,
} from "@/lib/mediator-session/orchestrator";
import type { PartyRole } from "@/lib/participant-roles";
import type {
  DraftAgreement,
  DraftObligation,
  MediationOption,
  MediationPhase,
} from "@/lib/mediation/types";
import { psychodynamicProfileLabels } from "@/lib/mediation/format-pdf-content";
import type { PsychodynamicProfile } from "@/lib/pipeline/schemas";
import { psychodynamicProfileSchema } from "@/lib/pipeline/schemas";
import type { Locale } from "@/lib/i18n";
import type { AdminCopy } from "@/lib/admin-i18n";
import { resolveLocalizedSystemMessage } from "@/lib/mediation/system-messages";

type MediatorSessionRoomProps = {
  roomId: string;
  initialState: MediatorSessionRoomState;
};

type SessionMessage = MediatorSessionRoomState["messages"][number];

function partyDisplayName(
  role: PartyRole | null | undefined,
  profiles: MediatorSessionRoomState["profiles"],
  roles: Record<string, string>,
) {
  if (!role) return null;
  const roleLabel = roles[role] ?? role;
  const title =
    role === "party_a" ? profiles?.partyA.title : role === "party_b" ? profiles?.partyB.title : null;
  if (title && title.trim() && title !== roleLabel) {
    return `${roleLabel} · ${title}`;
  }
  return roleLabel;
}

function formatMessageMeta(
  message: SessionMessage,
  admin: AdminCopy,
  labels: {
    agent: string;
    system: string;
    roles: Record<string, string>;
  },
  profiles: MediatorSessionRoomState["profiles"],
  mediatorTitle: string,
) {
  const kindLabel = message.messageKind
    ? (admin.mediatorMessageKinds[message.messageKind] ?? null)
    : null;

  if (message.senderType === "participant") {
    return (
      partyDisplayName(message.senderPartyRole, profiles, labels.roles) ??
      labels.roles.party_a ??
      "Participant"
    );
  }

  if (message.senderType === "system") {
    return kindLabel ? `${labels.system} · ${kindLabel}` : labels.system;
  }

  const base = message.isMediatorAuthored
    ? admin.mediatorLabel(mediatorTitle)
    : kindLabel
      ? `${labels.agent} · ${kindLabel}`
      : labels.agent;

  if (
    message.messageKind === "mediation_question" ||
    message.messageKind === "mediation_moderation" ||
    message.messageKind === "mediation_nudge"
  ) {
    if (message.isBroadcast) {
      return `${base} · ${admin.mediatorMessageToBoth}`;
    }
    const addressee = partyDisplayName(message.addresseePartyRole, profiles, labels.roles);
    if (addressee) {
      return `${base} · ${admin.mediatorMessageToParty} ${addressee}`;
    }
  }
  return base;
}

export function MediatorSessionRoom({ roomId, initialState }: MediatorSessionRoomProps) {
  const { admin, portal: t, locale } = useLocale();
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [formulatePending, startFormulate] = useTransition();
  const [generatingCandidates, setGeneratingCandidates] = useState(false);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<MediatorAudience>("both");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [customText, setCustomText] = useState("");
  const [compromiseEdit, setCompromiseEdit] = useState<MediationOption | null>(null);
  const [draftEdit, setDraftEdit] = useState<DraftAgreement | null>(null);
  const selectedParty: PartyRole =
    selectedAudience === "party_b" ? "party_b" : "party_a";
  const isPartyAudience = selectedAudience === "party_a" || selectedAudience === "party_b";

  const sessionEnded = isMediatorSessionEnded(state.room.phase);

  const hasQuestionCandidates =
    (state.questionCandidates.party_a?.length ?? 0) > 0 ||
    (state.questionCandidates.party_b?.length ?? 0) > 0;
  const draftStatus = state.draftAgreement?.status ?? null;
  const agreementPublished = draftStatus === "published" || draftStatus === "accepted";
  const generatingCompromise =
    state.room.phase === "voting_discrepancy" &&
    !state.compromiseDraft &&
    !state.compromisePublished;
  const generatingAgreement =
    state.room.phase === "agreement" && !state.draftAgreement && !agreementPublished;

  useModeBMediatorRoomWaitToasts({
    phase: state.room.phase as MediationPhase | null,
    partyAPendingReply: !!state.room.partyAPendingReply,
    partyBPendingReply: !!state.room.partyBPendingReply,
    generatingCandidates,
    hasQuestionCandidates,
    generatingOptions,
    hasOptions: (state.options?.length ?? 0) > 0,
    partyAVote: state.room.partyAVote,
    partyBVote: state.room.partyBVote,
    generatingCompromise,
    hasCompromiseDraft: !!state.compromiseDraft,
    compromisePublished: !!state.compromisePublished,
    partyACompromiseVote: state.room.partyACompromiseVote,
    partyBCompromiseVote: state.room.partyBCompromiseVote,
    generatingAgreement,
    hasAgreementDraft: !!state.draftAgreement,
    agreementPublished,
    partyAAccepted: !!state.room.partyAAgreementAccepted,
    partyBAccepted: !!state.room.partyBAgreementAccepted,
    enabled: !sessionEnded,
  });

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorSessionState(roomId, locale);
      if (next) setState(next);
    } catch {
      /* ignore */
    }
  }, [roomId, locale]);

  useRoomRealtime(roomId, () => {
    void refresh();
  }, {
    watchUsers: false,
  });

  // Re-resolve bilingual fields when UI locale changes.
  useEffect(() => {
    void refresh();
  }, [locale, refresh]);

  useEffect(() => {
    if (!state.compromiseDraft || state.compromisePublished) {
      if (state.compromisePublished) setCompromiseEdit(null);
      return;
    }
    setCompromiseEdit((prev) => {
      if (prev?.id === state.compromiseDraft!.id) return prev;
      return {
        id: state.compromiseDraft!.id,
        canonicalDescription: state.compromiseDraft!.canonicalDescription,
        legalNorms: state.compromiseDraft!.legalNorms,
        fulfillmentProbability: state.compromiseDraft!.fulfillmentProbability,
        refusalRisks: state.compromiseDraft!.refusalRisks,
        partyA: state.compromiseDraft!.partyA ?? "",
        partyB: state.compromiseDraft!.partyB ?? "",
      };
    });
  }, [state.compromiseDraft, state.compromisePublished]);

  useEffect(() => {
    if (state.room.phase !== "agreement" || !state.draftAgreement) {
      setDraftEdit(null);
      return;
    }
    setDraftEdit((prev) => {
      if (prev && prev.generatedAt === state.draftAgreement!.generatedAt && prev.status === state.draftAgreement!.status) {
        return prev;
      }
      return {
        ...state.draftAgreement!,
        obligations: state.draftAgreement!.obligations?.length
          ? state.draftAgreement!.obligations
          : (state.draftAgreement!.terms ?? []).map((text, index) => ({
              id: `term-${index}`,
              text,
              deadline: null,
              source: "option" as const,
            })),
        protectiveClauseIds: state.draftAgreement!.protectiveClauseIds ?? [],
        status: state.draftAgreement!.status ?? "draft",
      };
    });
  }, [state.draftAgreement, state.room.phase]);

  useEffect(() => {
    if (!sessionEnded) return;
    const timeoutId = window.setTimeout(() => {
      router.push(`/mediator/rooms/${roomId}`);
    }, SESSION_END_REDIRECT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [sessionEnded, roomId, router]);

  const canGenerateQuestions =
    isPartyAudience &&
    (state.room.phase === "opening" || state.room.phase === "dialogue") &&
    (state.options?.length ?? 0) === 0;
  const canSendCustom = !sessionEnded;

  const candidates =
    selectedParty === "party_a"
      ? state.questionCandidates.party_a
      : state.questionCandidates.party_b;

  const onSelectCandidate = (id: string) => {
    if (!canGenerateQuestions) return;
    setSelectedCandidateId(id);
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return;
    setEditText(selectedParty === "party_a" ? candidate.partyA : candidate.partyB);
  };

  const onGenerateQuestions = () => {
    setGeneratingCandidates(true);
    startTransition(async () => {
      try {
        const next = await generateMediatorQuestionCandidatesAction(roomId, locale);
        if (next) setState(next);
        else await refresh();
        toast.success(admin.mediatorGenerateQuestions);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      } finally {
        setGeneratingCandidates(false);
      }
    });
  };

  const onSendQuestion = () => {
    if (!selectedCandidateId) return;
    startTransition(async () => {
      try {
        const next = await sendMediatorQuestionAction({
          roomId,
          partyRole: selectedParty,
          candidateId: selectedCandidateId,
          editedText: editText,
          sourceLocale: locale,
          viewerLocale: locale,
        });
        if (next) setState(next);
        setSelectedCandidateId(null);
        setEditText("");
        toast.success(admin.mediatorSendQuestion);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onSendCustomQuestion = () => {
    if (!customText.trim()) return;
    startTransition(async () => {
      try {
        const next = await sendCustomMediatorQuestionAction({
          roomId,
          audience: selectedAudience,
          text: customText,
          sourceLocale: locale,
          viewerLocale: locale,
        });
        if (next) setState(next);
        setCustomText("");
        toast.success(admin.mediatorSendQuestion);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onGenerateOptions = () => {
    setGeneratingOptions(true);
    startTransition(async () => {
      try {
        const next = await generateMediatorOptionsAction(roomId, locale);
        if (next) setState(next);
        toast.success(admin.mediatorGenerateOptions);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      } finally {
        setGeneratingOptions(false);
      }
    });
  };

  const onPublishCompromise = () => {
    if (!compromiseEdit) return;
    startTransition(async () => {
      try {
        const next = await publishMediatorCompromiseAction({
          roomId,
          draft: compromiseEdit,
          viewerLocale: locale,
        });
        if (next) setState(next);
        toast.success(admin.mediatorPublishCompromise);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onReturnToDialogue = () => {
    if (!window.confirm(admin.mediatorReturnToDialogueConfirm)) return;
    startTransition(async () => {
      try {
        const next = await returnMediatorSessionToDialogueAction(roomId, locale);
        if (next) setState(next);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onSaveDraft = () => {
    if (!draftEdit) return;
    startTransition(async () => {
      try {
        const next = await saveMediatorDraftAgreementAction(roomId, draftEdit, locale);
        if (next) setState(next);
        toast.success(admin.mediatorDraftSaved);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const onPublishDraft = () => {
    if (!draftEdit) return;
    startTransition(async () => {
      try {
        await saveMediatorDraftAgreementAction(roomId, draftEdit, locale);
        const next = await publishMediatorDraftAgreementAction(roomId, locale);
        if (next) setState(next);
        toast.success(admin.mediatorDraftPublished);
      } catch (error) {
        toastActionError(error, t.mediationActionFailed);
      }
    });
  };

  const updateObligation = (id: string, patch: Partial<DraftObligation>) => {
    setDraftEdit((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        obligations: prev.obligations.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      };
    });
  };

  const onEndSession = () => {
    if (!window.confirm(admin.mediatorEndSessionConfirm)) return;
    startTransition(async () => {
      try {
        const next = await endMediatorSessionAction(roomId, locale);
        if (next) setState(next);
      } catch {
        toast.error(admin.mediatorEndSessionError);
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary hover:text-on-surface"
          href={`/mediator/rooms/${roomId}`}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          {admin.returnToRooms}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {!sessionEnded ? (
            <button
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-body-sm font-semibold text-error disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={onEndSession}
              type="button"
            >
              {pending ? <Spinner className="text-error" size="sm" /> : null}
              {admin.mediatorEndSession}
            </button>
          ) : null}
        </div>
      </div>
      {!sessionEnded && state.room.mediationStartedAt ? (
        <MediationCountdown
          durationMinutes={state.room.mediationDurationMinutes}
          sessionComplete={sessionEnded}
          startedAt={state.room.mediationStartedAt}
          surface="mediator-dock"
          onEnded={() => {
            void refresh();
          }}
        />
      ) : null}

      {sessionEnded ? (
        <p className="rounded-xl border border-law/30 bg-law/10 px-4 py-3 text-body-sm font-semibold text-on-surface">
          {admin.mediatorSessionFinished}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1.4fr)_320px]">
        <aside className="glass-panel space-y-4 rounded-xl p-4">
          <h3 className="font-display text-label-md uppercase text-on-surface-variant">
            {admin.mediatorProfilesTitle}
          </h3>
          {state.profiles ? (
            <>
              <ProfileCard
                locale={locale}
                profile={state.profiles.partyA.psychodynamic}
                title={state.profiles.partyA.title}
              />
              <ProfileCard
                locale={locale}
                profile={state.profiles.partyB.psychodynamic}
                title={state.profiles.partyB.title}
              />
            </>
          ) : null}
        </aside>

        <div className="glass-panel flex min-h-[28rem] flex-col rounded-xl p-4">
          <p className="mb-3 text-body-sm text-on-surface-variant">
            {t.mediationPhaseLabel}:{" "}
            {state.room.phase
              ? (t.mediationPhases[state.room.phase] ?? state.room.phase)
              : "—"}
          </p>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {state.messages.map((message) => (
              <div
                className="rounded-lg border border-hair bg-paper/60 px-3 py-2 text-body-sm text-on-surface"
                key={message.id}
              >
                <p className="mb-1 text-label-md uppercase text-on-surface-variant">
                  {formatMessageMeta(
                    message,
                    admin,
                    {
                      agent: t.mediationAgent,
                      system: t.mediationSystem,
                      roles: t.roles,
                    },
                    state.profiles,
                    state.mediatorTitle,
                  )}
                </p>
                <p className="whitespace-pre-wrap">
                  {message.messageKind === "mediation_system"
                    ? resolveLocalizedSystemMessage(message.content, locale)
                    : message.content}
                </p>
                {"isTranslated" in message &&
                message.isTranslated &&
                message.originalText ? (
                  <details className="mt-1 text-[12px] text-on-surface-variant">
                    <summary className="cursor-pointer text-law">
                      {t.mediationTranslatedBadge} — {t.mediationShowOriginal}
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-black/5 px-2 py-1">
                      {message.originalText}
                    </p>
                  </details>
                ) : null}
              </div>
            ))}
          </div>

          {state.options.length > 0 ? (
            <div className="mt-4 border-t border-hair pt-4">
              <MediationOptionsPanel
                canVote={false}
                options={state.options}
                partyAVoteOptionId={state.room.partyAVote ?? null}
                partyBVoteOptionId={state.room.partyBVote ?? null}
                phase={state.room.phase as MediationPhase | null}
                selectedOptionId={state.room.selectedOptionId}
                selfVote={null}
                showAllVotes
                viewerRole="party_a"
              />
            </div>
          ) : null}

          {state.compromise &&
          (state.room.phase === "voting_discrepancy" ||
            state.room.phase === "agreement" ||
            state.room.phase === "completed") ? (
            <div className="mt-4 border-t border-hair pt-4">
              <MediationCompromisePanel
                compromise={{
                  id: state.compromise.id,
                  description: state.compromise.description,
                  legalNorms: state.compromise.legalNorms,
                  fulfillmentProbability: state.compromise.fulfillmentProbability,
                  refusalRisks: state.compromise.refusalRisks,
                }}
                options={state.options}
                partyACompromiseVote={state.room.partyACompromiseVote ?? null}
                partyBCompromiseVote={state.room.partyBCompromiseVote ?? null}
                partyAVoteOptionId={state.room.partyAVote ?? null}
                partyBVoteOptionId={state.room.partyBVote ?? null}
                phase={state.room.phase as MediationPhase | null}
                review
                selectedOptionId={state.room.selectedOptionId}
                selfCompromiseVote={null}
              />
            </div>
          ) : null}
        </div>

        <aside className="glass-panel space-y-4 rounded-xl p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "both" as const, label: admin.mediatorAudienceBoth },
                { id: "party_a" as const, label: t.roles.party_a },
                { id: "party_b" as const, label: t.roles.party_b },
              ] as const
            ).map((tab) => (
              <button
                className={`rounded-md px-3 py-1.5 text-body-sm ${
                  selectedAudience === tab.id
                    ? "bg-law text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
                key={tab.id}
                onClick={() => {
                  setSelectedAudience(tab.id);
                  setSelectedCandidateId(null);
                  setEditText("");
                }}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isPartyAudience ? (
            <>
              <button
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pending || !canGenerateQuestions}
                onClick={onGenerateQuestions}
                type="button"
              >
                {pending ? <Spinner className="text-white" size="sm" /> : null}
                {admin.mediatorGenerateQuestions}
              </button>

              <div className="space-y-2">
                <p className="text-label-md uppercase text-on-surface-variant">
                  {admin.mediatorQuestionCandidates}
                </p>
                {candidates.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant">{admin.mediatorSelectCandidate}</p>
                ) : (
                  candidates.map((candidate) => (
                    <button
                      className={`block w-full rounded-md border px-3 py-2 text-left text-body-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                        selectedCandidateId === candidate.id
                          ? "border-law bg-law/10"
                          : "border-hair bg-paper"
                      }`}
                      disabled={!canGenerateQuestions}
                      key={candidate.id}
                      onClick={() => onSelectCandidate(candidate.id)}
                      type="button"
                    >
                      {selectedParty === "party_a" ? candidate.partyA : candidate.partyB}
                    </button>
                  ))
                )}
              </div>

              {selectedCandidateId && canGenerateQuestions ? (
                <div className="space-y-2">
                  <label className="text-body-sm text-on-surface-variant">{admin.mediatorEditQuestion}</label>
                  <textarea
                    className="w-full rounded-md border border-hair bg-paper px-3 py-2 text-body-sm"
                    onChange={(event) => setEditText(event.target.value)}
                    rows={4}
                    value={editText}
                  />
                  <button
                    className="rounded-full border border-hair px-3 py-1 text-[12px] font-medium text-law disabled:opacity-40"
                    disabled={pending || formulatePending || !editText.trim()}
                    onClick={() => {
                      const draft = editText.trim();
                      if (!draft) return;
                      startFormulate(async () => {
                        try {
                          setEditText(await helpFormulateMediatorText(draft));
                        } catch {
                          toast.error(t.mediationHelpFormulateFailed);
                        }
                      });
                    }}
                    type="button"
                  >
                    {formulatePending
                      ? t.mediationHelpFormulatePending
                      : t.mediationHelpFormulate}
                  </button>
                  <button
                    className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
                    disabled={pending || !editText.trim()}
                    onClick={onSendQuestion}
                    type="button"
                  >
                    {admin.mediatorSendQuestion}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {canSendCustom ? (
            <div className="space-y-2">
              <label className="text-body-sm text-on-surface-variant">{admin.mediatorOwnQuestion}</label>
              <textarea
                className="w-full rounded-md border border-hair bg-paper px-3 py-2 text-body-sm"
                onChange={(event) => setCustomText(event.target.value)}
                rows={4}
                value={customText}
              />
              <button
                className="rounded-full border border-hair px-3 py-1 text-[12px] font-medium text-law disabled:opacity-40"
                disabled={pending || formulatePending || !customText.trim()}
                onClick={() => {
                  const draft = customText.trim();
                  if (!draft) return;
                  startFormulate(async () => {
                    try {
                      setCustomText(await helpFormulateMediatorText(draft));
                    } catch {
                      toast.error(t.mediationHelpFormulateFailed);
                    }
                  });
                }}
                type="button"
              >
                {formulatePending
                  ? t.mediationHelpFormulatePending
                  : t.mediationHelpFormulate}
              </button>
              <button
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
                disabled={pending || !customText.trim()}
                onClick={onSendCustomQuestion}
                type="button"
              >
                {admin.mediatorSendQuestion}
              </button>
            </div>
          ) : null}

          {state.room.phase === "opening" ||
          state.room.phase === "dialogue" ||
          state.room.phase === "generating_options" ? (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md border border-law px-3 py-2 text-body-sm font-semibold text-law disabled:opacity-60"
              disabled={
                pending ||
                generatingOptions ||
                state.room.phase === "generating_options"
              }
              onClick={onGenerateOptions}
              type="button"
            >
              {generatingOptions || state.room.phase === "generating_options" ? (
                <>
                  <Spinner size="sm" />
                  {t.modeAToastGeneratingOptions}
                </>
              ) : (
                admin.mediatorGenerateOptions
              )}
            </button>
          ) : null}

          {state.room.phase === "voting_discrepancy" ? (
            <div className="space-y-3 border-t border-hair pt-3">
              <p className="text-label-md uppercase text-on-surface-variant">
                {admin.mediatorProposeCompromise}
              </p>

              {!state.compromisePublished && !compromiseEdit ? (
                <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  <Spinner size="sm" />
                  {admin.mediatorCompromiseGenerating}
                </p>
              ) : null}

              {compromiseEdit && !state.compromisePublished ? (
                <>
                  {(
                    [
                      {
                        key: "canonicalDescription" as const,
                        label: admin.mediatorCompromiseCanonical,
                        rows: 3,
                      },
                      {
                        key: "partyA" as const,
                        label: admin.mediatorCompromisePartyA,
                        rows: 3,
                      },
                      {
                        key: "partyB" as const,
                        label: admin.mediatorCompromisePartyB,
                        rows: 3,
                      },
                      {
                        key: "legalNorms" as const,
                        label: admin.mediatorCompromiseLegalNorms,
                        rows: 2,
                      },
                      {
                        key: "fulfillmentProbability" as const,
                        label: admin.mediatorCompromiseFulfillment,
                        rows: 2,
                      },
                      {
                        key: "refusalRisks" as const,
                        label: admin.mediatorCompromiseRefusalRisks,
                        rows: 2,
                      },
                    ] as const
                  ).map((field) => (
                    <label className="block space-y-1" key={field.key}>
                      <span className="text-body-sm text-on-surface-variant">{field.label}</span>
                      <textarea
                        className="w-full rounded-md border border-ink/25 bg-surface-variant px-3 py-2 text-body-sm text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
                        onChange={(event) =>
                          setCompromiseEdit((prev) =>
                            prev ? { ...prev, [field.key]: event.target.value } : prev,
                          )
                        }
                        rows={field.rows}
                        value={compromiseEdit[field.key]}
                      />
                    </label>
                  ))}

                  <button
                    className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
                    disabled={pending}
                    onClick={onPublishCompromise}
                    type="button"
                  >
                    {pending ? <Spinner className="text-white" size="sm" /> : null}
                    {admin.mediatorPublishCompromise}
                  </button>
                </>
              ) : null}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-md border border-hair px-3 py-2 text-body-sm font-semibold text-on-surface disabled:opacity-60"
                disabled={pending}
                onClick={onReturnToDialogue}
                type="button"
              >
                {admin.mediatorReturnToDialogue}
              </button>
            </div>
          ) : null}

          {state.room.phase === "agreement" && draftEdit ? (
            <div className="space-y-3 border-t border-hair pt-3">
              <p className="text-label-md uppercase text-on-surface-variant">
                {admin.mediatorAgreementDraftTitle}
              </p>
              <label className="block space-y-1">
                <span className="text-body-sm text-on-surface-variant">
                  {admin.mediatorAgreementDraftTitle}
                </span>
                <input
                  className="w-full rounded-md border border-ink/25 bg-surface-variant px-3 py-2 text-body-sm"
                  onChange={(event) =>
                    setDraftEdit((prev) =>
                      prev ? { ...prev, title: event.target.value } : prev,
                    )
                  }
                  value={draftEdit.title}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-body-sm text-on-surface-variant">
                  {admin.mediatorAgreementBody}
                </span>
                <textarea
                  className="w-full rounded-md border border-ink/25 bg-surface-variant px-3 py-2 text-body-sm"
                  onChange={(event) =>
                    setDraftEdit((prev) =>
                      prev ? { ...prev, body: event.target.value } : prev,
                    )
                  }
                  rows={5}
                  value={draftEdit.body}
                />
              </label>

              <div className="space-y-2">
                <p className="text-body-sm font-semibold text-on-surface">
                  {admin.mediatorAgreementObligations}
                </p>
                {draftEdit.obligations.map((obligation) => (
                  <div className="space-y-1 rounded-md border border-hair p-2" key={obligation.id}>
                    <textarea
                      className="w-full rounded-md border border-ink/25 bg-surface-variant px-2 py-1 text-body-sm"
                      onChange={(event) =>
                        updateObligation(obligation.id, {
                          text: event.target.value,
                          source: "mediator",
                        })
                      }
                      rows={2}
                      value={obligation.text}
                    />
                    <input
                      className="w-full rounded-md border border-ink/25 bg-surface-variant px-2 py-1 text-body-sm"
                      onChange={(event) =>
                        updateObligation(obligation.id, {
                          deadline: event.target.value || null,
                        })
                      }
                      placeholder={admin.mediatorObligationDeadline}
                      value={obligation.deadline ?? ""}
                    />
                    <button
                      className="text-body-sm text-error"
                      onClick={() =>
                        setDraftEdit((prev) =>
                          prev
                            ? {
                                ...prev,
                                obligations: prev.obligations.filter((o) => o.id !== obligation.id),
                              }
                            : prev,
                        )
                      }
                      type="button"
                    >
                      {admin.mediatorRemoveObligation}
                    </button>
                  </div>
                ))}
                <button
                  className="text-body-sm font-semibold text-law"
                  onClick={() =>
                    setDraftEdit((prev) =>
                      prev
                        ? {
                            ...prev,
                            obligations: [
                              ...prev.obligations,
                              {
                                id: `mediator-${crypto.randomUUID()}`,
                                text: "",
                                deadline: null,
                                source: "mediator",
                              },
                            ],
                          }
                        : prev,
                    )
                  }
                  type="button"
                >
                  {admin.mediatorAddObligation}
                </button>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-md border border-hair px-3 py-2 text-body-sm font-semibold disabled:opacity-60"
                disabled={pending || draftEdit.status === "published" || draftEdit.status === "accepted"}
                onClick={onSaveDraft}
                type="button"
              >
                {admin.mediatorSaveDraft}
              </button>
              <button
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
                disabled={pending || draftEdit.status === "published" || draftEdit.status === "accepted"}
                onClick={onPublishDraft}
                type="button"
              >
                {pending ? <Spinner className="text-white" size="sm" /> : null}
                {admin.mediatorPublishAgreement}
              </button>
            </div>
          ) : null}

          {state.room.phase === "agreement" && !draftEdit ? (
            <p className="flex items-center gap-2 border-t border-hair pt-3 text-body-sm text-on-surface-variant">
              <Spinner size="sm" />
              {t.mediationPreparing}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function parsePsychodynamicProfile(profile: unknown): PsychodynamicProfile | null {
  const parsed = psychodynamicProfileSchema.safeParse(profile);
  return parsed.success ? parsed.data : null;
}

function ProfileCard({
  title,
  profile,
  locale,
}: {
  title: string;
  profile: unknown;
  locale: Locale;
}) {
  const labels = psychodynamicProfileLabels[locale];
  const parsed = parsePsychodynamicProfile(profile);

  return (
    <div className="rounded-md border border-hair bg-paper/70 p-3">
      <p className="mb-2 font-semibold text-body-sm text-on-surface">{title}</p>
      <div className="max-h-56 space-y-2 overflow-auto text-body-sm text-on-surface-variant">
        {parsed ? (
          <>
            {parsed.summary ? (
              <p className="whitespace-pre-wrap text-on-surface">{parsed.summary}</p>
            ) : null}
            {parsed.traits.length > 0 ? (
              <ProfileSection items={parsed.traits} label={labels.traits} />
            ) : null}
            {parsed.attachmentStyle ? (
              <p>
                <span className="font-semibold text-on-surface">{labels.attachment}: </span>
                {parsed.attachmentStyle}
              </p>
            ) : null}
            {parsed.defenseMechanisms && parsed.defenseMechanisms.length > 0 ? (
              <ProfileSection items={parsed.defenseMechanisms} label={labels.defense} />
            ) : null}
            {parsed.relationalPatterns && parsed.relationalPatterns.length > 0 ? (
              <ProfileSection items={parsed.relationalPatterns} label={labels.relational} />
            ) : null}
          </>
        ) : (
          <p>{labels.unavailable}</p>
        )}
      </div>
    </div>
  );
}

function ProfileSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 font-semibold text-on-surface">{label}</p>
      <ul className="list-disc space-y-0.5 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
