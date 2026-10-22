# Mediation Agreement (delta)

## MODIFIED Requirements

### Requirement: Draft agreement generation

When `mediation_phase` is `agreement`, the system SHALL generate a draft agreement from the live dialogue transcript and the selected option text (canonical + party adaptations), preferring mutually confirmed chat terms over option-template wording when they conflict. The draft SHALL include a third-person `body` and structured `obligations` with optional `deadline` values. Legacy `terms` MAY be derived from obligations.

#### Scenario: Draft produced on entry to agreement phase

- **WHEN** a matching vote or accepted compromise sets `selected_option_id`
- **THEN** the system generates draft agreement content with `status: "draft"`
- **AND** in Mode B, parties cannot view/accept until the mediator publishes

### Requirement: Dual-party acceptance

Both parties SHALL confirm a **published** draft via **"I accept"** (localized). Mode B SHALL reject accept while status is `draft`.

#### Scenario: Mutual acceptance

- **WHEN** both parties have clicked I accept on a published draft
- **THEN** draft status becomes `accepted`, `agreement_finalized_at` is set
- **AND** the session proceeds to completion and filing receipt

### Requirement: PDF download of results

Party downloads SHALL include Legislation, Solution (canonical/shared), and Agreement (obligations with deadlines) and SHALL omit psychodynamic profiles. Mediator/admin downloads MAY include psychodynamic profiles.

#### Scenario: Party download without psychodynamic

- **WHEN** a party downloads results
- **THEN** the PDF has no psychodynamic chapter
- **AND** Solution uses canonical option text or draft body, not party-adapted option strings alone

## ADDED Requirements

### Requirement: Protective clauses

The system SHALL provide a code-side protective clause catalog. Mediators SHALL include/exclude clauses via checkboxes; selected clauses merge into obligations with `source: "protective"`. Moratorium-style clauses SHALL be auto-suggested for boundary/vegetation disputes.

### Requirement: Obligation deadlines

Each obligation SHALL support a nullable free-text `deadline`. Mediator edit UI and party/PDF views SHALL render deadlines with each obligation.
