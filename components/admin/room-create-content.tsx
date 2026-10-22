"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createRoom, searchPartyUsersAction } from "@/app/admin/rooms/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  USA_SUB_JURISDICTIONS_SORTED,
  getUsaSubJurisdictionLabel,
  type UsaSubJurisdiction,
} from "@/lib/rag/usa-jurisdictions";
import {
  ROOM_JURISDICTIONS,
  jurisdictionLabels,
  type RoomJurisdiction,
} from "@/lib/room/jurisdiction";

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

type PartyMode = "create" | "existing";

type SearchHit = {
  id: string;
  login: string;
  title: string;
  onboardingCompletedAt: Date | string | null;
  personalBotReadyAt: Date | string | null;
};

function PartySlotFields({
  role,
  mode,
  onModeChange,
  selected,
  onSelect,
}: {
  role: "party_a" | "party_b";
  mode: PartyMode;
  onModeChange: (mode: PartyMode) => void;
  selected: SearchHit | null;
  onSelect: (hit: SearchHit | null) => void;
}) {
  const { admin } = useLocale();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, startSearch] = useTransition();
  const prefix = role === "party_a" ? "partyA" : "partyB";
  const titleLabel = role === "party_a" ? admin.partyATitleLabel : admin.partyBTitleLabel;
  const descriptionLabel =
    role === "party_a" ? admin.partyADescriptionLabel : admin.partyBDescriptionLabel;

  useEffect(() => {
    if (mode !== "existing") return;
    startSearch(async () => {
      const next = await searchPartyUsersAction(debouncedQuery);
      setHits(next);
    });
  }, [mode, debouncedQuery]);

  return (
    <fieldset className="glass-panel space-y-4 rounded-xl p-6">
      <legend
        className={`mb-1 font-display text-headline-md ${
          role === "party_a" ? "text-primary" : "text-tertiary"
        }`}
      >
        {admin.roles[role]}
      </legend>

      <input name={`${prefix}Mode`} type="hidden" value={mode} />
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-md px-3 py-1.5 text-body-sm font-semibold ${
            mode === "create" ? "bg-law text-white" : "border border-hair text-on-surface"
          }`}
          onClick={() => {
            onModeChange("create");
            onSelect(null);
            setQuery("");
            setHits([]);
          }}
          type="button"
        >
          {admin.createNewParticipant}
        </button>
        <button
          className={`rounded-md px-3 py-1.5 text-body-sm font-semibold ${
            mode === "existing" ? "bg-law text-white" : "border border-hair text-on-surface"
          }`}
          onClick={() => onModeChange("existing")}
          type="button"
        >
          {admin.addExistingParticipant}
        </button>
      </div>

      {mode === "create" ? (
        <>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{titleLabel}</label>
            <input className={inputClass} name={`${prefix}Title`} placeholder={titleLabel} required />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{descriptionLabel}</label>
            <textarea
              className={inputClass}
              name={`${prefix}Description`}
              placeholder={descriptionLabel}
              required
              rows={3}
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <input
            name={`${prefix}ExistingUserId`}
            required
            type="hidden"
            value={selected?.id ?? ""}
          />
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor={`${prefix}-search`}>
              {admin.searchParticipant}
            </label>
            <div className="relative">
              <input
                autoFocus
                className={inputClass}
                id={`${prefix}-search`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={admin.searchParticipantPlaceholder}
                value={query}
              />
              {searching ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" />
                </span>
              ) : null}
            </div>
          </div>
          {selected ? (
            <p className="rounded-md border border-law/40 bg-law-fill/30 p-3 text-body-sm text-on-surface">
              {selected.title} ({selected.login})
              {selected.onboardingCompletedAt ? ` · ${admin.profileReadyLabel}` : ` · ${admin.profileNotReadyLabel}`}
            </p>
          ) : (
            <p className="text-body-sm text-on-surface-variant">{admin.selectParticipantHint}</p>
          )}
          <ul className="max-h-56 space-y-1 overflow-auto rounded-md border border-hair bg-paper p-1 text-body-sm">
            {hits.length === 0 && !searching ? (
              <li className="px-3 py-4 text-center text-on-surface-variant">{admin.noParticipantsFound}</li>
            ) : (
              hits.map((hit) => {
                const isSelected = selected?.id === hit.id;
                return (
                  <li key={hit.id}>
                    <button
                      aria-pressed={isSelected}
                      className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-law text-white"
                          : "hover:bg-surface-container-high"
                      }`}
                      onClick={() => onSelect(hit)}
                      type="button"
                    >
                      <span className="font-semibold">{hit.title || hit.login}</span>
                      <span className={isSelected ? "opacity-90" : "text-on-surface-variant"}>
                        {" "}
                        · {hit.login}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </fieldset>
  );
}

