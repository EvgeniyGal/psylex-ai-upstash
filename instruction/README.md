# PsyLex user instructions

Bilingual product guides for PsyLex. Ukrainian is the original; English is the full translation.

| Locale | Overview | Parties A/B | Mediator | Administrator |
|--------|----------|-------------|----------|---------------|
| Ukrainian | [uk/overview.md](./uk/overview.md) | [uk/parties.md](./uk/parties.md) | [uk/mediator.md](./uk/mediator.md) | [uk/admin.md](./uk/admin.md) |
| English | [en/overview.md](./en/overview.md) | [en/parties.md](./en/parties.md) | [en/mediator.md](./en/mediator.md) | [en/admin.md](./en/admin.md) |

In the product, **Help** and the chat assistant load these texts for the user’s selected language (**EN | UA**). Administrators can edit the live copies under **Settings → Help**.

### Deploy note (DB overrides)

Live deployments may keep older Help text in the database if an admin previously edited and saved a document. After you update these markdown files and regenerate exports (`npm run help:docs` → `public/docs/{en,uk}/`), run **Settings → Help → Reset to file** for each changed document/locale (or re-seed) so production matches git. Until then, Help UI and the chat assistant continue to serve the DB copy.
