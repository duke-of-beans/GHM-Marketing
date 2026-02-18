# Website Studio — UI Wireframes
**Version:** 1.0
**Date:** February 18, 2026
**Owner:** David Kirsch
**Status:** Canonical — implement from this document

---

## Design Language

### Color System
These tier colors are used consistently throughout every screen — badges, matrix cells, pipeline indicators, domain registry tags. Never deviate.

- **Tier 1 — Steel Blue** `#3B82F6`  Infrastructure. Extension. Structural.
- **Tier 2 — Slate Purple** `#8B5CF6`  Expansion. Brand satellite. Geographic ambition.
- **Tier 3 — Amber** `#F59E0B`  Independent. New brand. Creative identity.
- **Live / Healthy** `#10B981`  Green. Deployed, DNS resolved, SSL active.
- **In Progress** `#FBBF24`  Yellow. Build active, pipeline moving.
- **Gap / Opportunity** `#6B7280`  Gray with dashed border. Not started. Quantified opportunity.
- **Error / Flagged** `#EF4444`  Red. Deploy failure, DNS issue, SSL expired, staleness.

### Typography Hierarchy
Follows dashboard globals. Not redefined here — Website Studio inherits the platform type system.

### Interaction Principles
- Status changes happen in-place. No full-page reloads for state transitions.
- Empty cells / gap states are inviting, not empty. Dashed borders, hover bloom, opportunity data on hover.
- Destructive actions (delete, redeploy from scratch) require confirmation dialogs with typed confirmation for irreversible operations.
- Permission-locked actions are visible but disabled — not hidden. Tooltip on hover explains why.
- Override notes are required fields, not optional. The form does not submit without them.

---

## Screen Index

1. Website Studio Tab — Overview (Matrix View)
2. New Site Initiation Modal — Tier Selection
3. New Site Initiation Modal — Identity & Config
4. New Site Initiation Modal — Scaffold Preview
5. DNA Lab — Visual DNA
6. DNA Lab — Voice DNA
7. DNA Token — Override Panel
8. Build Queue — Pipeline Board
9. Page Composer — Full Screen
10. SCRVNR Status Panel
11. Live Sites — Status Board
12. Domain Registry Entry — Detail View

---

## 1. Website Studio Tab — Overview (Matrix View)

Entry point. Default view when the Website Studio tab is selected from the client card.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CLIENT CARD — German Auto Doctor                                               │
│  Scorecard │ Tasks │ Content Studio │ Website Studio │ Reports │ Domains │ ...  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WEBSITE STUDIO                                            [+ New Site]         │
│  ──────────────────────────────────────────────────────────────────────         │
│  Overview   DNA Lab   Build Queue   Live Sites                                  │
│  ────────                                                                       │
│                                                                                 │
│  ┌─ Summary Bar ──────────────────────────────────────────────────────────┐     │
│  │  3 Live    2 In Progress    6 Not Started    11 Total Opportunity       │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ┌─ Matrix Grid ──────────────────────────────────────────────────────────┐     │
│  │                                                                         │     │
│  │              TIER 1 EXTENSION    TIER 2 SATELLITE    TIER 3 PURE       │     │
│  │              ─── Steel Blue ──   ─── Purple ──────   ─── Amber ──      │     │
│  │                                                                         │     │
│  │  AUDI        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │     │
│  │              │ ● LIVE       │   │ ● LIVE       │   │ ● LIVE       │   │     │
│  │              │ audi.gad.com │   │ gad-oak.com  │   │ quattro      │   │     │
│  │              │ Updated 3d   │   │ Updated 5d   │   │ authority.com│   │     │
│  │              │ ████████████ │   │ ████████████ │   │ Updated 2d   │   │     │
│  │              └──────────────┘   └──────────────┘   └──────────────┘   │     │
│  │                                                                         │     │
│  │  BMW         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │     │
│  │              │ ⬤ IN PROGRESS│   │ ╌ ╌ ╌ ╌ ╌ ╌ │   │ ╌ ╌ ╌ ╌ ╌ ╌ │   │     │
│  │              │ Stage 3/5    │   │      +       │   │      +       │   │     │
│  │              │ SCRVNR Gate  │   │  Start Build │   │  Start Build │   │     │
│  │              │ [▓▓▓▓░░░░░░] │   │ ~280 searches│   │ ~190 searches│   │     │
│  │              └──────────────┘   └──────────────┘   └──────────────┘   │     │
│  │                                                                         │     │
│  │  MERCEDES    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │     │
│  │              │ ╌ ╌ ╌ ╌ ╌ ╌ │   │ ╌ ╌ ╌ ╌ ╌ ╌ │   │ ╌ ╌ ╌ ╌ ╌ ╌ │   │     │
│  │              │      +       │   │      +       │   │      +       │   │     │
│  │              │  Start Build │   │  Start Build │   │  Start Build │   │     │
│  │              │ ~340 searches│   │ ~210 searches│   │ ~155 searches│   │     │
│  │              └──────────────┘   └──────────────┘   └──────────────┘   │     │
│  │                                                                         │     │
│  │  PORSCHE     [live cell]         [gap cell]          [gap cell]         │     │
│  │  VW          [gap cell]          [gap cell]          [gap cell]         │     │
│  │  MINI        [gap cell]          [gap cell]          [gap cell]         │     │
│  │                                                                         │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Cell States:**
- LIVE cell: Solid border in tier color, green pulse dot, domain name, last updated date, traffic sparkline (if GSC connected)
- IN PROGRESS cell: Tier color border (dashed), yellow fill tint, stage indicator (Stage N/5), current stage name, mini progress bar
- GAP cell: Dashed gray border, faint "+" centered, estimated search volume on hover, hover state blooms the cell with a faint tier-color tint

