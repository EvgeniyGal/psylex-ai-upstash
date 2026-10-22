# Mediator-Facilitated Session (delta)

## ADDED Requirements

### Requirement: Mediator agreement editor

When Mode B phase is `agreement`, the mediator console SHALL show an editable draft (title, body, obligations, protective checkboxes) with Save draft and Publish to parties actions.

### Requirement: Vote discrepancy controls

In `voting_discrepancy`, the mediator SHALL have Propose/edit compromise (with loading while AI draft pending), Return to dialogue, and End without agreement.

### Requirement: Activity log mediation outcomes

Publishing options, casting votes, publishing compromise, publishing agreement, and ending without agreement SHALL emit pipeline/activity-log events with human-readable option/outcome text.
