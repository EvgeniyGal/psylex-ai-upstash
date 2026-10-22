## Why

Parties and mediators often use different UI languages (EN/UK). Chat stayed in the author's language, and mediation options/agreements/PDFs defaulted to English even when the portal was Ukrainian.

## What Changes

- Auto-translate free-text session messages to each viewer's `preferredLocale`, with a Translated badge and Show original
- Help me phrase this rewrite for composers (parties + mediator) without auto-send
- Mediation agent `targetLocale` + dual-pass `byLocale` for options, compromise, and agreement drafts; PDF/body resolve by participant UI locale
- Updates message-localization: participant chat may be translated for display while originals are preserved

## Impact

- Specs: message-localization
- Code: room_messages translations, mediation chat UI, formulate helper, mediation run-agent/orchestrators, PDF/results
