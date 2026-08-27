# Mediator-Authored Questions

## Purpose

Mode B mediators can type and send a question to Party A or Party B during a live session without generating AI question candidates.

## Requirements

### Requirement: Mediator-authored question send

During a live Mode B session, the mediator SHALL be able to type a question and send it to Party A or Party B without generating AI question candidates. AI candidate generation, selection, edit, and send SHALL remain available and unchanged. Sending a self-authored question MUST NOT clear stored AI candidates.

#### Scenario: Send own question to Party A

- **WHEN** the mediator has started a Mode B session in opening or dialogue phase, selects Party A, types a non-empty question, and sends it
- **THEN** Party A receives the question as a mediation question and can reply
- **AND** stored AI question candidates are unchanged

#### Scenario: Send own question to Party B

- **WHEN** the mediator has started a Mode B session in opening or dialogue phase, selects Party B, types a non-empty question, and sends it
- **THEN** Party B receives the question as a mediation question and can reply
- **AND** stored AI question candidates are unchanged

#### Scenario: Empty question rejected

- **WHEN** the mediator attempts to send a blank or whitespace-only question
- **THEN** the send is rejected and no question message is created

#### Scenario: AI generation still available

- **WHEN** the mediator uses Generate question options after or instead of sending a self-authored question
- **THEN** AI candidates are generated and can be selected, edited, and sent as before
