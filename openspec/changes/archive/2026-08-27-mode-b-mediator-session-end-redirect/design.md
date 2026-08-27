## Context

Mode B live console stays open after the outcome is known because nothing keys off `agreement` / `completed` for the mediator. Scheduled duration can still be running. Parties keep signing/results in their own room.

## Goals / Non-Goals

**Goals:**

- Redirect the mediator to room details when phase is `agreement` or `completed`, even if scheduled time remains
- Brief finished message on the live console before navigating
- Server-side guards so `/session` and `/lobby` do not reopen an ended console

**Non-Goals:**

- Changing party agreement signing or results
- Mode A
- Auto-ending when scheduled duration elapses

## Decisions

- **Trigger is phase, not the clock.** `agreement` (solution found; mediator has nothing left to publish) and `completed` (rejected/mixed or both signed).
- **Live path waits ~2.5s** so the mediator sees a finished banner; refresh/direct URL server-redirects immediately.
- **Calendar** needs phase (or an ended flag) on session rows so “Open session” can point at details.

## Risks / Trade-offs

- [Mediator leaves during agreement while parties still sign] → Intended; details page still shows room status. Parties are unchanged.
- [Race: redirect before realtime refresh] → Banner is driven by refreshed console state; server redirect covers reload.
