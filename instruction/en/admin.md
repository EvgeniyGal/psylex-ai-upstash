# Instructions for the administrator

This guide is for the **Admin** role. You operate the PsyLex platform: Mode A rooms, the **Sides** and mediator registries, integration keys, OpenAI chat models by workload, test URLs, AI agent prompts, the RAG legal corpus, and Help texts.

> **Tip.** **Help** at the bottom of the sidebar opens all instructions. The chat assistant replies in **EN | UA**. Texts are edited under **Settings → Help**. Ask about **Sides**, Mode A/B, or resetting Help to the bundled file.

Instructions for parties and mediators: [parties.md](./parties.md), [mediator.md](./mediator.md).

---

## Contents

1. [What you can and cannot do](#1-what-you-can-and-cannot-do)
2. [Signing in](#2-signing-in)
3. [Admin Console](#3-admin-console)
4. [Negotiation rooms](#4-negotiation-rooms)
5. [Creating a Mode A room](#5-creating-a-mode-a-room)
6. [Sides](#6-sides)
7. [Room card](#7-room-card)
8. [Credentials and Magic Link](#8-credentials-and-magic-link)
9. [Mediators](#9-mediators)
10. [Settings: API credentials and models](#10-settings-api-credentials-and-models)
11. [Settings: tests](#11-settings-tests)
12. [Settings: agent prompts](#12-settings-agent-prompts)
13. [Settings: RAG](#13-settings-rag)
14. [Settings: Help](#14-settings-help)
15. [Watching analysis and mediation](#15-watching-analysis-and-mediation)
16. [Language and logout](#16-language-and-logout)
17. [Tips and typical situations](#17-tips-and-typical-situations)

---

## 1. What you can and cannot do

- create **Mode A** rooms and attach new or **existing** parties;
- view **all** rooms (admin and mediator);
- manage **all** parties under **Sides** (including roomless): edit, delete, request retests;
- edit room title/description and parties; delete rooms (two modes);
- copy login/password and generate a **Magic Link** for parties and mediators;
- maintain the mediator registry;
- store **OpenAI** and **Airtable** keys and assign **chat models by workload**;
- set test URLs; edit prompts for five agents and run dry-run tests;
- manage RAG; edit Help Markdown for Help UI, chat, and PDF/DOCX;
- read the pipeline log and mediation details; download the results PDF.

You **do not** run a live Mode B session and **do not** have a calendar in the admin menu. Schedule and session console live in the Mediator Console. The top-bar notifications icon is decorative for now.

---

## 2. Signing in

1. Open **/login** (**Login**).
2. Enter the administrator login (`psylex_…`) and password.
3. **Sign in** → **Negotiation Rooms**. Party onboarding is not shown for an admin.

Users with a party or mediator role cannot enter the Admin Console.

---

## 3. Admin Console

Left: **Admin Console**. Menu (order):

| Item | Where it goes |
|------|----------------|
| **Rooms** | List of all rooms |
| **Sides** | All parties, including roomless |
| **Mediators** | Mediator registry |
| **Settings** | API, models, tests, prompts, RAG, Help |

Also: **Help**, **EN | UA**, **Logout**. Content heading: **Mediation Portal**.

---

## 4. Negotiation rooms

Tabs:

| Tab | What it is |
|-----|------------|
| **Admin rooms** | Mode A: rooms you created |
| **Mediator rooms** | Mode B: rooms created by mediators |

**New Room** only on the admin rooms tab.

Columns: title, description, jurisdiction, status (**Ready** / **Not ready** / **Complete**). On the mediators tab also: mediator name, **Scheduled time**.

Controls: **Search...**, sorting, pagination. Click a row → room card. No lobby / live session buttons on the admin list.

---

## 5. Creating a Mode A room

Path: **Rooms** → **New Room** (or **Return to rooms** to go back). Subtitle: set up the room and both sides; credentials are generated when you create the room (for **new** participants).

### Room details

1. **Room title**, **Room description** (required).
2. **Jurisdiction** — **Ukraine** (*Ukrainian law and legal practice*) or **United States** (*United States law and legal practice*). Help text explains that jurisdiction drives which laws apply.
3. If United States: required **State / territory / Federal** (state/territory law or nationwide federal law).
4. Jurisdiction is fixed permanently after creation.

### Party A and Party B

For each slot, choose a mode:

#### Create new participant

- Fields: **Title / Name**, **Description** (required).
- On create, the system generates a new login `psylex_…` and password.

#### Add existing participant

Use this to attach a returning party (reuse the same account in another room).

1. Switch to **Add existing participant**.
2. **Search by login or name…** — as an **admin**, the pool includes **all** party accounts: roomless parties, parties already in your rooms, and parties already in mediator rooms.
3. Select a row. The selected card shows `title (login)` plus:
   - **Profile ready** or **Profile not ready**;
   - prep badges **T1–T4** (tests) and **BP** (bot prompt), green when ready / red when not.
4. Empty search: **No participants found.**

**Reuse rules:**

- Tests, personal bot, and onboarding progress are **reused** (no new credentials for that person).
- Dispute intake is **per room membership** — the party must still submit the dispute description for **this** new room.
- The same person cannot fill both Party A and Party B in one room (server rejects it).

### Finish

**Cancel** or **Create Room**. On success you land on the room card. The room runs in **Mode A** (AI leads dialogue, **120-minute** session). Copy access and send the [party instruction](./parties.md).

**Mode A vs Mode B:** admin **New Room** is always Mode A. Mode B rooms are created by mediators.

---

## 6. Sides

Menu **Sides** — the full party registry for administrators. Subtitle: review test and bot readiness and request selective retests.

> There is **no Add** button on Sides. Parties appear when you create a room (new or existing participant). There are **no** **Copy Credentials** / **Magic Link** buttons here — those live on the **room card** or **mediator card**.

### Tabs and filters

| Control | Behavior |
|---------|----------|
| **Admin rooms** | Parties linked to admin (Mode A) rooms; roomless parties show as **No rooms** |
| **Mediator rooms** | Parties linked to mediator rooms; extra **Mediator** column |
| **Mediator** filter | On the Mediator rooms tab only: **All mediators** or one mediator |
| **Search...** | Title, description, login, role, rooms, mediator name |
| Sort | Click column headers |
| Pagination | **Rows per page** 10 / 25 / 50; **Previous** / **Next** |

### Columns

| Column | Meaning |
|--------|---------|
| **Title** | Name; description under the title (click title or **Edit** to change) |
| **Login** | `psylex_…` |
| **Role** | Badge **A** or **B** |
| **Rooms** | Each membership with A/B badge + room title, or italic **No rooms** |
| **Tests** | Chips **T1–T4** (green/red) with completion dates when available |
| **Bot prompt** | Chip **BP** with date when available |
| **Actions** | Edit, Delete, ⋮ redo menu |

### Edit side

1. **Edit** (or click the title) → modal **Edit side** (`login · role`).
2. **Title** and **Description** are required. **Save Changes** stays disabled until something changed and fields are non-empty.
3. Success: **Side updated.** Error: **Could not update side.**

### Delete party

**Delete party** opens a confirm dialog. Meaning:

- The **party account is removed**.
- **Every room** that party belongs to is **permanently deleted**.
- Other parties who were only in those rooms are **kept** as free / roomless accounts (not deleted).
- This **cannot be undone**.

Success: **Party deleted.** Error: **Could not delete party.**

As admin you can delete regardless of which mediator owns related rooms (mediators cannot — see [mediator.md](./mediator.md)).

### Redo tests / bot (⋮ menu)

| Action | Effect |
|--------|--------|
| **Redo T1** … **Redo T4** | Clears that local test result |
| **Redo all tests** | Clears all four local tests |
| **Redo bot prompt** | Clears the personal AI bot |
| **Redo all** | Clears tests, bot, and related profile data (same idea as **Request profile update** on the room card) |

Each action asks for confirmation: PsyLex clears **local** progress; the party must complete the external test again so Airtable has a **newer** completion record. Success: **Retest requested.** Error: **Could not request retest.**

### Mediator view of Sides

Mediators see the same actions under their own **Sides** menu, but only parties from **their rooms** (no roomless, no other mediators’ parties). Details: [mediator.md](./mediator.md).

---

## 7. Room card

Available for **any** room (admin or mediator).

| Block | Actions |
|-------|---------|
| Header | Title, date, **Jurisdiction** |
| **Mediation details** | If a session has started — dialogue, votes, agreement, PDF |
| **Party preparation** (Mode A) | Readiness checklist (tests, bot, dispute, AI steps; may show **Generating…**) |
| **Mediation schedule** (Mode B) | Date, duration, readiness; admin **can view and edit** schedule fields on the card (save/overlap rules still apply). Lobby / live-session links may appear. The **rooms list** still has no lobby buttons |
| **Pipeline & mediation log** | Timeline |
| **Room details** | Edit title/description → **Save Changes**; jurisdiction read-only |
| **Participants** | Edit name/description, login/password, **Copy Credentials**, **Magic Link**, **Request profile update** |
| **Delete room** | Two modes (below) |

### Request profile update

On a party in **Participants**:

1. Confirm — clears tests, personal bot, and related AI profile data; welcome/consent stay so the party returns to the test step.
2. Pending banner: **Profile update requested — waiting for retests.**
3. Error: **Could not request profile update.**

This overlaps with Sides ⋮ **Redo all**. Prefer the room card when you are already looking at one case; prefer Sides for selective T1–T4 / bot-only redo across many parties.

### Delete room

| Button | What happens |
|--------|----------------|
| **Delete room only** | Removes this room and memberships. Party accounts are **kept** (become free/roomless if they have no other rooms). |
| **Delete room and parties** | Deletes this room **and** those party accounts. **Every other room** those parties participate in is also deleted. Other people who were only in those related rooms stay as free accounts. |

Both require confirmation and cannot be undone. Toast: **Room deleted.** / **Could not delete the room.**

---

## 8. Credentials and Magic Link

On the room card or mediator card:

### Copy Credentials

**Copy Credentials** puts role, login, and password on the clipboard. Send through a protected channel. Login always starts with `psylex_`.

### Magic Link

**Magic Link** creates a one-time `/auth/magic?token=…` link:

- valid for **72 hours**;
- the recipient signs in **automatically** (or **Continue** without JS);
- becomes invalid after use.

Success: **Magic link copied to clipboard** (or the system share dialog). Error: **Could not generate magic link**.

A Magic Link can be generated by an **administrator** (anyone) and by a **mediator** (parties in their own rooms).

---

## 9. Mediators

**Mediators** → **Registry**.

A mediator is a separate account; after sign-in they create their own Mode B rooms.

- List: **Title**, **Description**, **Copy Credentials**; **Add Mediator**.
- Create: title, description → auto login/password → detail card.
- Card: edit → **Save Changes**; **Copy Credentials**; **Magic Link**; **Delete mediator**.

First sign-in starts mediator onboarding. Until it completes, the rooms console is unavailable. Send the [mediator instruction](./mediator.md).

---

## 10. Settings: API credentials and models

**Settings** → **Credentials**.

- **OpenAI API key** — analysis, mediation, generation;
- **Airtable API key** — external test completion status;
- **Show key** / **Hide key**.

### Chat models by workload

Section **Chat models by workload**. Empty slots fall back to the previous single-model setting. **Refresh models** / **Loading models…**.

| Slot | Purpose |
|------|---------|
| **Dialogue** | Opening, live questions, summaries, moderation, phrase helper |
| **Artifacts** | Options, compromise, draft agreement |
| **Fast** | Translation and language detection |
| **Pipeline** | Post-intake agents and legal analysis |
| **RAG chat** | Legal search query planning and inquiry answers |
| **Help** | In-product help chat widget |

**Save** → **Settings saved**.

Without a valid OpenAI key, the pipeline and session cannot run.

---

## 11. Settings: tests

**Tests** tab. Four **Test URL** fields:

- **What is my personality type**
- **Face to face with fear**
- **Character traits**
- **Personality conflicts**

These are the links opened by **Open test** during onboarding. An empty or wrong URL blocks the participant.

---

## 12. Settings: agent prompts

**Prompts** tab. Five agents:

| Agent | Role |
|-------|------|
| **Psychodynamic** | Profile after tests / bot |
| **Interests** | What matters from dispute intake |
| **Emotional Triggers** | Escalation risks |
| **Legal Analysis** | Norms from RAG (not legal advice) |
| **Mediation Agent** | Opening, dialogue, options, compromise |

**System prompt** → **Save** → **Agent prompt saved**.

### Test agent

Dry run (result is **not** written to a live room):

- **Psychodynamic** / **Emotional Triggers** — select a **participant**;
- **Interests** / **Legal Analysis** / **Mediation Agent** — select a **room**.

The screen may preview personal bot prompt, dispute answers, jurisdiction, and response language. **Run test** → **Result**. If legal search finds nothing: the corresponding “no relevant legal information” message.

---

## 13. Settings: RAG

**RAG** tab — corpus for hybrid search during legal analysis.

- Sub-tabs **Ukraine** / **United States** (US: state / Federal).
- Category filter (Labor, Family, …).
- **Upload document**: name, source URL, category, file TXT/PDF/DOCX.
- Statuses: **Pending**, **Processing**, **Ready**, **Failed**.
- On the card: edit, **Reprocess**, **Delete**.
- **Test inquiry** (+ prepared queries, citations).

Rooms use only documents with status **Ready**. Do not invent a norm if no fragment was found.

> The Credentials hint may mention embeddings on the RAG tab; a dedicated embedding-model UI may not be present — follow the buttons actually shown on screen.

---

## 14. Settings: Help

**Help** tab. Texts that feed the Help window, chat assistant, and PDF/DOCX files.

For each document (**Overview**, **Parties**, **Mediator**, **Admin**) and language (**EN**, **UA**):

1. Title and Markdown.
2. **Save** — chat and Help immediately use the new text.
3. **Reset to bundled file** — restore from `instruction/` in the repository.

After deploying updated markdown in git: if the live DB still has older edited copies, run **Reset to bundled file** for each changed document/locale (or re-seed) so production matches the repository. PDF/DOCX exports are refreshed with `npm run help:docs` in the repo.

> **Do not confuse this with RAG.** RAG is the legal corpus. **Help** is user instructions.

---

## 15. Watching analysis and mediation

### Pipeline & mediation log

On every room card. Sources: **Milestone** and **Pipeline**. Typical events: room created, tests, intake, agents, session start, votes, compromise/agreement published, completion, agent failures.

If a room is stuck at **Not ready** — look for **Agent failed**; check the OpenAI key, RAG, and prompts.

### Mediation details

After the session starts:

- **Phase** and round;
- **Mediation dialogue** (two columns; show original of translations);
- **Solution options & votes**;
- compromise (**Accepted** / **Rejected** / **No vote**);
- **Agreement & results**;
- **Download results**.

PDF: **Legislation** → **Solution** → **Agreement** (no psychodynamic). Email is a stub. The admin does **not** intervene in voting from this window.

---

## 16. Language and logout

- **EN | UA** changes the admin UI, roles in copied credentials, log labels, and RAG categories.
- **Logout** → login page.

---

## 17. Tips and typical situations

**Mode A or B?** Admin **New Room** is always A. Mode B is created by a mediator. Both types appear on the matching tabs.

**Parties cannot sign in.** Check `psylex_…`, send **Copy Credentials** or a new **Magic Link** (72 hours / one-time).

**Tests are not counted.** **Tests** tab (URLs) and **Airtable** key. Participant: **Update test status** (up to two hours).

**Pipeline does not finish.** Log → agent error. Common causes: no OpenAI key, empty RAG, prompt/model failure.

**A mediator asks for a Magic Link.** They can generate it themselves for their parties; you can also generate from the room or mediator card.

**You need to look at a mediator’s session.** **Mediator rooms** → card → log and **Mediation details**. Only the mediator opens the live console.

**Deletion.** Choose between “room only” and “room and parties”. Actions are irreversible.

**Legal ethics.** Do not delete RAG sources without replacing them. The platform deliberately does not give “legal advice”.
