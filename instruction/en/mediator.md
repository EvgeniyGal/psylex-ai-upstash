# Instructions for the mediator

This guide is for the **Mediator** role. You run **Mode B**: you create a room for two parties, set the time, lead a live session with AI support, and accompany the parties toward an agreement.

> **Tip.** Until onboarding (tests) is complete, **Help** in the header opens these instructions. After you enter the console, the **Help** button is in the sidebar. The chat assistant replies in **EN | UA**. You also see the instruction for parties.

If you are Party A/B, see [parties.md](./parties.md). If you are a platform administrator — [admin.md](./admin.md).

---

## Contents

1. [What you can do](#1-what-you-can-do)
2. [Sign-in and first-time setup](#2-sign-in-and-first-time-setup)
3. [Mediator Console](#3-mediator-console)
4. [Negotiation rooms](#4-negotiation-rooms)
5. [Creating a room and party access](#5-creating-a-room-and-party-access)
6. [Room card](#6-room-card)
7. [Session schedule](#7-session-schedule)
8. [Calendar](#8-calendar)
9. [Pre-session lobby](#9-pre-session-lobby)
10. [Live session](#10-live-session)
11. [Ending the session and results](#11-ending-the-session-and-results)
12. [Language and logout](#12-language-and-logout)
13. [Role limits](#13-role-limits)
14. [Tips and typical situations](#14-tips-and-typical-situations)

---

## 1. What you can do

In the Mediator Console you:

- complete your own onboarding (welcome, consent, tests);
- create **negotiation rooms** for Party A and Party B (Mode B);
- copy party login and password to send them access;
- see whether the parties are ready (tests, dispute description, AI analysis);
- schedule the date, time, and duration of the session;
- manage the schedule in **Calendar** (view, reschedule, change duration);
- open the **lobby** and start the session together with the parties;
- in the live session, review party profiles, generate or write questions, send them to the parties, generate solution options, edit and publish a compromise;
- review the preparation log, mediation details, and download results;
- delete your own rooms.

> **You do not** manage the registry of other mediators, API keys, agent prompts, or the RAG legal corpus — that is the administrator. Mode A rooms (created by an admin) do not belong to you and are not shown in the console.

---

## 2. Sign-in and first-time setup

The **administrator** creates the account under **Mediators**. You receive a login `psylex_…` and a password (or a Magic Link from the admin).

1. Open the **Login** page.
2. Enter login and password.
3. After a successful sign-in, if onboarding is not finished, the system takes you through the same steps as the parties, but with mediator copy.

### Mediator onboarding

| Step | Screen | Action |
|------|--------|--------|
| Welcome | **Welcome, Mediator** | **Begin Mediator Setup** |
| Consent | **Disclaimer & Consent** | Read the terms, check the box, **Proceed to Next Step** |
| Tests | **Mediator Assessment** | Complete four modules, wait for **Personal AI Bot** → **Ready**, click **Next Step** |

The four tests are the same as for parties: **What is my personality type**, **Face to face with fear**, **Character traits**, **Personality conflicts**. After each one, return to PsyLex and click **Update test status**. Processing can take up to two hours.

After onboarding, **Mediator Console** → **Rooms** opens.

---

## 3. Mediator Console

On the left:

- the **Mediator Console** label;
- **Rooms** — a list of your rooms;
- **Calendar** — session schedule;
- the **EN | UA** switcher;
- **Logout**.

The home path `/mediator` immediately redirects to **Rooms**.

---

## 4. Negotiation rooms

Page: **Negotiation Rooms**. Only rooms that **you** created appear here.

Table columns:

- **Room title**, **Room description**, **Jurisdiction**;
- **Scheduled time**;
- **Status**: **Not ready** / **Ready** / **Complete**;
- **Session** — an action that depends on state.

Search: the **Search...** field. The **New Room** button creates a new case.

### Preparation statuses

| Status | Meaning |
|--------|---------|
| **Not ready** | The parties are still completing tests / the dispute description, or AI analysis is not finished |
| **Ready** | Both parties are ready, analysis is complete — you can run the session (after scheduling) |
| **Complete** | Mediation is finished |

In the **Session** column:

- **Open pre-session lobby** — if there is a schedule and preparation is ready, and the session has not started;
- **Open live session** — if the session is already in progress;
- after completion, actions lead to the room card, not the live console.

Click a row to open the room card.

---

## 5. Creating a room and party access

1. Click **New Room**.
2. Fill in **Room details**:
   - **Room title**, **Room description**;
   - **Jurisdiction**: **Ukraine** (*Ukrainian law and legal practice*) or **United States** (*United States law and legal practice*).
   - For the United States you must select **State / territory / Federal**. Jurisdiction determines which legal sources AI will retrieve. It cannot be changed after creation.
3. Fill in **Party A** and **Party B**: **Title / Name** and **Description**.
4. Click **Create Room** (or **Cancel**).

The system automatically creates two party accounts (login `psylex_…` and a password). You land on the room card.

### How to give parties access

On the room card, in the **Participants** block for each party:

- copy **Login** and **Password** with **Copy Credentials** and send them to the party through a secure channel;
- the **Magic Link** button may be on the screen, but creating a link is available **only to the administrator**. If you need a one-time 72-hour link — ask the admin to generate it from the room card in the Admin Console.

Ask the parties to complete welcome, consent, tests, and the dispute description using the [party instruction](./parties.md). Until they do, the room status stays **Not ready**.

---

## 6. Room card

Opens from the room list or from the calendar (**Open room**).

On the card:

| Block | What the mediator can do |
|-------|--------------------------|
| Header | Title, creation date, jurisdiction |
| **Mediation details** | After the session starts — dialogue, votes, agreement, **Download results** |
| **Mediation schedule** | Date, time, duration, readiness indicators, links to the lobby / live session |
| **Pipeline & mediation log** | Timeline: tests, dispute intake, AI agents, start and completion |
| **Room details** | Title and description **view only** (cannot be edited after creation) |
| **Participants** | Party details, login/password, **Copy Credentials** |
| **Delete Room** | Deletes the room and the party accounts. This cannot be undone |

Indicators in the schedule:

- **Party A ready** / **Party B ready** — **Ready** or **Not ready**;
- **AI analysis complete** — the post-intake pipeline (profiles, interests, legal analysis).

Tip: you can schedule a time before full readiness, but the parties can **start the session** only when tests, the dispute description, and analysis are complete.

---

## 7. Session schedule

In the **Mediation schedule** block:

1. Choose **Date**, **Hour**, and **Minutes** (5-minute steps).
2. Choose **Duration**: 30 minutes, 1 hour, then in 30-minute steps up to 4 hours.
3. The time must be in the future.
4. Click **Save schedule**. You will see confirmation **Schedule saved**.

The parties receive the notification **A mediation session has been scheduled.** If you change a time that is already saved, previous **Start Mediation** clicks are reset — all three participants must click again.

You can change the schedule until the session starts. After start, the fields are locked.

When there is a schedule and preparation is ready:

- **Open pre-session lobby**
- after start — **Open live session**
- after the finale — the **Mediation completed** mark

---

## 8. Calendar

Menu item **Calendar** → **Session calendar**.

- Views: **Today**, **Day**, **Week**, **Month** (in English, the week starts on Sunday).
- The calendar shows your scheduled sessions.
- On the right: **Upcoming sessions** and **Rooms without a schedule** (the **Schedule** button opens the room card).
- Click a session to view and change the schedule.
- Drag an event to reschedule; resize it to adjust duration; then save.
- If the session is already **Started**, the schedule cannot be changed.
- **Open room** leads to the card.

---

## 9. Pre-session lobby

**Open pre-session lobby** (from the room list or from the card).

### When you can start

- both parties have finished tests and the dispute description;
- AI analysis is complete;
- a schedule is saved;
- it is now **no earlier than 10 minutes** before the scheduled start.

### How to start

1. Enter the lobby ahead of time (ideally before the 10-minute window).
2. When the button is active, click **Start Mediation**.
3. Wait until Party A and Party B click as well. The statuses of all three participants are visible on the screen.
4. If everyone clicked before the clock: **Everyone is ready. Session starts at the scheduled time.**
5. At the scheduled moment the system opens the live session.

The session **does not** start before the scheduled time, even if everyone has already clicked start.

If someone opens the lobby after mediation is complete, they are redirected to the room card.

---

## 10. Live session

The mediator console has three columns.

### Left — **Party profiles**

Psychodynamic profiles of Party A and Party B. Use them to phrase questions neutrally and with risks in mind, but do not read sensitive wording to the parties “head-on” if that could escalate the conflict.

### Center — message feed

You see the canonical text (the full picture). Types: **Notice**, **Opening**, **Question**, **Summary**, **Moderation**, **Nudge**, **Options**.

The **Session time** timer shows how long the session has already been running (not the Mode A 60-minute countdown).

### Right — controls

The **Party A** / **Party B** switcher sets who receives the next question.

#### Questions from AI

1. Click **Generate question options** (available in the opening/dialogue phases, until solution options have been generated).
2. Choose one of the three candidates in the **Question candidates** block.
3. If needed, click **Edit question**.
4. Click **Send to party**.

The party receives the question and the notification **You have a new question from the mediator.**

#### Your own question

The **Your question** field is text from you, without AI. Send it with **Send to party**. The system rejects empty text. Sending your own question **does not** clear the generated AI candidates — you can use them later.

The parties reply in their room. You see the replies in the feed.

#### Solution options

When the dialogue has produced enough material (this is your professional judgment; the parties have no separate “ready” button):

1. Click **Generate solution options**.
2. The system moves to voting; the parties receive **Solution options are ready to review.**

The parties then vote on their own. If the votes match — the system prepares a draft agreement. If they differ — the **Second vote** phase.

#### Compromise

AI prepares a draft, but the parties **do not** see it until you publish it.

Fields:

- **Compromise draft**
- **Canonical description (mediator view)**
- **Text for Party A** / **Text for Party B**
- **Legal information (not advice)**
- **Fulfillment likelihood**
- **Risks if refused**

Check neutrality and accuracy, edit if needed, click **Publish compromise**. The parties vote **Accept compromise** / **Reject compromise**.

There is no separate “End session” button: the finale comes when the parties accept the agreement or reject the compromise (no mutual agreement).

---

## 11. Ending the session and results

When the phase becomes **Agreement** or **Completed**:

1. The console shows **Session finished. Returning to room details…**
2. After a few seconds the room card opens.
3. If you open the live session or lobby again — you go straight to the room card.

On the card, click **Mediation details**:

- dialogue of both parties;
- options and votes;
- compromise votes;
- the agreement or the no-agreement outcome;
- **Download results** (PDF).

The email-send field is not active yet — save the PDF yourself.

---

## 12. Language and logout

- **EN | UA** in the sidebar changes the language of the console, calendar, session labels, Help, and chat-assistant replies.
- **Logout** returns you to the login page.

---

## 13. Role limits

| Capability | Mediator | Administrator |
|------------|----------|----------------|
| Own Mode B rooms | Yes | Sees all, **Mediator rooms** tab |
| Mode A rooms | No | Yes |
| Mediator registry | No | Yes |
| Settings, prompts, RAG, API keys | No | Yes |
| Edit room title / parties after creation | No (view) | Yes |
| Copy party login and password | Yes | Yes |
| Generate Magic Link | No (admin required) | Yes |
| Calendar and live session | Yes | Schedule on a mediator room card — view only |
| Delete own room | Yes | Can delete any room |

---

## 14. Tips and typical situations

**The parties are not “Ready”.** Check the log: whether tests are passed, whether dispute intake was submitted, whether the pipeline finished. Send the parties a link to [their instruction](./parties.md).

**Can I schedule “ahead of time”?** Yes. But the lobby will not let you start until preparation is complete and the 10-minute window has opened.

**We rescheduled — the parties “disappeared” from start.** That is expected: start clicks were reset. Tell the parties the new time.

**I cannot see a room.** You only see your own. Admin rooms (Mode A) are not in the Mediator Console.

**Magic Link is not created.** Contact the administrator.

**The parties are waiting for a compromise.** Do not forget **Publish compromise** after you review the draft — otherwise they will see the waiting-for-publication state.

**Neutrality.** You facilitate communication; you do not represent either party. PsyLex does not replace your professional judgment, legal advice, or therapy. Legal blocks in the options are information from sources, not advice.