**Secondary nav** (Overview / DNA Lab / Build Queue / Live Sites): Underline-style tabs, lighter weight than the main tab strip. Active state is a colored underline matching the current view's dominant action color.

**Summary bar:** Four counts — Live (green), In Progress (yellow), Not Started (gray), Total (neutral). These are clickable filters that highlight the relevant cells in the matrix.

**[+ New Site] button:** Top right. Opens the new site initiation modal (Screen 2). Disabled if DNA is not captured — tooltip explains prerequisite.

---

## 2. New Site Initiation Modal — Tier Selection

Triggered by clicking a gap cell "+" or the [+ New Site] button. Focused modal overlay on the matrix.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Start a New Site                                              [✕ Cancel]      │
│   ─────────────────                                                             │
│   Step 1 of 3: Choose Site Type                                                 │
│   ●──○──○                                                                       │
│                                                                                 │
│   ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────┐  │
│   │  ▐███▌                 │  │  ▐███▌  ╌╌╌            │  │  ╌╌╌   ▐▓▓▓▌    │  │
│   │   ↕                   │  │   ↕       ↕             │  │                  │  │
│   │  [CLIENT SITE]         │  │  [CLIENT]  [SATELLITE]  │  │  [INDEPENDENT]   │  │
│   │                        │  │                         │  │                  │  │
│   │  TIER 1                │  │  TIER 2                 │  │  TIER 3          │  │
│   │  Site Extension        │  │  Branded Satellite      │  │  Pure Satellite  │  │
│   │                        │  │                         │  │                  │  │
│   │  Pages that appear     │  │  Separate domain, same  │  │  Its own brand,  │  │
│   │  to be part of the     │  │  brand. Geographic or   │  │  its own voice,  │  │
│   │  client's existing     │  │  service expansion      │  │  no visible      │  │
│   │  website. Hosted by    │  │  under the client's     │  │  connection to   │  │
│   │  GHM, invisible seam.  │  │  name and identity.     │  │  parent client.  │  │
│   │                        │  │                         │  │                  │  │
│   │  Requires: Visual DNA  │  │  Requires: Visual DNA   │  │  Requires: New   │  │
│   │  captured from client  │  │  captured from client   │  │  design + voice  │  │
│   │  site.                 │  │  site.                  │  │  intake.         │  │
│   │                        │  │                         │  │                  │  │
│   │   ○ Select             │  │   ○ Select              │  │   ○ Select       │  │
│   └────────────────────────┘  └─────────────────────────┘  └──────────────────┘  │
│                                                                                 │
│   Note: If DNA has not been captured for this client, Tier 1 and Tier 2        │
│   will be disabled. Capture DNA in the DNA Lab tab first.                      │
│                                                                                 │
│                                                              [Next →]           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Illustrations:** Simple architectural line diagrams. Tier 1 shows an existing site block with new pages branching from it. Tier 2 shows the existing site and a separate domain block connected by a brand identity line. Tier 3 shows a fully independent block with no connecting lines.

