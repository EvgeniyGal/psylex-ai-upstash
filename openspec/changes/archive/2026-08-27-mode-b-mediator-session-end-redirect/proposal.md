## Why

After a Mode B session reaches an outcome (both parties agreed, or the compromise was rejected), the mediator live console stays open even if scheduled time remains. The mediator has no remaining actions and should return to room details.

## What Changes

- When phase is `agreement` or `completed`, briefly show that the session finished, then send the mediator to `/mediator/rooms/{roomId}`
- Direct visits to `/session` or `/lobby` after the outcome redirect to room details
- Calendar “Open session” goes to details when the session has already ended
- Scheduled duration is ignored for this redirect

## Capabilities

### New Capabilities

- `mode-b-mediator-session-end-redirect`: Mediator leaves the live console when Mode B reaches agreement or completed

### Modified Capabilities

- (none)

## Impact

- `app/mediator/rooms/[roomId]/session/page.tsx` — server redirect
- `app/mediator/rooms/[roomId]/lobby/page.tsx` — server redirect when already ended
- `components/mediator/mediator-session-room.tsx` — brief finished banner then client redirect
- `components/mediator/mediator-calendar-content.tsx` — end-state link
- `lib/admin-i18n.ts` — EN/UK copy
- Party rooms, Mode A, and scheduled-duration auto-end are unchanged
