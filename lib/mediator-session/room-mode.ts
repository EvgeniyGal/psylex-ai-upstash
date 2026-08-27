export function isMediatorFacilitatedRoom(room: { createdByUserId: string | null | undefined }) {
  return !!room.createdByUserId;
}

export function isMediatorSessionEnded(phase: string | null | undefined) {
  return phase === "agreement" || phase === "completed";
}