**Selection behavior:** Clicking a card selects it (ring highlight in tier color, radio fills). [Next →] only activates after a selection.

**Disabled state:** If Visual DNA is not captured, Tier 1 and Tier 2 cards show a lock icon overlay and a tooltip: "Capture Visual DNA in DNA Lab first." Tier 3 is always available.

---

## 3. New Site Initiation Modal — Identity & Config

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Start a New Site — Tier 1: Site Extension         [✕ Cancel]                 │
│   Step 2 of 3: Site Identity                                                    │
│   ●──●──○                                                                       │
│                                                                                 │
│   Brand / Segment                                                               │
│   ┌──────────────────────────────────────────┐                                  │
│   │  BMW                                     │  ← Pre-filled if initiated       │
│   └──────────────────────────────────────────┘     from a matrix cell           │
│                                                                                 │
│   Target URL (final subdomain/domain)                                           │
│   ┌──────────────────────────────────────────┐                                  │
│   │  bmw.germanautodoctorsimivalley.com      │                                  │
│   └──────────────────────────────────────────┘                                  │
│                                                                                 │
│   Visual DNA Source                                                             │
│   ● Use captured DNA (last captured: Feb 16, 2026)                              │
│   ○ Recapture before scaffolding                                                │
│                                                                                 │
│   Voice Profile                                                                 │
│   ● Use existing: gad-main (last updated: Feb 14, 2026)                         │
│   ○ Create new profile for this property                                        │
│                                                                                 │
│   Assigned Producer    [Permission: visible to Owners and Account Managers]     │
│   ┌──────────────────────────────────────────┐                                  │
│   │  Select team member...               ▾  │                                  │
│   └──────────────────────────────────────────┘                                  │
│                                                                                 │
│                                          [← Back]  [Next →]                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**For Tier 3:** The Voice Profile section changes to show only "Create new profile for this property" — pre-selected, non-optional. A brief note: "Pure satellites require their own voice. You'll complete the voice intake in DNA Lab before composition begins."

**Team assignment field:** Only visible to users with team management permissions. Solo operators see a simplified version without this field.

---

## 4. New Site Initiation Modal — Scaffold Preview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Start a New Site — Tier 1: Site Extension         [✕ Cancel]                 │
│   Step 3 of 3: Scaffold Preview                                                 │
│   ●──●──●                                                                       │
│                                                                                 │
│   The following will be created:                                                │
│                                                                                 │
│   ┌─ Scaffold Manifest ──────────────────────────────────────────────────┐      │
│   │                                                                       │      │
│   │  clients/german-auto-doctor/hub-extensions/bmw/                      │      │
│   │  ├── index.html          ← Brand hub (BMW home, links to spokes)     │      │
│   │  ├── common-problems.html                                             │      │
│   │  ├── services.html                                                    │      │
│   │  ├── models/                                                          │      │
│   │  │   ├── 3-series.html                                                │      │
│   │  │   ├── 5-series.html                                                │      │
│   │  │   └── x5.html                                                      │      │
│   │  ├── css/                                                             │      │
│   │  │   └── styles.css      ← Derived from visual-dna.json              │      │
│   │  └── snippets/                                                        │      │
│   │      ├── header.html     ← Cloned from captured header DOM           │      │
│   │      └── footer.html     ← Cloned from captured footer DOM           │      │
│   │                                                                       │      │
│   │  Voice Profile: gad-main.json (active on all pages)                  │      │
│   │  Vercel Project: ghm-gad-bmw-t1 (will be created on first deploy)   │      │
│   │  SCRVNR Gate: Active                                                  │      │
│   │                                                                       │      │
│   └───────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   12 files will be created. Content slots will contain placeholder text.        │
│   SCRVNR processing required before any page can advance to review.             │
│                                                                                 │
│                                          [← Back]  [Create Scaffold]            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**[Create Scaffold] behavior:** Clicking creates all files immediately, adds a new "In Progress" card to the Build Queue (Stage 1: Scaffolded), updates the matrix cell to yellow In Progress state, closes the modal, and navigates to the Build Queue view with the new project card highlighted.

---

## 5. DNA Lab — Visual DNA

