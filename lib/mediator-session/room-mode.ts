export function isMediatorFacilitatedRoom(room: { createdByUserId: string | null | undefined }) {
  return !!room.createdByUserId;
}

/** True only when the mediator has completed the session (not merely agreement phase). */
export function isMediatorSessionEnded(phase: string | null | undefined) {
  return phase === "completed";
}

/** Session is still live for messaging / console (includes agreement wrapping-up). */
export function isMediatorSessionLive(phase: string | null | undefined) {
  return !!phase && phase !== "completed";
}
