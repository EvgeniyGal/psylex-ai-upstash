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

1. **New Room**.
2. **Room details**: title, description; **Jurisdiction** (**Ukraine** / **United States** + for the US required **State / territory / Federal**).
3. For **Party A** and **Party B**:
   - **Create new participant** — title, description; or
   - **Add existing participant** — search; prep badges for tests (T1–T4) and bot (BP) are shown.
4. **Create Room**.

Jurisdiction is fixed permanently. The same person cannot fill both slots.

After creation the room runs in **Mode A** (AI leads dialogue, **120-minute** session). Copy access and send it with the [party instruction](./parties.md).

**Mode A vs Mode B:** admin **New Room** is always Mode A. Mode B is created by a mediator.

---

## 6. Sides

Menu **Sides** — full registry.

- Tabs **Admin rooms** / **Mediator rooms**; roomless parties appear on the Admin tab as **No rooms**.
- On the mediators tab — **Mediator** filter (**All mediators**).
- Columns: title, login, role, rooms, tests (T1–T4), bot (BP), actions.

Actions:

- **Edit** → **Save Changes** → **Side updated.**
- **Delete party** — with cascading room rules → **Party deleted.**
- ⋮ menu: **Redo T1…T4**, **Redo all tests**, **Redo bot prompt**, **Redo all** → **Retest requested.**

> The **Sides** page does **not** have **Copy Credentials** / **Magic Link**. Credentials live on the **room card** or **mediator card**.

Mediators see only parties from their own rooms (no roomless) under their Sides menu.

---

## 7. Room card

Available for **any** room.

| Block | Actions |
|-------|---------|
| Header | Title, date, **Jurisdiction** |
| **Mediation details** | If a session has started — dialogue, votes, agreement, PDF |
| **Party preparation** (Mode A) or **Mediation schedule** (Mode B) | Readiness checklist; Mode B also shows schedule (saving schedule is for the mediator) |
| **Pipeline & mediation log** | Timeline |
| **Room details** | Edit title/description → **Save Changes**; jurisdiction read-only |
| **Participants** | Edit, login/password, **Copy Credentials**, **Magic Link**, **Request profile update** |
| **Delete room** | Two modes (below) |

Readiness indicators may show **Generating…** while AI analysis runs.

### Delete

- **Delete room only** — party accounts remain (may become roomless);
- **Delete room and parties** — also deletes those party accounts (and related rooms per product rules).

Confirmation required; cannot be undone. Toast: **Room deleted.**

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

Dry run (result is **not** written to a live room): select a participant or room → **Run test** → **Result**. If legal search finds nothing: the corresponding “no relevant legal information” message.

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