Secondary nav: DNA Lab selected (underline active).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WEBSITE STUDIO                                            [+ New Site]         │
│  Overview   DNA Lab   Build Queue   Live Sites                                  │
│             ───────                                                             │
│                                                                                 │
│  DNA Lab                                                                        │
│  ──────────────────────────────────────────────────────────────────────         │
│  [ Visual DNA ]  [ Voice DNA ]                                                  │
│    ───────────                                                                  │
│                                                                                 │
│  ┌─ Status Bar ──────────────────────────────────────────────────────────┐      │
│  │  ● Visual DNA Captured    Last: Feb 16, 2026    Source: gad-main-site │      │
│  │  [Recapture]  [View History]                                           │      │
│  └────────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│  ┌─ Color Palette ───────────────────────────────────────────────────────┐      │
│  │                                                                         │      │
│  │  Primary      Secondary    Accent       Background   Text              │      │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │      │
│  │  │        │  │        │  │        │  │        │  │        │         │      │
│  │  │        │  │        │  │        │  │        │  │        │         │      │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘         │      │
│  │  #1A1A1A     #C8102E     #F5F5F0     #FFFFFF     #2D2D2D             │      │
│  │  ⊙ locked   ⚠ medium   ⊙ locked   ✓ accepted  ✓ accepted            │      │
│  │                           confidence                                   │      │
│  └─────────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│  ┌─ Typography ──────────────────────────────────────────────────────────┐      │
│  │                                                                         │      │
│  │  HEADINGS                          BODY                                 │      │
│  │  Montserrat Bold, 700              Open Sans, 400                       │      │
│  │  ┌──────────────────────────┐      ┌──────────────────────────────┐    │      │
│  │  │ German Auto Doctor       │      │ We specialize in European     │    │      │
│  │  │ Expert Care              │      │ vehicles because that's where │    │      │
│  │  └──────────────────────────┘      │ our training and tooling is.  │    │      │
│  │  ✓ accepted  ⊙ locked              └──────────────────────────────┘    │      │
│  │                                    ✓ accepted                           │      │
│  └─────────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│  ┌─ Component Map ───────────────────────────────────────────────────────┐      │
│  │                                                                         │      │
│  │  Header        [████ LOGO ██ NAV ITEM │ NAV ITEM │ NAV ITEM ██ CTA]   │      │
│  │                ✓ accepted                                               │      │
│  │                                                                         │      │
│  │  Button style  [██ PRIMARY CTA ██]   [─ Secondary ─]                  │      │
│  │                ✓ accepted             ⚠ medium confidence              │      │
│  │                                                                         │      │
│  │  Footer        [LOGO │ NAV COL │ NAV COL │ CONTACT │ COPYRIGHT]       │      │
│  │                ✓ accepted                                               │      │
│  └─────────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Token confidence indicators:**
- `✓ accepted` — machine-captured, accepted by operator
- `⊙ locked` — human-reviewed and locked, won't be overwritten on recapture
- `⚠ medium confidence` — amber flag, operator should review
- `✗ override` — machine value was corrected by human (hover to see original + note)

Every token is clickable. Clicking opens the Override Panel (Screen 7).

---

