export type HandshakeClickFlags = {
  partyAClicked: boolean;
  partyBClicked: boolean;
  mediatorClicked: boolean;
};

export type WaitingForCopy = {
  modeBWaitingPartyA: string;
  modeBWaitingPartyB: string;
  modeBWaitingMediator: string;
};

/** Ordered waiting messages for roles that have not clicked Start Mediation yet. */
export function waitingForStartMessages(
  flags: HandshakeClickFlags,
  copy: WaitingForCopy,
): string[] {
  const messages: string[] = [];
  if (!flags.partyAClicked) messages.push(copy.modeBWaitingPartyA);
  if (!flags.partyBClicked) messages.push(copy.modeBWaitingPartyB);
  if (!flags.mediatorClicked) messages.push(copy.modeBWaitingMediator);
  return messages;
}
