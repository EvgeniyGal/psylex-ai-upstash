## Why

Mode B agreement generation was option-template-first, lacked structured obligations/deadlines/protective clauses, and exposed drafts to parties before mediator review. Party PDFs also included psychodynamic profiles that should stay mediator/admin-only.

## What Changes

- Dialogue-first options and agreement drafts (third-person body + structured obligations with deadlines)
- Protective clause catalog with mediator checkboxes (including moratorium auto-suggest)
- Mediator edit → publish gate; parties wait until published, then accept the same shared document
- Party PDF/results omit psychodynamic; Solution uses canonical/shared text
- Activity log: option texts, votes, compromise, agreement publish, end-without-agreement
- Discrepancy controls: propose compromise, return to dialogue, end without agreement

## Impact

- Specs: mediation-agreement, mediator-facilitated-session
- Code: draft schema helpers, Mode B orchestrator/actions/UI, results/PDF, activity log, i18n, mediator instructions