## 6. DNA Lab — Voice DNA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DNA Lab                                                                        │
│  [ Visual DNA ]  [ Voice DNA ]                                                  │
│                    ──────────                                                   │
│                                                                                 │
│  ┌─ Profile Selector ────────────────────────────────────────────────────┐      │
│  │  Active Profile:  [ gad-main ▾ ]     [+ New Profile]                  │      │
│  │  Used by: Tier 1 extensions, Tier 2 satellites                        │      │
│  │  Last updated: Feb 14, 2026    Source: germanautodoctorsimivalley.com  │      │
│  └────────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│  ┌─ Voice Profile: gad-main ─────────────────────────────────────────────┐      │
│  │                                                                         │      │
│  │  READING LEVEL                                                          │      │
│  │  Grade 8.2   ✓ accepted                                                 │      │
│  │                                                                         │      │
│  │  SENTENCE RHYTHM                                                        │      │
│  │  Avg length: 14.3 words   Burstiness: 0.72   ✓ accepted                │      │
│  │  (High burstiness = more human variation. Target: >0.60)               │      │
│  │                                                                         │      │
│  │  CONTRACTION RATE                                                       │      │
│  │  38% of eligible positions   ✓ accepted                                 │      │
│  │  (Natural conversational rate for a trade professional)                 │      │
│  │                                                                         │      │
│  │  TECHNICAL SPECIFICITY                                                  │      │
│  │  High — makes specific claims (model numbers, mileage, failure rates)  │      │
│  │  ✓ accepted                                                             │      │
│  │                                                                         │      │
│  │  TRUST SIGNAL PATTERN                                                   │      │
│  │  Certification-led, tenure-referenced, specific-claim style            │      │
│  │  ✓ accepted                                                             │      │
│  │                                                                         │      │
│  │  NATIVE CONSTRUCTIONS (phrases that belong to this voice)              │      │
│  │  • "We've seen this on..."                                              │      │
│  │  • "Most shops won't tell you..."                                       │      │
│  │  • Specific failure mode + mileage pattern format                      │      │
│  │  ✓ accepted                                                             │      │
│  │                                                                         │      │
│  │  NEGATIVE SPACE (what this voice never says)                           │      │
│  │  • Generic opener constructions ("In the realm of...")                 │      │
│  │  • Passive hedging ("It may be worth considering...")                  │      │
│  │  • Vague superlatives ("the best," "world-class," "top-tier")         │      │
│  │  ✓ accepted                                                             │      │
│  │                                                                         │      │
│  └─────────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│  [Recapture from URL]   [Run Intake Interview]   [View Override History]        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**[Run Intake Interview] modal:** Opens a structured questionnaire for building or refining a voice profile manually. Used for Tier 3 new brands and for refining profiles where the source URL didn't yield enough signal. Questions: Who is this brand talking to? What does it know that others don't? What would it never say? What's the emotional register (clinical / conversational / authoritative / warm)? Provide three sample sentences you'd expect this brand to write. The intake saves directly to the profile as human-sourced tokens (marked distinctly from machine-extracted tokens).

---

## 7. DNA Token — Override Panel

Slides in from the right when any token is clicked. Applies to both Visual and Voice DNA tokens.

```
┌──────────────────────────────────────────────────────┐
│  Token: Primary Color                        [✕]     │
│  ──────────────────────────────────────────────────   │
│                                                       │
│  Current Value                                        │
│  ┌─────────────────────────────────────────────┐     │
│  │  #1A1A1A  ████                              │     │
│  └─────────────────────────────────────────────┘     │
│  Source: machine-extracted                            │
│  Status: ✓ accepted                                   │
│                                                       │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  Override Value                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │  #1C1C1C                                    │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  Why are you changing this? (required)                │
│  ┌─────────────────────────────────────────────┐     │
│  │                                             │     │
│  │                                             │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  Override History                                     │
│  No previous overrides.                               │
│                                                       │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  ☐ Lock this token after override                     │
│    (prevents future recapture from overwriting)       │
│                                                       │
│                    [Cancel]  [Save Override]          │
└──────────────────────────────────────────────────────┘
```

**Override History section** (when overrides exist):
```
│  Override History                                     │
│  ─────────────────                                    │
│  Feb 14 · D. Kirsch                                   │
│  #1A1A1A → #1C1C1C                                   │
│  "Extracted value was pure black, actual brand        │
│   color is near-black with slight warmth."            │
```

---

## 8. Build Queue — Pipeline Board

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WEBSITE STUDIO                                            [+ New Site]         │
│  Overview   DNA Lab   Build Queue   Live Sites                                  │
│                       ───────────                                               │
│                                                                                 │
│  Build Queue              Filter: [ All Brands ▾ ] [ All Tiers ▾ ] [ Mine ▾]  │
│                                                                                 │
│  SCAFFOLDED (1)        COMPOSING (2)      IN REVIEW (1)   APPROVED (0)   LIVE  │
│  ─────────────         ─────────────      ─────────────    ──────────    ─────  │
│                                                                                 │
│  ┌────────────┐        ┌────────────┐     ┌────────────┐                        │
│  │ [T1]       │        │ [T1]       │     │ [T3]       │                        │
│  │ BMW        │        │ BMW        │     │ Quattro    │                        │
│  │ Extension  │        │ Extension  │     │ Authority  │                        │
│  │            │        │ pg 3 of 8  │     │ Home Page  │                        │
│  │ Ready to   │        │            │     │            │                        │
│  │ compose.   │        │ ⚠ SCRVNR  │     │ Awaiting   │                        │
│  │            │        │   Failed   │     │ review by  │                        │
│  │ [Open]     │        │ on Intro   │     │ D. Kirsch  │                        │
│  │            │        │ section    │     │            │                        │
│  │ Assigned:  │        │            │     │ [Review]   │                        │
│  │ D. Kirsch  │        │ [Open]     │     │            │                        │
│  └────────────┘        └────────────┘     └────────────┘                        │
│                                                                                 │
│                        ┌────────────┐                                           │
│                        │ [T1]       │                                           │
│                        │ Porsche    │                                           │
│                        │ Extension  │                                           │
│                        │ pg 1 of 8  │                                           │
│                        │            │                                           │
│                        │ ✓ SCRVNR  │                                           │
│                        │   Cleared  │                                           │
│                        │            │                                           │
│                        │ [Open]     │                                           │
│                        └────────────┘                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Pipeline columns:** Scaffolded → Composing → In Review → Approved → Live. Cards move rightward. Cards in SCRVNR-failed state show a yellow warning indicator within the Composing column — they don't get their own column. SCRVNR is a gate within Stage 3, not a separate stage.

