## Why

Party accounts were bound 1:1 to a room via `users.room_id`, so a second dispute required new logins and ~40 minutes of retests. Participants must be durable entities reusable across rooms.

## What Changes

- `room_participants` membership with per-room dispute intake
- Create room: create new or add existing by login/title
- Profile ready status + request profile refresh (hard reset including bot prompt)
- Party `/rooms` list; post-login list when ≥2 rooms
- No overlapping scheduled/live sessions for the same party user
- deleteRoom detaches membership only (keeps user accounts)

## Impact

- Specs: mediation membership / Mode B scheduling
- Code: schema, room helpers, create/delete, intake, portal, scheduling overlap gate
