## 1. Schema and membership

- [x] 1.1 Add `room_participants` + `profile_refresh_requested_at`; migrate from `users.room_id`
- [x] 1.2 `deleteRoom` detaches only (keep party accounts)

## 2. Resolve and gates

- [x] 2.1 Helpers: getRoomSides, getParticipantRoom, list memberships, overlap asserts
- [x] 2.2 Intake/pipeline/lobby/handshake on membership
- [x] 2.3 Schedule and start reject overlapping sessions

## 3. Create / profile / rooms UI

- [x] 3.1 Create room: create new | add existing
- [x] 3.2 Participant card profile status + hard refresh; Mode B scheduling labels
- [x] 3.3 Party `/rooms` list; post-login when ≥2 memberships

## 4. Docs

- [x] 4.1 EN/UK i18n, mediator instructions, OpenSpec delta
