"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  fetchMediatorSessionState,
  generateMediatorOptionsAction,
  generateMediatorQuestionCandidatesAction,
  publishMediatorCompromiseAction,
  sendCustomMediatorQuestionAction,
  sendMediatorQuestionAction,
} from "@/app/mediator/rooms/actions";
import { SessionElapsedTimer } from "@/components/mediator/session-elapsed-timer";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import type { MediatorSessionRoomState } from "@/lib/mediator-session/orchestrator";
import type { PartyRole } from "@/lib/participant-roles";
import type { MediationOption } from "@/lib/mediation/types";
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

  const base = kindLabel ? `${labels.agent} · ${kindLabel}` : labels.agent;
  const addressee = partyDisplayName(message.addresseePartyRole, profiles, labels.roles);
  if (addressee && (message.messageKind === "mediation_question" || message.messageKind === "mediation_moderation" || message.messageKind === "mediation_nudge")) {
    return `${base} · ${admin.mediatorMessageToParty} ${addressee}`;
  }
  return base;
}

export function MediatorSessionRoom({ roomId, initialState }: MediatorSessionRoomProps) {
  const { admin, portal: t, locale } = useLocale();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [selectedParty, setSelectedParty] = useState<PartyRole>("party_a");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [customText, setCustomText] = useState("");
  const [compromiseEdit, setCompromiseEdit] = useState<MediationOption | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorSessionState(roomId);
      if (next) setState(next);
    } catch {
      /* ignore */
    }
  }, [roomId]);

  useRoomRealtime(roomId, () => {
    void refresh();
  }, {
    watchUsers: false,
  });

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

  const canGenerateQuestions =
    (state.room.phase === "opening" || state.room.phase === "dialogue") &&
    (state.options?.length ?? 0) === 0;

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
    startTransition(async () => {
      try {
        await generateMediatorQuestionCandidatesAction(roomId);
        await refresh();
        toast.success(admin.mediatorGenerateQuestions);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
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
        });
        if (next) setState(next);
        setSelectedCandidateId(null);
        setEditText("");
        toast.success(admin.mediatorSendQuestion);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onSendCustomQuestion = () => {
    if (!customText.trim()) return;
    startTransition(async () => {
      try {
        const next = await sendCustomMediatorQuestionAction({
          roomId,
          partyRole: selectedParty,
          text: customText,
        });
        if (next) setState(next);
        setCustomText("");
        toast.success(admin.mediatorSendQuestion);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onGenerateOptions = () => {
    startTransition(async () => {
      try {
        const next = await generateMediatorOptionsAction(roomId);
        if (next) setState(next);
        toast.success(admin.mediatorGenerateOptions);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
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
        });
        if (next) setState(next);
        toast.success(admin.mediatorPublishCompromise);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
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
        <SessionElapsedTimer startedAt={state.room.mediationStartedAt} />
      </div>

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
                  )}
                </p>
                <p className="whitespace-pre-wrap">
                  {message.messageKind === "mediation_system"
                    ? resolveLocalizedSystemMessage(message.content, locale)
                    : message.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="glass-panel space-y-4 rounded-xl p-4">
          <div className="flex gap-2">
            {(["party_a", "party_b"] as const).map((role) => (
              <button
                className={`rounded-md px-3 py-1.5 text-body-sm ${
                  selectedParty === role ? "bg-law text-white" : "bg-surface-container-high text-on-surface"
                }`}
                key={role}
                onClick={() => {
                  setSelectedParty(role);
                  setSelectedCandidateId(null);
                  setEditText("");
                }}
                type="button"
              >
                {t.roles[role]}
              </button>
            ))}
          </div>

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
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
                disabled={pending || !editText.trim()}
                onClick={onSendQuestion}
                type="button"
              >
                {admin.mediatorSendQuestion}
              </button>
            </div>
          ) : null}

          {canGenerateQuestions ? (
            <div className="space-y-2">
              <label className="text-body-sm text-on-surface-variant">{admin.mediatorOwnQuestion}</label>
              <textarea
                className="w-full rounded-md border border-hair bg-paper px-3 py-2 text-body-sm"
                onChange={(event) => setCustomText(event.target.value)}
                rows={4}
                value={customText}
              />
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

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md border border-law px-3 py-2 text-body-sm font-semibold text-law disabled:opacity-60"
            disabled={pending || state.room.phase === "completed" || state.room.phase === "agreement"}
            onClick={onGenerateOptions}
            type="button"
          >
            {admin.mediatorGenerateOptions}
          </button>

          {state.room.phase === "voting_discrepancy" && compromiseEdit && !state.compromisePublished ? (
            <div className="space-y-3 border-t border-hair pt-3">
              <p className="text-label-md uppercase text-on-surface-variant">
                {admin.mediatorCompromiseDraft}
              </p>

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
            </div>
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
