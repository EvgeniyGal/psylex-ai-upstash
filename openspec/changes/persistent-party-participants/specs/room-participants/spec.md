# Room Participants (delta)

## ADDED Requirements

### Requirement: Persistent party membership

The system SHALL model party presence in a room via `room_participants` (`room_id`, `user_id`, `party_role`, per-room dispute intake fields). A party user MAY belong to multiple rooms. Dispute intake for a room SHALL be stored on the membership row, not as the sole source of truth on `users`.

### Requirement: Last-active room pointer

`users.room_id` SHALL act as the participant's last-active room. Resolving the active room SHALL prefer that membership when still valid, otherwise the most recent membership.

### Requirement: No overlapping party sessions

When scheduling or starting a mediation session, the system SHALL reject the operation if any party in the room already has another non-completed room with an overlapping scheduled window or a live (started, not completed) session. Completed rooms SHALL NOT block.

### Requirement: Detach on room delete

Deleting a room SHALL remove memberships and clear last-active pointers that referenced that room. Party user accounts SHALL remain.

### Requirement: Create with existing party

Room creation SHALL allow each party slot to either create a new party account or attach an existing party user found by login or title. The same user SHALL NOT occupy both slots in one room.

### Requirement: Profile refresh

Administrators and mediators SHALL be able to request a hard profile refresh for a party user: clear test completions, onboarding completion, personal bot prompt and ready timestamp, psychodynamic profile, and emotional triggers; set a refresh-requested flag. The party UI SHALL show a banner until onboarding completes again. Profile readiness (max profile date and tests date) SHALL appear on the room participant card and in Mode B scheduling readiness.

### Requirement: Party room list

Party users with two or more memberships SHALL be directed to `/rooms` after login / onboarding completion to choose an active room.