**[Mine] filter:** Shows only builds assigned to the current user. Useful for producers who shouldn't see the full client pipeline.

**Card tier badge:** [T1] in steel blue, [T2] in purple, [T3] in amber. Color-coded at a glance.

---

## 9. Page Composer — Full Screen

Opens when a build card is clicked. Replaces the tab content with a focused build environment. Back navigation returns to Build Queue.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ← Build Queue    BMW Extension — Common Problems Page    [T1] gad-main voice   │
│  ─────────────────────────────────────────────────────────────────────────────   │
│                                                                                 │
│  ┌─ Left Panel (40%) ──────────────────────┐  ┌─ Right Panel (60%) ──────────┐  │
│  │                                          │  │                               │  │
│  │  PAGE STRUCTURE                          │  │  LIVE PREVIEW                 │  │
│  │  ────────────────                        │  │  (renders in client DNA)      │  │
│  │                                          │  │                               │  │
│  │  ▼ Hero                          [✕]    │  │  ┌───────────────────────────┐ │  │
│  │  ┌────────────────────────────────┐     │  │  │ [CLIENT HEADER — REAL DOM]│ │  │
│  │  │ Headline                       │     │  │  ├───────────────────────────┤ │  │
│  │  │ ┌──────────────────────────┐   │     │  │  │                           │ │  │
│  │  │ │ BMW Electrical Problems  │   │     │  │  │  BMW Electrical Problems  │ │  │
│  │  │ │ German Auto Doctors...   │   │     │  │  │  German Auto Doctors...   │ │  │
│  │  │ └──────────────────────────┘   │     │  │  │                           │ │  │
│  │  │                                │     │  │  │  [Schedule Diagnosis]     │ │  │
│  │  │ Subhead                        │     │  │  │                           │ │  │
│  │  │ ┌──────────────────────────┐   │     │  │  └───────────────────────────┘ │  │
│  │  │ │ We've diagnosed over...  │   │     │  │                               │  │
│  │  │ └──────────────────────────┘   │     │  │  [continues below ↓]          │  │
│  │  │                                │     │  │                               │  │
│  │  │ CTA Text                       │     │  └───────────────────────────────┘  │
│  │  │ ┌──────────────────────────┐   │     │                                     │
│  │  │ │ Schedule Diagnosis       │   │     │  SCRVNR STATUS                      │
│  │  │ └──────────────────────────┘   │     │  ┌───────────────────────────────┐  │
│  │  └────────────────────────────────┘     │  │  ⚠ Failed — 1 section        │  │
│  │                                          │  │  AI Detection: FAILED         │  │
│  │  ▼ Trust Strip                   [✕]    │  │  Intro paragraph flags for    │  │
│  │  ┌────────────────────────────────┐     │  │  perplexity (too predictable) │  │
│  │  │ Stat 1: [2,400+]               │     │  │  and parallel structure       │  │
│  │  │ Label: [Cars Diagnosed]        │     │  │                               │  │
│  │  │ Stat 2: [18]                   │     │  │  Voice Alignment: PASSED      │  │
│  │  │ Label: [Years Experience]      │     │  │                               │  │
│  │  └────────────────────────────────┘     │  │  [Rewrite flagged section]    │  │
│  │                                          │  │  [Override with note]         │  │
│  │  ▼ Problem Grid                  [✕]    │  └───────────────────────────────┘  │
│  │  ▼ FAQ                           [✕]    │                                     │
│  │  ▼ CTA                           [✕]    │  Page: 3 of 8   [← Prev] [Next →]  │
│  │                                          │                                     │
│  │  [+ Add Section]                         │  [Save Draft]   [Submit for Review] │
│  │                                          │  (disabled until SCRVNR cleared)    │
│  └──────────────────────────────────────────┘                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Live preview:** Renders the actual page HTML in real time. Not a mockup. Uses the client's visual DNA (real header DOM, real CSS). As the operator types in the left panel, the preview updates within 300ms.

