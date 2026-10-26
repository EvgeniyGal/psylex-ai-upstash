import type { Locale } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { getRoomPartiesForPipeline } from "@/lib/pipeline/gate";

export type PartyAdaptationLocales = {
  partyA: Locale;
  partyB: Locale;
};

/** Resolve each Mode A party's preferredLocale for bilingual agent adaptations. */
export async function getPartyAdaptationLocales(
  roomId: string,
): Promise<PartyAdaptationLocales> {
  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  return {
    partyA: normalizeLocale(partyA?.preferredLocale),
    partyB: normalizeLocale(partyB?.preferredLocale),
  };
}

export function partyAdaptationLocalesFromSides(sides: {
  partyA?: { preferredLocale?: string | null } | null;
  partyB?: { preferredLocale?: string | null } | null;
}): PartyAdaptationLocales {
  return {
    partyA: normalizeLocale(sides.partyA?.preferredLocale),
    partyB: normalizeLocale(sides.partyB?.preferredLocale),
  };
}