export function RoomCreateContent({ basePath = "/admin/rooms" }: { basePath?: string }) {
  const { admin, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [jurisdiction, setJurisdiction] = useState<RoomJurisdiction | "">("");
  const [usaSubJurisdiction, setUsaSubJurisdiction] = useState<"" | UsaSubJurisdiction>("");
  const [partyAMode, setPartyAMode] = useState<PartyMode>("create");
  const [partyBMode, setPartyBMode] = useState<PartyMode>("create");
  const [partyASelected, setPartyASelected] = useState<SearchHit | null>(null);
  const [partyBSelected, setPartyBSelected] = useState<SearchHit | null>(null);
  const labels = jurisdictionLabels(locale);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createRoom(formData);
    });
  };

  return (
    <section className="space-y-stack-lg">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary transition-colors hover:text-on-surface"
        href={basePath}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToRooms}
      </Link>

      <div>
        <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.newRoom}</h3>
        <p className="max-w-xl text-on-surface-variant">{admin.createRoomSubtitle}</p>
      </div>

      <form action={onSubmit} className="space-y-stack-md">
        <fieldset className="glass-panel space-y-4 rounded-xl p-6">
          <legend className="mb-1 font-display text-headline-md text-on-surface">{admin.roomDetails}</legend>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomTitleLabel}</label>
            <input className={inputClass} name="title" placeholder={admin.roomTitleLabel} required />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomDescriptionLabel}</label>
            <textarea
              className={inputClass}
              name="description"
              placeholder={admin.roomDescriptionLabel}
              required
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</label>
            <p className="mb-3 text-body-sm text-on-surface-variant">{admin.jurisdictionFieldHelp}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROOM_JURISDICTIONS.map((value) => (
                <label
                  className="flex cursor-pointer flex-col items-start gap-1 rounded border border-hair bg-paper p-4 transition-colors has-[:checked]:border-law has-[:checked]:bg-law-fill"
                  key={value}
                >
                  <span className="flex w-full items-center gap-2">
                    <input
                      checked={jurisdiction === value}
                      className="h-4 w-4 accent-tertiary"
                      name="jurisdiction"
                      onChange={() => {
                        setJurisdiction(value);
                        if (value !== "usa") setUsaSubJurisdiction("");
                      }}
                      required
                      type="radio"
                      value={value}
                    />
                    <span className="font-display text-headline-sm text-on-surface">{labels[value]}</span>
                  </span>
                  <span className="pl-6 text-body-sm text-on-surface-variant">
                    {value === "ukraine" ? admin.jurisdictionUkraineDesc : admin.jurisdictionUsaDesc}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {jurisdiction === "usa" ? (
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomUsaSubJurisdiction}</label>
              <p className="mb-2 text-body-sm text-on-surface-variant">{admin.roomUsaSubJurisdictionHelp}</p>
              <select
                className={inputClass}
                name="usaSubJurisdiction"
                onChange={(event) => setUsaSubJurisdiction(event.target.value as UsaSubJurisdiction)}
                required
                value={usaSubJurisdiction}
              >
                <option disabled value="">
                  —
                </option>
                {USA_SUB_JURISDICTIONS_SORTED.map((code) => (
                  <option key={code} value={code}>
                    {getUsaSubJurisdictionLabel(code, locale)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </fieldset>

        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          <PartySlotFields
            mode={partyAMode}
            onModeChange={setPartyAMode}
            onSelect={setPartyASelected}
            role="party_a"
            selected={partyASelected}
          />
          <PartySlotFields
            mode={partyBMode}
            onModeChange={setPartyBMode}
            onSelect={setPartyBSelected}
            role="party_b"
            selected={partyBSelected}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-6">
          <Link
            className="rounded-lg border border-outline-variant/30 px-5 py-2 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            href={basePath}
          >
            {admin.cancel}
          </Link>
          <button
            className="btn-primary flex items-center gap-2 px-8 py-2.5 text-body-sm disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? <Spinner size="sm" className="text-white" /> : <span className="material-symbols-outlined text-[18px]">add</span>}
            {admin.createRoom}
          </button>
        </div>
      </form>
    </section>
  );
}
