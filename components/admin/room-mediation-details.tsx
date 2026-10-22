"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { downloadRoomMediationResults } from "@/app/admin/rooms/actions";
import { MediationResultsPanel } from "@/components/portal/room/mediation-results-panel";
import { useLocale } from "@/components/locale-provider";
import { formatDateTime } from "@/lib/format-datetime";
import type { AdminMediationDetails } from "@/lib/mediation/admin-room-details";
import type { Locale } from "@/lib/i18n";

function MessageColumn({
  title,
  accentClass,
  messages,
  emptyLabel,
  locale,
}: {
  title: string;
  accentClass: string;
  messages: AdminMediationDetails["partyAMessages"];
  emptyLabel: string;
  locale: Locale;
}) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-xl border border-hair bg-paper">
      <div className={`border-b border-hair px-4 py-3 ${accentClass}`}>
        <h5 className="font-display text-headline-sm text-on-surface">{title}</h5>
      </div>
      <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">{emptyLabel}</p>
        ) : (
          messages.map((message) => (
            <article
              className={
                message.senderType === "participant"
                  ? "rounded-lg bg-surface-container p-3"
                  : message.senderType === "agent"
                    ? "rounded-lg border border-law/20 bg-law-fill/30 p-3"
                    : "rounded-lg border border-hair bg-[#F7F5F0] p-3"
              }
              key={message.id}
            >
              <p className="mb-1 text-label-sm uppercase text-on-surface-variant">
                {message.senderLabel}
                {message.messageKind ? ` · ${message.messageKind}` : ""}
              </p>
              <p className="whitespace-pre-wrap text-body-sm text-on-surface">{message.content}</p>
              <p className="mt-2 text-body-sm text-on-surface-variant/80">
                {formatDateTime(message.createdAt, locale)}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function optionLabel(template: string, index: number) {
  return template.replace("{n}", String(index + 1));
}

export function RoomMediationDetails({
  roomId,
  details,
  showHeader = true,
}: {
  roomId: string;
  details: AdminMediationDetails;
  showHeader?: boolean;
}) {
  const { admin, locale, portal: t } = useLocale();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const onDownload = () => {
    startTransition(async () => {
      try {
        const file = await downloadRoomMediationResults(roomId, locale);
        const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.filename;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : admin.mediationDetailsActionFailed);
      }
    });
  };

  const onEmailPlaceholder = () => {
    toast.message(t.mediationEmailComingSoon);
  };

  const voteLabel = (optionId: string | null, options: AdminMediationDetails["options"]) => {
    if (!optionId) return admin.mediationDetailsNoVote;
    const index = options.findIndex((option) => option.id === optionId);
    if (index < 0) return optionId;
    return optionLabel(t.mediationOptionLabel, index);
  };

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div className="space-y-1">
          <h4 className="font-display text-headline-md text-on-surface">{admin.mediationDetailsTitle}</h4>
          {details.phase ? (
            <p className="text-body-sm text-on-surface-variant">
              {admin.mediationPhaseLabel}:{" "}
              <span className="text-on-surface">
                {t.mediationPhases[details.phase as keyof typeof t.mediationPhases] ?? details.phase}
              </span>
            </p>
          ) : null}
        </div>
      ) : details.phase ? (
        <p className="text-body-sm text-on-surface-variant">
          {admin.mediationPhaseLabel}:{" "}
          <span className="text-on-surface">
            {t.mediationPhases[details.phase as keyof typeof t.mediationPhases] ?? details.phase}
          </span>
        </p>
      ) : null}

      <div className="space-y-3">
        <h5 className="font-display text-headline-sm text-on-surface">
          {admin.mediationDetailsMessagesTitle}
        </h5>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MessageColumn
            accentClass="bg-party-a-fill/30"
            emptyLabel={admin.mediationDetailsNoMessages}
            locale={locale}
            messages={details.partyAMessages}
            title={details.partyATitle}
          />
          <MessageColumn
            accentClass="bg-party-b-fill/30"
            emptyLabel={admin.mediationDetailsNoMessages}
            locale={locale}
            messages={details.partyBMessages}
            title={details.partyBTitle}
          />
        </div>
      </div>

      {details.options.length > 0 ? (
        <div className="space-y-4">
          <h5 className="font-display text-headline-sm text-on-surface">
            {admin.mediationDetailsOptionsTitle}
          </h5>
          <div className="grid gap-3 md:grid-cols-2">
            <p className="text-body-sm text-on-surface-variant">
              {admin.roles.party_a}: {voteLabel(details.partyAVoteOptionId, details.options)}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              {admin.roles.party_b}: {voteLabel(details.partyBVoteOptionId, details.options)}
            </p>
          </div>
          {details.options.map((option, index) => {
            const isSelected = details.selectedOptionId === option.id;
            const partyAVoted = details.partyAVoteOptionId === option.id;
            const partyBVoted = details.partyBVoteOptionId === option.id;

            return (
              <article
                className={
                  isSelected
                    ? "space-y-3 rounded-xl border border-law bg-law-fill/20 p-4"
                    : "space-y-3 rounded-xl border border-hair bg-paper p-4"
                }
                key={option.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h6 className="font-display text-headline-sm text-on-surface">
                    {optionLabel(t.mediationOptionLabel, index)}
                  </h6>
                  {isSelected ? (
                    <span className="rounded-full border border-law bg-law-fill/40 px-2.5 py-0.5 text-label-sm uppercase text-on-surface">
                      {t.mediationAgreedResolution}
                    </span>
                  ) : null}
                  {partyAVoted ? (
                    <span className="rounded-full border border-party-a/30 bg-party-a-fill/30 px-2.5 py-0.5 text-label-sm uppercase text-on-surface-variant">
                      {admin.roles.party_a}
                    </span>
                  ) : null}
                  {partyBVoted ? (
                    <span className="rounded-full border border-party-b/30 bg-party-b-fill/30 px-2.5 py-0.5 text-label-sm uppercase text-on-surface-variant">
                      {admin.roles.party_b}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-1 text-label-sm uppercase text-on-surface-variant">
                      {admin.roles.party_a}
                    </p>
                    <p className="whitespace-pre-wrap text-body-sm text-on-surface">
                      {option.partyADescription}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-label-sm uppercase text-on-surface-variant">
                      {admin.roles.party_b}
                    </p>
                    <p className="whitespace-pre-wrap text-body-sm text-on-surface">
                      {option.partyBDescription}
                    </p>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  <strong className="text-on-surface">{t.mediationLegalInfo}:</strong> {option.legalNorms}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}

      {details.compromise ? (
        <div className="space-y-3 rounded-xl border border-hair bg-surface-container p-4">
          <h5 className="font-display text-headline-sm text-on-surface">{t.mediationCompromiseTitle}</h5>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-label-sm uppercase text-on-surface-variant">{admin.roles.party_a}</p>
              <p className="whitespace-pre-wrap text-body-sm text-on-surface">
                {details.compromise.partyADescription}
              </p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {admin.mediationDetailsCompromiseVote}:{" "}
                {details.partyACompromiseVote === null
                  ? admin.mediationDetailsNoVote
                  : details.partyACompromiseVote
                    ? admin.mediationDetailsAccepted
                    : admin.mediationDetailsRejected}
              </p>
            </div>
            <div>
              <p className="mb-1 text-label-sm uppercase text-on-surface-variant">{admin.roles.party_b}</p>
              <p className="whitespace-pre-wrap text-body-sm text-on-surface">
                {details.compromise.partyBDescription}
              </p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {admin.mediationDetailsCompromiseVote}:{" "}
                {details.partyBCompromiseVote === null
                  ? admin.mediationDetailsNoVote
                  : details.partyBCompromiseVote
                    ? admin.mediationDetailsAccepted
                    : admin.mediationDetailsRejected}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {details.resultsSummary ? (
        <div className="space-y-3">
          <h5 className="font-display text-headline-sm text-on-surface">
            {admin.mediationDetailsAgreementTitle}
          </h5>
          <MediationResultsPanel includePsychodynamic summary={details.resultsSummary} />
        </div>
      ) : (
        <p className="text-body-sm text-on-surface-variant">{admin.mediationDetailsAgreementPending}</p>
      )}

      <div className="space-y-3 border-t border-hair pt-4">
        <button
          className="btn-secondary px-4 py-2 text-body-sm disabled:opacity-60"
          disabled={pending || !details.resultsSummary}
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
          <button className="btn-secondary px-4 py-2 text-body-sm" onClick={onEmailPlaceholder} type="button">
            {t.mediationEmailSend}
          </button>
        </div>
      </div>
    </div>
  );
}
