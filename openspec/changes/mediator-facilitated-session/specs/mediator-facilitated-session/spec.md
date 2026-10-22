# Mediator-Facilitated Session

## Purpose

Mode B mediation sessions created by mediators: scheduling, three-party handshake, mediator-controlled dialogue and options, party notifications.

## Requirements

### Requirement: Mode A isolation

Rooms with `created_by_user_id` null SHALL continue using the existing Mode A mediation lobby, handshake, timers, and orchestrator unchanged.

#### Scenario: Admin room unchanged

- **WHEN** a party in an admin-created room starts mediation
- **THEN** Mode A dialogue rounds, 60-minute countdown, and auto options transitions apply

### Requirement: Scheduling gate

A mediator SHALL schedule a session only after both parties completed tests, dispute intake, and post-intake AI analysis.

#### Scenario: Schedule blocked until ready

- **WHEN** either party has not completed prerequisites
- **THEN** schedule save is rejected

### Requirement: Ten-minute start window

Start Mediation SHALL become available 10 minutes before `scheduled_start_at` for mediator and both parties.

#### Scenario: Too early

- **WHEN** now is more than 10 minutes before scheduled start
- **THEN** Start Mediation is disabled and a countdown to the start window is shown

### Requirement: Three-party handshake

Session SHALL start when Party A, Party B, and the mediator have clicked Start and either `now >= scheduled_start_at` or the mediating mediator force-starts via Start now.

#### Scenario: Early clicks wait for clock

- **WHEN** all three have clicked before scheduled time
- **THEN** UI shows countdown and the session auto-starts at scheduled time unless the mediator uses Start now

#### Scenario: Mediator Start now

- **WHEN** all three have clicked Start Mediation before scheduled time
- **THEN** the mediator can click Start now to start the session immediately

#### Scenario: Start now gated on handshake

- **WHEN** any of Party A, Party B, or the mediator has not clicked Start Mediation
- **THEN** Start now is unavailable and the mediator is told all three must click first

### Requirement: Mediator question candidates

The system SHALL generate three tailored question candidates per party for mediator selection, optional edit, and send.

#### Scenario: Send edited question

- **WHEN** mediator selects a candidate, edits text, and sends
- **THEN** the addressee party receives the question and can reply

### Requirement: Mediator-triggered options

The mediator SHALL be able to generate solution options during an active session without requiring party ready-for-options or round caps.

#### Scenario: Generate options

- **WHEN** mediator clicks Generate solution options
- **THEN** options are published and parties enter voting

### Requirement: Mediator-approved compromise

When votes differ, compromise SHALL be drafted for mediator edit and published before parties can compromise-vote.

#### Scenario: Parties wait for publish

- **WHEN** phase is voting_discrepancy and compromise is not published
- **THEN** parties see a waiting state and cannot vote on compromise

### Requirement: Elapsed session timer

Mode B rooms SHALL show elapsed time since session start, not a remaining countdown.

### Requirement: Party action notifications

Mode B SHALL notify parties in-app (toast and/or banner) for schedule, start window, peer ready, session start, questions, options, compromise, and completion.

#### Scenario: Question notification

- **WHEN** mediator sends a question to Party A
- **THEN** Party A receives an in-app notification that action is required
