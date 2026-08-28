# Instructions for the administrator

This guide is for the **Admin** role. You operate the PsyLex platform: Mode A rooms, mediator and party accounts, integration keys, test links, AI agent prompts, the RAG legal corpus, and the Help knowledge base.

> **Tip.** The Help icon in the top bar opens all instructions (overview, parties, mediator, admin). The chat assistant replies in **EN | UA**. Help texts are edited under **Settings → Help**.

Instructions for parties and mediators: [parties.md](./parties.md), [mediator.md](./mediator.md).

---

## Contents

1. [What you can do](#1-what-you-can-do)
2. [Signing in](#2-signing-in)
3. [Admin Console](#3-admin-console)
4. [Negotiation rooms](#4-negotiation-rooms)
5. [Creating a Mode A room](#5-creating-a-mode-a-room)
6. [Room card](#6-room-card)
7. [Credentials and Magic Link](#7-credentials-and-magic-link)
8. [Mediators](#8-mediators)
9. [Settings: API credentials](#9-settings-api-credentials)
10. [Settings: tests](#10-settings-tests)
11. [Settings: agent prompts](#11-settings-agent-prompts)
12. [Settings: RAG](#12-settings-rag)
13. [Settings: Help](#13-settings-help)
14. [Watching analysis and mediation](#14-watching-analysis-and-mediation)
15. [Language and logout](#15-language-and-logout)
16. [Tips and typical situations](#16-tips-and-typical-situations)

---

## 1. What you can do

- create **Mode A** rooms (self-guided party mediation with AI);
- view **all** rooms: both yours (admin) and those created by mediators (Mode B);
- edit the room title and description and the parties, and delete rooms;
- copy login/password and generate a **Magic Link** for parties and mediators;
- maintain the mediator registry: add, edit, delete;
- store **OpenAI** and **Airtable** keys;
- set URLs for the external psychological tests;
- edit system prompts for the five AI agents and run test runs (without writing to a live room);
- upload, update, reprocess, and delete RAG legal documents by jurisdiction and category; check search with a test inquiry;
- edit Help texts (Markdown) for all roles and languages — they feed the Help window, the chat assistant, and PDF / DOCX files;
- read the pipeline log and (after start) mediation details, and download the results PDF.

You **do not** run a live Mode B session and **do not** have a calendar in the admin menu. Schedule and session console live in the Mediator Console. On a mediator’s room card you see the schedule in view-only form.

---

## 2. Signing in

1. Open **/login** (**Login** on the home page).
2. Enter the administrator login (format `psylex_…`) and password.
3. Click **Sign in**.

After sign-in, **Negotiation Rooms** opens. Party onboarding (welcome, tests) is not shown for an admin.

If the session expired or the role is different — the system returns you to sign-in. Users with a party or mediator role cannot enter the Admin Console.

---

## 3. Admin Console

On the left, the label **Admin Console**. Menu:

| Item | Where it goes |
|------|----------------|
| **Rooms** | List of all rooms |
| **Mediators** | Mediator registry |
| **Settings** | API, tests, prompts, RAG, Help |

Also: **EN | UA** and **Logout**. The content-area heading is **Mediation Portal**.

The **Help** icon in the top bar opens the instructions and PDF / DOCX downloads. The notifications icon is decorative for now.

---

## 4. Negotiation rooms

Two tabs:

| Tab | What it is |
|-----|------------|
| **Admin rooms** | Mode A: rooms you created (`createdByUserId` empty) |
| **Mediator rooms** | Mode B: rooms created by mediators |

The **New Room** button is only on the admin rooms tab. Mediator rooms are created in the Mediator Console.

### Table

Shared columns: **Room title**, **Room description**, **Jurisdiction**, **Status** (**Ready** / **Not ready** / **Complete**).

On the mediators tab, additionally: the mediator’s name and **Scheduled time**.

List controls: **Search...**, sorting, **Rows per page**, **Page N of M**, **Previous** / **Next**. Click a row to open the card.

Empty states:

- **No admin rooms yet. Create a room to generate participant credentials.**
- **No mediator rooms yet.**
- **No rooms match your search.**

The admin list has no “Open pre-session lobby / Open live session” buttons — that is the mediator interface.

---

## 5. Creating a Mode A room

1. **New Room**.
2. **Room details**:
   - **Room title**, **Room description**;
   - **Jurisdiction** — **Ukraine** or **United States**.
   - For the United States — required field **State / territory / Federal**.
3. **Party A** and **Party B**: **Title / Name**, **Description**.
4. **Create Room**.

Jurisdiction is fixed permanently: legal RAG search during analysis depends on it. You cannot change it later.

After creation:

- two users `party_a` and `party_b` appear with logins `psylex_…` and generated passwords;
- the room runs in **Mode A** (AI leads the dialogue, without a live mediator);
- you are on the room card — copy access and send it to the parties together with [their instruction](./parties.md).

---

## 6. Room card

Available for **any** room (admin or mediator).

| Block | Administrator actions |
|-------|------------------------|
| Header | Title, creation date, **Jurisdiction: …** |
| **Mediation details** | If a session has already started — a modal with dialogue, votes, agreement, PDF |
| **Mediation schedule** | Only for mediator rooms, **view** (date, duration; no save and no lobby entry) |
| **Pipeline & mediation log** | Timeline of preparation and the session |
| **Room details** | Edit title and description → **Save Changes**. Jurisdiction is read-only |
| **Participants** | Party A, Party B, and if present — the mediator. Edit name/description, login, password, **Copy Credentials**, **Magic Link** |
| **Delete Room** | Confirmation **Delete this room and all its participants? This cannot be undone.** |

---

## 7. Credentials and Magic Link

On the room card or mediator card:

### Copy Credentials

The **Copy Credentials** button puts text like this on the clipboard:

```
Role: Party A
Login: psylex_…
Password: …
```

Send it to the party through a protected channel. The login always starts with `psylex_`.

### Magic Link

The **Magic Link** button creates a one-time `/auth/magic?token=…` link:

- valid for **72 hours**;
- after sign-in it becomes used;
- the user lands immediately on their next step (onboarding, lobby, and so on).

Success: **Magic link copied to clipboard** (or the system “share” dialog, if the browser supports it). Error: **Could not generate magic link**.

A Magic Link can be generated **only by an administrator**. The mediator copies login/password, but you create the link.

---

## 8. Mediators

Menu **Mediators** → **Registry**.

A mediator is a separate account, not “tied” to one room at creation time. After sign-in the mediator creates their own Mode B rooms.

### List

Table: **Title**, **Description**, **Actions** (**Copy Credentials**). Search, sorting, pagination. Click a row — mediator card. Button **Add Mediator**.

Empty list: **No mediators yet. Create your first mediator to generate credentials.**

### Adding

1. **Add Mediator**.
2. **Title / Name**, **Description**.
3. **Add Mediator** again.

Login and password are generated automatically. The card opens — copy access or a **Magic Link** and send it together with the [mediator instruction](./mediator.md).

The mediator’s first sign-in starts their onboarding (welcome, consent, tests). Until onboarding is complete, the rooms console is not available to them.

### Mediator card

- edit name and description → **Save Changes**;
- login, password, **Copy Credentials**, **Magic Link**;
- **Delete mediator** with confirmation (this cannot be undone).

---

## 9. Settings: API credentials

**Settings** → **Credentials** tab.

Fields:

- **OpenAI API key** — required for analysis agents, mediation, question and option generation;
- **Airtable API key** — for integration with the external tests (completion status).

Buttons **Show key** / **Hide key**. **Save** → **Settings saved**.

Without a valid OpenAI key, the pipeline after the dispute description and the mediation session cannot run.

---

## 10. Settings: tests

**Tests** tab. Four URLs for the external modules:

| Field in admin | What the participant sees |
|----------------|---------------------------|
| **What is my personality type** | The same module |
| **Face to face with fear** | In the portal: **Face to face with fear** |
| **Character traits** | Character traits |
| **Personality conflicts** | Personality conflicts |

Each field is **Test URL**. **Save**.

These are the links opened by **Open test** during party and mediator onboarding. If a URL is empty or wrong, the participant cannot complete the module and will not reach the dispute description / Mediator Console.

---

## 11. Settings: agent prompts

**Prompts** tab. Five agents (sub-tabs):

| Agent | Role in the process |
|-------|---------------------|
| **Psychodynamic** | Personality profile after tests / bot |
| **Interests** | What truly matters to the parties from the dispute intake |
| **Emotional Triggers** | Escalation risks |
| **Legal Analysis** | Norms from RAG for the room’s jurisdiction (not legal advice) |
| **Mediation Agent** | Opening, dialogue, options, compromise in the session |

For each:

1. Edit the **System prompt**.
2. **Save** → **Agent prompt saved**.

### Test agent

The **Test agent** block runs a **dry** run: the result is **not** written to a live room.

- for psychodynamic / triggers — select a participant;
- for interests / legal analysis / mediation — select a room.

The screen shows input data (**Personal bot prompt**, **Dispute answers**, **Jurisdiction**, **Response language**). **Run test** → **Result** (structured output). If legal search found nothing: **No relevant legal information found**.

Use this before changing prompts in production, so you do not break live sessions.

---

## 12. Settings: RAG

**RAG** tab — the corpus of legal documents for hybrid search during legal analysis.

### Jurisdictions

Sub-tabs **Ukraine** and **United States**. United States documents are additionally tied to a state / territory or **Federal** jurisdiction. Federal documents are included in search for every state.

### Categories

Filter: **All categories**, or

- Labor, Family, Contract, Property, Consumer, Corporate, Insurance, ODR / International.

### Upload

1. **Upload document**.
2. **Document name**, **Source URL**, **Category**, and for the United States — jurisdiction.
3. File **TXT, PDF, or DOCX** — **Choose file**.
4. **Upload**. Indexing runs: **Uploading document…** / text extraction.

Document statuses: **Pending**, **Processing**, **Ready**, **Failed**.

On the document card: editing, **Reprocess**, **Delete** (with confirmation about indexed chunks).

Legal analysis in rooms uses only documents with status **Ready** for the matching jurisdiction. If there is no relevant fragment, the system should say that a provision was not found — not invent a norm.

### Test inquiry

**Test inquiry** block:

- enter a question;
- if needed, choose one document or **Search entire jurisdiction**;
- **Run inquiry**.

This is how you check whether the corpus answers typical questions before loading it into live rooms.

---

## 13. Settings: Help

**Help** tab. These are the texts that feed the Help window, the chat assistant, and PDF / DOCX files.

For each document (**Overview**, **Parties**, **Mediator**, **Admin**) and each language (**EN**, **UA**):

1. Edit the title and Markdown.
2. **Save** — chat and Help immediately use the new text.
3. If needed, **Reset to file** — restore the text from the `instruction/` repository.

> **Do not confuse this with RAG.** The RAG tab is the legal corpus for dispute analysis. The **Help** tab is user instructions, not legislation.

---

## 14. Watching analysis and mediation

### Pipeline & mediation log

On every room card. Event sources: **Milestone** and **Pipeline**.

Typical stages: room created, test completed, onboarding completed, dispute intake submitted, profiles generated, legal analysis completed, post-intake pipeline completed, session started, agreement accepted, mediation completed.

Pipeline: triggered / completed, agent started / completed / failed / skipped, mediation phase changed.

Empty log: **No activity recorded yet.**

If a room is “stuck” at **Not ready** — look in the log for which agent shows **Agent failed**, and check the OpenAI key, RAG, and prompts.

### Mediation details

The button appears after the session starts. In the window:

- current **Phase** and round;
- **Mediation dialogue** in two columns (the parties);
- **Solution options & votes**;
- compromise vote (**Accepted** / **Rejected** / **No vote**);
- **Agreement & results**;
- **Download results**.

The admin **does not** intervene in voting from this window — only observes and saves artifacts.

---

## 15. Language and logout

- **EN | UA** in the sidebar changes the language of the admin UI, the role in copied credentials, log labels, and RAG categories.
- **Logout** → login page.

---

## 16. Tips and typical situations

**Mode A or B?** Admin **New Room** is always Mode A. Mode B appears when a mediator creates the room. Both types are visible on the matching tabs.

**The parties cannot sign in.** Check the login `psylex_…`, send **Copy Credentials** or a new **Magic Link** (the old link may have expired after 72 hours or already been used).

**Tests are not counted.** Check the **Tests** tab (URLs) and the **Airtable** key. Ask the participant to click **Update test status**; processing can take up to two hours.

**The pipeline does not finish.** Log → agent error. Common causes: no OpenAI key, empty RAG for the room’s jurisdiction, a prompt failure. Fix the settings; for an already created room the parties may need to wait for reprocessing, or you may need a new room — depending on the nature of the failure.

**A mediator asks for a Magic Link.** Generate it from the room card (for parties) or from the mediator card (for the mediator). Link generation is not available in the Mediator Console.

**You need to look at a mediator’s session.** Open **Mediator rooms** → card → log and **Mediation details**. Only the mediator opens the live console and calendar.

**Deletion.** Deleting a room removes the room and the party participants. Deleting a mediator removes the mediator account. Both actions are irreversible.

**Legal ethics.** Do not delete RAG sources without replacing them; every legal statement in the product must rest on an uploaded source. The platform deliberately does not give “legal advice” — this is built into the banners for parties and into the legal agent prompts.
