## ADDED Requirements

### Requirement: Mediator redirected when Mode B session ends

When a Mode B session reaches `agreement` or `completed`, the mediator SHALL be taken to the room details page even if scheduled session time remains. If the mediator is already on the live console, the system SHALL show a brief finished state before navigating. Direct visits to the live session or lobby after the outcome SHALL go to room details.

#### Scenario: Live console after outcome

- **WHEN** the mediator is on the live session console and the phase becomes `agreement` or `completed`
- **THEN** a finished message is shown
- **AND** the mediator is navigated to room details after a short delay

#### Scenario: Direct visit after outcome

- **WHEN** the mediator opens the live session URL after the phase is already `agreement` or `completed`
- **THEN** they are redirected to room details without staying on the console

#### Scenario: Lobby after outcome

- **WHEN** the mediator opens the lobby after the session has already reached `agreement` or `completed`
- **THEN** they are redirected to room details rather than the live console
