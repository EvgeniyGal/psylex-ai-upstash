## Why

Mode B mediators can currently send a question only after generating AI candidates. Facilitators need to type and send their own question to Party A or Party B without using generation.

## What Changes

- Add a parallel send path so the mediator can write a question and send it to the selected party during a live Mode B session
- Reuse existing party delivery (question message + in-app notification + reply flow)
- Leave AI candidate generation, selection, edit, and send unchanged
- Custom send must not clear stored AI candidates

## Capabilities

### New Capabilities

- `mediator-authored-questions`: Mediator can send a self-authored question to Party A or Party B without generating AI candidates

### Modified Capabilities

- (none)

## Impact

- `lib/mediator-session/orchestrator.ts` — custom send + shared delivery helper
- `app/mediator/rooms/actions.ts` — new server action
- `components/mediator/mediator-session-room.tsx` — always-visible own-question box
- `lib/admin-i18n.ts` — EN/UK copy
- Mode A rooms, AI generation, and party reply/vote flows are unchanged