**SCRVNR status panel:** Always visible in the right panel, below the preview. Does not require navigation. Shows current status for the active page. [Rewrite flagged section] scrolls the left panel to the failing section and highlights it amber. [Override with note] opens the Override Panel (same design pattern as token overrides).

**[Submit for Review] button:** Disabled with a tooltip ("SCRVNR must clear first") until both passes succeed. No workaround. Clicking [Override with note] on the SCRVNR failure logs the override and re-enables the submit button — human authority is preserved, but the override is on record.

**Section reordering:** Sections in the left panel have drag handles. Reordering is allowed within the template's constraints (Hero always first, CTA always last — enforced).

---

## 10. SCRVNR Status Panel — Expanded View

When SCRVNR is processing (can be opened full-width if the operator wants to watch):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SCRVNR Processing — BMW Extension, Common Problems Page                        │
│  ──────────────────────────────────────────────────────────────────────────     │
│                                                                                 │
│  PASS 1 — AI DETECTION DEFENSE                        ⚠ FAILED                 │
│                                                                                 │
│  Perplexity score:  0.41  (target: >0.55)    ██████░░░░  Low predictability?   │
│  Burstiness score:  0.68  (target: >0.60)    ████████░░  ✓ Sufficient variance  │
│  AI phrase flags:   3     (target: 0)        ░░░░░░░░░░  ✗ Flagged phrases     │
│  Structural tells:  2     (target: 0-1)      ██░░░░░░░░  ✗ Parallel overuse    │
│                                                                                 │
│  Flagged Sections:                                                              │
│  ┌─ Intro Paragraph ──────────────────────────────────────────────────────┐    │
│  │  "BMW electrical systems are known for their complexity and             │    │
│  │  sophistication, presenting unique challenges for vehicle owners        │    │
│  │  and technicians alike. Understanding these systems is crucial for..."  │    │
│  │                                                                          │    │
│  │  Issues: high perplexity (predictable phrasing), flagged phrase         │    │
│  │  "unique challenges," parallel list pattern in follow-on paragraph      │    │
│  │                                                    [Rewrite Section]    │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────      │
│                                                                                 │
│  PASS 2 — VOICE ALIGNMENT (gad-main)                  ✓ PASSED                 │
│                                                                                 │
│  Reading level:     8.1   (target: 7–9)      ████████░░  ✓                     │
│  Contraction rate:  41%   (target: 35–45%)   ████████░░  ✓                     │
│  Specificity:       High  (target: High)     ██████████  ✓                     │
│  Native phrases:    2 detected               ████░░░░░░  ✓                     │
│                                                                                 │
│                                                                                 │
│  Fix the flagged section and resubmit. Only the revised section will re-score. │
│                                                                       [Close]   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Live Sites — Status Board

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WEBSITE STUDIO                                            [+ New Site]         │
│  Overview   DNA Lab   Build Queue   Live Sites                                  │
│                                    ──────────                                   │
│                                                                                 │
│  Live Sites (3)           Filter: [ All Tiers ▾ ] [ All Brands ▾ ] [⚠ Alerts] │
│                                                                                 │
│  ┌────────────────────────────────────────────────┐                             │
│  │  ● LIVE            [T1] Audi Extension          │   [Visit] [Redeploy] [⋮]  │
│  │  audi.germanautodoctorsimivalley.com            │                             │
│  │  Deployed: Feb 12, 2026   SSL: ✓   DNS: ✓      │                             │
│  │  [░░░░░░░░░░] Traffic data pending GSC connect  │                             │
│  └────────────────────────────────────────────────┘                             │
│                                                                                 │
│  ┌────────────────────────────────────────────────┐                             │
│  │  ● LIVE            [T3] Quattro Authority       │   [Visit] [Redeploy] [⋮]  │
│  │  quattroauthority.com                           │                             │
│  │  Deployed: Feb 16, 2026   SSL: ✓   DNS: ✓      │                             │
│  │  [████████░░] 140 sessions / 30d (GSC)          │                             │
│  └────────────────────────────────────────────────┘                             │
│                                                                                 │
│  ┌────────────────────────────────────────────────┐                             │
│  │ ▐ STALE            [T2] Branded Satellite       │   [Visit] [Redeploy] [⋮]  │
│  │  germanautodoctoroakpark.com                    │                             │
│  │  Deployed: Oct 3, 2025   SSL: ✓   DNS: ✓       │                             │
│  │  ⚠ Last deploy: 138 days ago (threshold: 90d)  │                             │
│  └────────────────────────────────────────────────┘                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Staleness flagging:** Left border turns amber on sites past the staleness threshold. Not an error — an advisory. Suggests content refresh.

