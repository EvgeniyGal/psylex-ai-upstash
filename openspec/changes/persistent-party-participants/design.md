## Context

Party users were bound 1:1 via `users.room_id`. Reusing a person across disputes required new accounts and full retests.

## Decisions

- **Membership table** `room_participants` owns per-room dispute intake; tests/bot/psychodynamic/triggers stay on `users`.
- **`users.room_id`** becomes last-active room pointer, not exclusive ownership.
- **Many rooms OK**; overlapping scheduled or live sessions for the same party user are rejected at schedule and start.
- **Delete room** detaches membership (cascade) and clears last-active when it pointed at that room; accounts remain.
- **Hard profile refresh** clears tests, onboarding, bot prompt/ready, psychodynamic, triggers; sets `profile_refresh_requested_at` and shows a party banner until onboarding completes again.

## Risks

- Emotional-triggers / interests must read intake from membership (merged sides), not stale `users.dispute_*`.
- Same user cannot fill both party slots in one room.
