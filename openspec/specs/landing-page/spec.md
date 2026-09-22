# Landing Page

## Purpose

TBD — Public marketing landing page for PsyLex with bilingual support.

## Requirements

### Requirement: Hero section above the fold

The landing page SHALL display a hero section fully visible without scrolling on standard desktop viewports. The hero MUST include the primary headline, subheadline, two CTA buttons, and a visual metaphor animation on a dark navy background.

#### Scenario: English hero content

- **WHEN** a visitor loads the landing page with English locale
- **THEN** the headline reads "Conflict doesn't need a winner. It needs a solution."
- **AND** the subheadline reads "AI helps both sides find what they really need — together."
- **AND** the primary CTA reads "Start on my own"
- **AND** the secondary CTA reads "For Mediators →"

#### Scenario: Ukrainian hero content

- **WHEN** a visitor loads the landing page with Ukrainian locale
- **THEN** the headline reads «У спорі не повинно бути тих, хто програв»
- **AND** the subheadline reads «AI допомагає обом сторонам знайти те, що їм справді потрібно»
- **AND** the primary CTA reads "Почати самостійно"
- **AND** the secondary CTA reads "Для медіаторів →"

#### Scenario: Prism visual metaphor

- **WHEN** the hero section renders
- **THEN** a prism-themed visual element is displayed with dark navy background and a soft light glow at the convergence point
- **AND** the animation is minimal and calm

### Requirement: Landing CTA destination

Both hero CTA buttons SHALL navigate to the login page at `/login`.

#### Scenario: Primary CTA destination

- **WHEN** a visitor clicks "Start on my own" (or "Почати самостійно")
- **THEN** the browser navigates to `/login`

#### Scenario: Secondary CTA destination

- **WHEN** a visitor clicks "For Mediators →" (or "Для медіаторів →")
- **THEN** the browser navigates to `/login`

### Requirement: Roles section

The landing page SHALL explain that parties, the mediator, and a licensed attorney each have a distinct role. The section MUST NOT compare PsyLex against attorneys or claim a solution in one session.

#### Scenario: English roles content

- **WHEN** a visitor views the roles section in English
- **THEN** the heading reads "Everyone has a role"
- **AND** the subheading reads "PsyLex supports the process — people make the decisions."
- **AND** three cards describe the parties, the mediator, and the attorney
- **AND** the attorney card states that PsyLex refers parties to licensed attorneys

#### Scenario: Ukrainian roles content

- **WHEN** a visitor views the roles section in Ukrainian
- **THEN** the heading reads «У кожного своя роль»
- **AND** three cards describe the parties, the mediator, and the attorney

### Requirement: Win-win-win section

The landing page SHALL display three benefit cards on a dark background communicating mutual benefit of mediation.

#### Scenario: Three benefits shown

- **WHEN** a visitor views the win-win-win section
- **THEN** three items are displayed: Side A gets what they truly need, Side B gets what they truly need, and Agreement is real and signed
- **AND** footer text explains that mediation finds solutions where each side receives what truly matters

### Requirement: How it works section

The landing page SHALL explain workflows for Mode A (self-resolution) and Mode B (mediator) with three numbered steps each.

#### Scenario: Mode A steps

- **WHEN** a visitor views the self-resolution workflow
- **THEN** three steps describe: conflict description and short test, AI profile and structured dialogue, and resolution plan to propose

#### Scenario: Mode B steps

- **WHEN** a visitor views the mediator workflow
- **THEN** three steps describe: mediator test and adding parties, AI psychological profile analysis, and mediated session with AI support and report

### Requirement: Footer

The landing page SHALL include a footer with logo, PsyLex name, navigation links, copyright, and legal disclaimer.

#### Scenario: Footer elements

- **WHEN** a visitor scrolls to the page footer
- **THEN** links for Disclaimer, Privacy, and How it works are present
- **AND** copyright reads "© 2026 AI Innovation Management LLC"
- **AND** disclaimer states PsyLex provides general information only, not legal advice, not therapy

### Requirement: Visual design alignment

The landing page UI SHALL follow the Stitch design reference screen "PsyLex: How It Works Added" and the project design system for colors, typography, and spacing.

#### Scenario: Design tokens applied

- **WHEN** the landing page is rendered
- **THEN** typography, color palette, and component styling match the cached Stitch design system assets in `docs/stitch/`

### Requirement: Locale detection and persistence

The landing page SHALL auto-detect locale from the browser language on first visit, allow manual locale switching between `en` and `uk`, and persist the selected locale in `localStorage`.

#### Scenario: First visit locale detection

- **WHEN** a visitor opens the landing page without a stored locale preference
- **THEN** locale is set based on browser language (`uk` for Ukrainian, otherwise `en`)

#### Scenario: Manual locale switch

- **WHEN** a visitor manually changes locale using the locale switch control
- **THEN** all landing copy updates to the selected locale immediately

#### Scenario: Locale persistence

- **WHEN** a visitor has previously selected a locale
- **THEN** the landing page loads using the locale from `localStorage` on subsequent visits