**[⋮] overflow menu:** View in Vercel, Edit DNS settings, Change staleness threshold, Archive, Delete (requires typed confirmation for delete).

**[⚠ Alerts] filter toggle:** When active, shows only sites with issues — SSL expiry, DNS failure, staleness, deploy errors.

---

## 12. Domain Registry Entry — Detail View

Accessible from the Domains tab in the main client card, or via [View in Registry] from any live site card.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Domain Registry — quattroauthority.com                                         │
│  ─────────────────────────────────────────────────────────────────────────────   │
│                                                                                 │
│  ┌─ Identity ─────────────────────────────────────────────────────────────┐     │
│  │  Domain:         quattroauthority.com                                   │     │
│  │  Tier:           [T3] Pure Satellite                                    │     │
│  │  Client:         German Auto Doctor                                     │     │
│  │  Brand/Segment:  Audi                                                   │     │
│  │  Registered by:  GHM (owned)                                            │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ┌─ Infrastructure ───────────────────────────────────────────────────────┐     │
│  │  Vercel Project:  ghm-gad-audi-t3                                       │     │
│  │  Deploy Status:   ● Live                                                │     │
│  │  Last Deploy:     Feb 16, 2026 at 2:14 PM                               │     │
│  │  SSL:             ✓ Valid (expires Aug 2026)                            │     │
│  │  DNS:             ✓ Verified                                            │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ┌─ DNA Sources ──────────────────────────────────────────────────────────┐     │
│  │  Visual DNA:     quattroauthority-design (custom, not extracted)        │     │
│  │  Voice Profile:  quattro-authority.json                                 │     │
│  │  SCRVNR Gate:    Active on all pages                                    │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ┌─ Deploy History ───────────────────────────────────────────────────────┐     │
│  │  Feb 16, 2026  ● Success   D. Kirsch   8 pages deployed                │     │
│  │  Feb 14, 2026  ✗ Failed    D. Kirsch   DNS misconfiguration             │     │
│  │  Feb 14, 2026  ● Success   D. Kirsch   Initial deploy (index only)     │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  [Open in Website Studio]   [View in Vercel]   [Edit DNS]                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interaction Summary — Key Behaviors

**Matrix cell hover (gap state):** Cell blooms with tier-color tint. Opportunity data appears: estimated monthly searches, competitor count, recommended tier. "+" becomes "Start Build" label.

**Matrix cell click (gap):** Opens New Site Initiation modal pre-filled with the brand and tier from that cell.

**Matrix cell click (live):** Opens the Live Sites view filtered to that property.

**Matrix cell click (in-progress):** Opens Build Queue filtered to that build.

**Permission-locked actions:** Always visible, always disabled. Hover tooltip: "You don't have permission to [action]. Contact your account owner." Never hidden — visibility drives upgrade behavior.

**Deployment animation:** When a site goes live, its matrix cell transitions from yellow in-progress to solid green with a brief fill animation — a single deliberate visual event marking the milestone.

**SCRVNR override flow:** Override is always available as an escape valve. But it requires a note, it's timestamped, and it appears in the audit trail visible to reviewers. Override is respected; it is not invisible.

---

**Document status:** Complete v1.0
**Build from this document.** Do not improvise UI decisions not covered here — open a planning session to add them first.
