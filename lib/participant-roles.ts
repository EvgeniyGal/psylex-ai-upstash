export const PARTY_ROLES = ["party_a", "party_b"] as const;

export type PartyRole = (typeof PARTY_ROLES)[number];

export const PARTICIPANT_ROLES = ["mediator", ...PARTY_ROLES] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export function isPartyRole(role: string): role is PartyRole {
  return PARTY_ROLES.includes(role as PartyRole);
}

export function isParticipantRole(role: string): role is ParticipantRole {
  return PARTICIPANT_ROLES.includes(role as ParticipantRole);
}

export function getOppositePartyRole(role: PartyRole): PartyRole {
  return role === "party_a" ? "party_b" : "party_a";
}

/** "Party A" or "Party A · Claimant" when a distinct party title is set. */
export function partyDisplayLabel(
  role: PartyRole,
  roleLabels: Record<PartyRole, string>,
  title?: string | null,
) {
  const roleLabel = roleLabels[role] ?? role;
  const trimmed = title?.trim();
  if (trimmed && trimmed !== roleLabel) {
    return `${roleLabel} · ${trimmed}`;
  }
  return roleLabel;
}
