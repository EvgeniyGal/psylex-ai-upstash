# Message Localization (delta)

## MODIFIED Requirements

### Requirement: Participant-authored messages unchanged

Participant-submitted messages SHALL be stored in the author's original wording (`content` + `source_locale`). The system MAY store machine translations keyed by locale and SHALL display the viewer's `preferred_locale` version in the session chat when available. The viewer SHALL be able to see that a message was translated and view the original text. Own messages SHALL show the original without a translated badge.

#### Scenario: Mixed-locale chat display

- **WHEN** Party A (`uk`) sends a shared reply and Party B (`en`) views the room
- **THEN** Party B sees an English translation marked Translated
- **AND** Party B can reveal the Ukrainian original
- **AND** the stored original remains Ukrainian

## ADDED Requirements

### Requirement: Help formulate before send

The system SHALL offer a Help me phrase this action next to the session composer. It SHALL rewrite the draft more clearly and without insults, preserve meaning, add no new facts, return text in the user's `preferred_locale`, and SHALL NOT send the message until the user confirms.

### Requirement: Mediation documents follow viewer locale

Solution options, compromise text, agreement drafts, and party PDF bodies SHALL be generated and/or resolved in the viewing participant's `preferred_locale`. When parties differ, the system SHALL store localized copies (`byLocale`) and resolve at display/download time. Mediation agent invocations for participant-facing output SHALL include `targetLocale`.
