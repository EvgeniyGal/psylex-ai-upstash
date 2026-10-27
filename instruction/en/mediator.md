# Instructions for the mediator

This guide is for the **Mediator** role. You run **Mode B**: you create a room for two parties, set the time, lead a live session with AI support, and accompany the parties toward an agreement.

> **Tip.** Until onboarding is complete, **Help** in the header opens these instructions. In the console, **Help** is in the sidebar. The chat assistant replies in **EN | UA**. You also see the party instruction. Ask about waits, **Sides**, schedule, or Mode A/B.

If you are Party A/B — [parties.md](./parties.md). If you are a platform administrator — [admin.md](./admin.md).

---

## Contents

1. [What you can and cannot do](#1-what-you-can-and-cannot-do)
2. [Sign-in and onboarding](#2-sign-in-and-onboarding)
3. [Mediator Console](#3-mediator-console)
4. [Negotiation rooms](#4-negotiation-rooms)
5. [Creating a room and access](#5-creating-a-room-and-access)
6. [Sides](#6-sides)
7. [Room card](#7-room-card)
8. [Session schedule](#8-session-schedule)
9. [Calendar](#9-calendar)
10. [Pre-session lobby](#10-pre-session-lobby)
11. [Live session](#11-live-session)
12. [Ending and results](#12-ending-and-results)
13. [Language and logout](#13-language-and-logout)
14. [Role limits](#14-role-limits)
15. [Tips and typical situations](#15-tips-and-typical-situations)

---

## 1. What you can and cannot do

In the Mediator Console you:

- complete your own onboarding (welcome, consent, tests);
- create **negotiation rooms** (Mode B);
- manage parties under **Sides** (from **your rooms only**);
- copy login/password and generate a **Magic Link** for parties in your rooms;
- schedule date, time, and duration; manage the schedule in **Calendar**;
- open the **lobby** and start the session (including **Start now** when everyone is ready);
- in the live session, work with profiles, questions, options, compromise, and agreement;
- finish with **Complete session**;
- review the log and results PDF; delete your own rooms.

> **You do not** manage the registry of other mediators, API keys, agent prompts, or the RAG corpus — that is the administrator. Mode A (admin) rooms are not shown in your console.

---

## 2. Sign-in and onboarding

The **administrator** creates the account under **Mediators**. You receive a login `psylex_…` and a password (or a Magic Link).

1. Open **Login**.
2. Enter login and password.
3. If onboarding is not finished — the same steps as parties, with mediator copy.

| Step | Screen | Action |
|------|--------|--------|
| Welcome | **Welcome, Mediator** | **Begin Mediator Setup** |
| Consent | **Disclaimer & Consent** | Check the box + **Proceed to Next Step** |
| Tests | **Mediator Assessment** | Four modules → **Personal AI Bot** → **Ready** → **Next Step** |

Test processing can take **up to two hours**. After onboarding, **Mediator Console** → **Rooms** opens.

---

## 3. Mediator Console

Left nav (order):

1. **Rooms** — your rooms;
2. **Sides** — parties from your rooms;
3. **Calendar** — session schedule;
4. **Help**, **EN | UA**, **Logout**.

Above Help in the sidebar during lobby / live session, the **attention dock** shows waits, party readiness, and the session timer.

Path `/mediator` redirects to **Rooms**.

---

## 4. Negotiation rooms

Page: **Negotiation Rooms**. Only rooms **you** created.

Columns: **Room title**, **Room description**, **Jurisdiction**, **Scheduled time**, **Status** (**Not ready** / **Ready** / **Complete**), **Session**.

Search: **Search...**. Button **New Room**.

In the **Session** column:

- **Open pre-session lobby** — schedule exists, prep ready, session not started;
- **Open live session** — session already in progress;
- after completion — room card only.

Click a row to open the room card.

---

## 5. Creating a room and access

Path: **Rooms** → **New Room** (or **Return to rooms**). Subtitle: set up the room and both sides; credentials are generated for **new** participants when you create the room.

### Room details

1. **Room title**, **Room description** (required).
2. **Jurisdiction** — **Ukraine** or **United States** (+ help blurbs). For the US: required **State / territory / Federal**.
3. Jurisdiction cannot be changed after creation.

### Party A and Party B

#### Create new participant

**Title / Name**, **Description** → new login `psylex_…` and password.

#### Add existing participant

Reuse a party who already appears in **your** practice:

1. Switch to **Add existing participant**.
2. **Search by login or name…** — as a **mediator**, the pool is **only parties already in your rooms**. Roomless accounts and parties from **other mediators’** rooms are **hidden**.
3. Selected card: `title (login)`, **Profile ready** / **Profile not ready**, badges **T1–T4** and **BP**.

**Reuse rules:** tests, personal bot, and onboarding are reused; dispute intake is still required **for this new room**. The same person cannot fill both slots.

### Finish and access

**Cancel** / **Create Room** → room card (Mode B).

On the room card under **Participants**:

- **Copy Credentials** (login and password);
- **Magic Link** — one-time, **72 hours** (auto sign-in / **Continue** without JS).

Ask parties to complete onboarding and dispute intake using the [party instruction](./parties.md).

---

## 6. Sides

Menu **Sides** — party registry scoped to **your** rooms. Subtitle: review test/bot readiness and request selective retests.

> No **Add** button here — parties appear via **New Room**. No **Copy Credentials** / **Magic Link** on Sides (use the room card). No Admin/Mediator tabs (unlike the admin console).

### Scope

- You see parties in **at least one of your rooms**.
- Parties with **no room** are **hidden**.
- Parties that exist only in other mediators’ rooms are **not** listed.

### Table

**Search...**, sortable columns, pagination (**Rows per page** 10 / 25 / 50).

| Column | Meaning |
|--------|---------|
| **Title** | Name + description; click or **Edit** |
| **Login** | `psylex_…` |
| **Role** | **A** / **B** |
| **Rooms** | Your rooms for this party (A/B badges) |
| **Tests** | **T1–T4** chips (+ dates when available) |
| **Bot prompt** | **BP** chip (+ date) |
| **Actions** | Edit, Delete, ⋮ |

### Edit

**Edit side** modal: **Title** and **Description** required → **Save Changes** → **Side updated.** / **Could not update side.**

### Delete party

Confirm dialog means:

- The party account is **removed**.
- **Every room** that party belongs to is **deleted** (including your rooms they are in).
- Other parties in those rooms are kept as free / roomless accounts.
- **Cannot be undone.**

**Ownership limit:** if the party also belongs to rooms you do **not** own, delete fails — ask an **administrator**. Success: **Party deleted.** Error: **Could not delete party.**

### Redo (⋮)

**Redo T1…T4**, **Redo all tests**, **Redo bot prompt**, **Redo all** — each with confirm: clears **local** progress; party must recomplete the external test for a **newer Airtable** record → **Retest requested.**

**Redo all** ≈ room-card **Request profile update**.

Administrators see **all** parties (including roomless) under their **Sides** menu — see [admin.md](./admin.md).

---

## 7. Room card

| Block | What the mediator can do |
|-------|--------------------------|
| Header | Title, date, jurisdiction |
| **Mediation details** | After start — dialogue, votes, agreement, **Download results** |
| **Mediation schedule** | Date, time, duration, readiness, lobby / session links |
| **Pipeline & mediation log** | Timeline of preparation and the session |
| **Room details** | Title and description **view only** |
| **Participants** | Profile / tests, **Request profile update**, login/password, **Copy Credentials**, **Magic Link** |
| **Delete room** | Two options (see below) |

### Request profile update

Confirm → clears tests, bot, and related AI profiles; welcome/consent kept so the party returns to tests. Pending: **Profile update requested — waiting for retests.** Same idea as Sides **Redo all**.

Readiness indicators: **Party A/B ready**, profile readiness, **AI analysis**. Incomplete pipeline steps may show **Generating…**.

### Delete room

| Button | What happens |
|--------|----------------|
| **Delete room only** | Removes this room. Party accounts are **kept** (may become roomless). |
| **Delete room and parties** | Deletes this room and those party accounts; **every other room** those parties are in is also deleted. Other people in related rooms stay as free accounts. Fails if a party also sits in rooms you do not own — ask admin. |

Both require confirmation and cannot be undone. Toast: **Room deleted.**

---

## 8. Session schedule

In **Mediation schedule**:

1. **Date**, **Hour**, **Minutes** (5-minute steps).
2. **Duration**: 30 minutes … 4 hours (30-minute steps).
3. Time must be in the future.
4. **Save schedule** → **Schedule saved**.

Parties are notified that a session was scheduled. Changing the time resets **Start Mediation** clicks — all three must click again.

Overlapping schedules for one participant are rejected — pick another time.

You can change the schedule until the session starts. After start, fields lock. Links: **Open pre-session lobby** / **Open live session** / completed mark.

---

## 9. Calendar

**Calendar** → **Session calendar**.

- Views: **Today**, **Day**, **Week**, **Month** (week starts Sunday in EN).
- Right: **Upcoming sessions** and **Rooms without a schedule** (**Schedule** → room card).
- Drag to move / resize duration, then save.
- If the session is **Started**, the schedule cannot be changed.
- **Open room**; lobby / live session links may also appear.

---

## 10. Pre-session lobby

**Open pre-session lobby**.

### When you can start

- both parties finished tests and dispute intake;
- AI analysis is complete;
- a schedule is saved;
- it is now **no earlier than 10 minutes** before the scheduled start.

### How to start

1. Enter the lobby ahead of time.
2. Click **Start Mediation** when the button is active.
3. Wait until Party A and Party B click as well. Statuses of all three are visible.
4. If everyone clicked before the clock: everyone is ready; the session starts at the scheduled time, **or you can click Start now**.
5. **Start now** is available only when all three have already clicked start and the clock has not yet arrived — it starts the session immediately.
6. At the scheduled moment the system opens the live session automatically.

After mediation completes, the lobby redirects to the room card.

---

## 11. Live session

Console: three columns + **attention dock** in the sidebar. Header: **Return to rooms**, **Complete session** (with confirmation).

Timer **Session time remaining** — countdown for the scheduled duration (also in the dock).

### Left — party profiles

Psychodynamic profiles of Party A and B. Use them for neutral questions; do not read sensitive wording “head-on” to the parties.

### Center — message feed

Canonical text. Types: notice, opening, question, summary, moderation, nudge, options. **Translated** badge + show original.

### Attention dock

Example states:

| Kind | Example |
|------|---------|
| Wait | Waiting for Party A / B to answer |
| Ready | Parties have replied — send the next question or generate options |
| Wait | Generating question suggestions / options / compromise / agreement… |
| Ready | Question suggestions / compromise draft / agreement draft ready |
| Wait | Waiting for parties to vote |
| Ready | Both rejected the compromise / both accepted — you can complete the session |
| Flash | Party voted / replied / accepted or rejected |

### Right — controls

#### Audience

- **Both** — shared channel;
- **Party A** / **Party B** — caucus.

AI question generate/send is available only when Party A or B is selected (not **Both**). Custom messages work for all audiences.

#### Questions from AI

1. **Generate question options**
2. Choose a candidate under **Question candidates**
3. Optionally **Edit question** / **Help me phrase this**
4. **Send to party**

#### Your own question

**Your question** → **Send to party**. Empty text is rejected. AI candidates are not cleared.

#### Solution options

**Generate solution options** when dialogue has enough material. Parties vote on their own.

#### Vote discrepancy

1. **Propose / edit compromise** → fields → **Publish compromise for vote**
2. **Return to dialogue** — clears votes and options (chat stays)
3. Use **Complete session** in the header if needed

#### Compromise

Parties **do not** see the draft until you publish. After publish both are notified; after one votes — wait for the other.

#### Agreement draft

When votes match (or both accept a compromise): parties see waiting-for-finalize until you publish.

1. Edit **title**, **shared narrative**, **obligations** (+ deadlines); **Add obligation** / **Remove**
2. **Save draft** → **Publish to parties**
3. Parties click **I accept**. After mutual accept, finish with **Complete session** if the session has not already closed.

---

## 12. Ending and results

After **Complete session** or agreement finale: **Session finished. Returning to room details…** → room card.

**Mediation details**: dialogue, options and votes, compromise, agreement or no-agreement outcome, **Download results**.

PDF: **Legislation** → **Solution** → **Agreement** / **Terms**. No psychodynamic chapter. Email is a stub.

---

## 13. Language and logout

- **EN | UA** changes console, calendar, session labels, Help, and chat.
- **Logout** → login page.

---

## 14. Role limits

| Capability | Mediator | Administrator |
|------------|----------|----------------|
| Own Mode B rooms | Yes | Sees all |
| Mode A rooms | No | Yes |
| **Sides** | Own rooms only (no roomless) | All, including roomless |
| Mediator registry | No | Yes |
| Settings, prompts, RAG, API | No | Yes |
| Edit room title after creation | No (view) | Yes |
| Copy login/password | Yes | Yes |
| **Magic Link** for own parties | Yes | Yes (anyone) |
| Calendar and live session | Yes | Schedule on card mostly view |
| Delete own room | Yes (two modes) | Any room |

---

## 15. Tips and typical situations

**Parties are not “Ready”.** Check the log and indicators (**Generating…**). Send the [party instruction](./parties.md).

**I do not see a party under Sides.** Only your rooms; roomless and other mediators’ parties are hidden.

**We rescheduled — parties “disappeared” from start.** Start clicks were reset — tell them the new time.

**Magic Link.** Generate from the room card for your parties; 72 hours, one-time.

**Parties are waiting for compromise / agreement.** Remember to **Publish…** after reviewing the draft.

**Both accepted the agreement.** Click **Complete session** if needed.

**Neutrality.** You facilitate communication; you do not represent either party. Legal blocks are information from sources, not advice.
