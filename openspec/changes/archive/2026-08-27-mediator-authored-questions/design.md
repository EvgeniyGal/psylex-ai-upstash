## Context

Mode B mediator console currently requires AI-generated candidates before a question can be sent. `sendMediatorQuestion` looks up `candidateId` in `rooms.mediator_question_candidates`. Party delivery (agent `mediation_question` message, `question_received` notification, unanswered-question reply) already works independently of how the text was produced.

## Goals / Non-Goals

**Goals:**

- Parallel send path for mediator-authored text to Party A or Party B
- Same phase gates as AI send (`opening` or `dialogue`)
- Same party delivery and reply behavior as candidate send
- Custom send must not read or write stored AI candidates

**Non-Goals:**

- Changing AI generation, candidate schema, or prompts
- Mode A rooms
- Changing party reply, voting, or notification types

## Decisions

- **Separate function, shared delivery.** Extract insert-message + notify + clear turn deadline from `sendMediatorQuestion`. AI path keeps candidate lookup and candidate-list clearing. `sendCustomMediatorQuestion` uses the helper with mediator text as canonical content and both party adaptations (no rewrite).
- **Always-visible textarea.** Console shows a “Your question” box for the selected party whenever questions are allowed (opening/dialogue, no options yet). Generate / candidate list / candidate send stay as they are.
- **No schema change.** Reuse existing `mediation_question` messages and `question_received` notifications.

## Risks / Trade-offs

- [Mediator sends while a party still has an unanswered question] → Same as AI send today: parties answer independently; latest unanswered question remains the reply gate.
- [Empty send] → Reject trimmed-empty text; disable the button in UI.
