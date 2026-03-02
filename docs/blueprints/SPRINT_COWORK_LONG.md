# COVOS — Cowork Long Sprint
**Authored:** March 2, 2026
**Status:** READY TO EXECUTE
**Estimated size:** ~3–4 sessions (parallelized)
**Source tickets:** Sprint 30 (UX-FEAT-002 + UX-AUDIT-027 + FEAT-035) + Sprint 33 (FEAT-034 + FEAT-039)

---

## Model Assignment Guide

| Model | Best For |
|-------|----------|
| **Claude Sonnet 4.6** (default) | Architecture decisions, complex component logic, state systems, API design, writing new hooks |
| **Claude Haiku 4.5** | Mechanical search-and-replace, token migrations, contrast value lookups, CSS-only changes, file list generation |
| **Claude Opus 4.6** | Only if a task requires deep synthesis across 10+ files simultaneously or cross-cutting architectural judgment — flag explicitly |

All tasks below are annotated with `[Sonnet]`, `[Haiku]`, or `[Opus]`.

---

## Phase 1 — Parallel Foundation (No dependencies — all can run simultaneously)

### 1-A · TeamFeed Panel Resize + Two-Pane Layout [Sonnet]
**Ticket:** UX-FEAT-002 (partial)
**Files:** `src/components/team-feed/TeamFeedSidebar.tsx`, `src/components/layout/DashboardLayoutClient.tsx`

Build the structural upgrade to TeamFeed as a resizable, two-pane communication hub.

**Tasks:**
1. Add a drag handle to the left edge of `TeamFeedSidebar.tsx`. On drag, update a `panelWidth` CSS variable. Constrain: min 280px, max 520px. Persist to `localStorage` key `covos:teamfeed-width`.
2. Split the panel interior into a left column (people/channels strip, 64px fixed) and a right column (message thread, fills remaining width). The people strip shows user avatars with presence dots.
3. Presence system: query `DashboardEvent` for users with an event in the last 5 minutes. Green dot = active, grey = offline. Run a lightweight GET `/api/team/presence` route that returns `{ userId, lastSeen }[]`. Cache at 30s on the client.
4. New API route: `GET /api/team/presence` — admin-gated, returns all users with their most recent `DashboardEvent.createdAt`.
5. Typing indicator: when a user is composing a message, fire a debounced `POST /api/team-messages/typing` (fire-and-forget, no DB write). GET `/api/team-messages/stream` should include typing events via SSE as a new event type `typing`. Client renders "X is typing…" at bottom of message pane, auto-clears after 4s.

**Verification:** Drag resize works, width persists on page reload. Presence dots reflect real `DashboardEvent` recency. Typing indicator appears and clears. `tsc --noEmit` — zero new errors.

---

### 1-B · Accessibility Contrast Pass — Signal Palette [Haiku]
**Ticket:** UX-AUDIT-027
**Files:** `src/app/globals.css`, token CSS files from Sprint 23/26

Systematic WCAG AA contrast audit of the Signal palette. This is a lookup-and-patch task — no architecture decisions needed.

**Tasks:**
1. Extract every foreground/background CSS token pair from `globals.css` (light + dark mode). Generate a flat list: `{ token_pair, foreground_hex, background_hex }`.
2. For each pair, compute contrast ratio (use WCAG formula: `(L1 + 0.05) / (L2 + 0.05)` where L = relative luminance). Flag any pair below 4.5:1 (normal text) or 3:1 (large text / UI components).
3. For each failing pair, propose a fix: adjust foreground lightness up/down to meet the threshold. Preserve hue and saturation — only adjust lightness.
4. Apply all fixes to `globals.css`. Write a comment block at the top of the contrast section: `/* WCAG AA verified — March 2026 */`.
5. Priority token pairs to audit first (most user-visible): muted text on dark bg, status badge text on colored backgrounds, sidebar nav items (non-active state), metric card secondary text, chart axis labels.

**Output:** `docs/CONTRAST_AUDIT.md` — table of all checked pairs, pass/fail, fix applied. Reference doc, not required reading.
**Verification:** No visual regressions. All previously-failing pairs now ≥ 4.5:1.

---

### 1-C · Document Vault Preview Modal [Haiku → Sonnet hand-off]
**Ticket:** FEAT-035
**Files:** `src/components/vault/vault-file-tile.tsx`, new `src/components/vault/VaultPreviewModal.tsx`

**Step 1 [Haiku]:** Audit every file type currently uploadable to the vault. Generate a list: `{ mime_type, extension, current_behavior, proposed_preview_behavior }`. Write this to `docs/VAULT_PREVIEW_TYPES.md`. No code yet — just the inventory.

**Step 2 [Sonnet]:** Build `VaultPreviewModal.tsx`. On tile click, open a Dialog instead of triggering download. Modal layout: file name + metadata bar (size, uploader, upload date, space/category) at top. Preview area fills modal body:
- **PDF** → `<iframe src={signedUrl} />` (full height)
- **Images** (jpg/png/gif/webp/svg) → `<img>` with object-fit contain + zoom-on-click lightbox
- **DOCX/XLSX** → Metadata card + "Preview not available" note + Download button as primary CTA
- **Unknown** → Metadata card + Download button

Download button always present in modal footer as secondary action. For Shared space files: show version badge ("Current version" or "Version N") in metadata bar.

**Verification:** All four file type branches render correctly. Original download behavior remains for non-previewable types. Zero new TS errors.

---

### 1-D · Customization Audit Document [Sonnet]
**Ticket:** FEAT-034 (audit phase only — no code)
**Output:** `docs/CUSTOMIZATION_AUDIT.md`

Walk every surface of the platform and produce a ranked, structured customization audit. This is documentation work, not code.

**Structure the output as:**

```
# COVOS Customization Audit — March 2026

## Surface Inventory

For each surface:
- Surface name + location
- Current customization state (none / partial / full)
- Who should own it (user-level / tenant-level / admin-level)
- Recommended UX (how it would work)
- Effort estimate (S/M/L)
- Dependency (if any)
- Verdict (IMPLEMENT / SKIP / DEFER)
```

**Surfaces to audit (minimum):** Dashboard widget visibility, table column chooser (all data tables), sidebar nav pin/reorder, notification preferences per event type, display density toggle (compact/comfortable/spacious), default tab memory per page, quick action slot visibility/order, pipeline stage visibility/order (tenant), keyboard shortcut reference page, theme accent color per user, report section toggles, lead filter defaults per user, client portfolio default sort/view, TeamFeed panel width (already shipping in 1-A), content studio default view.

**At the end:** Priority ranking table — top 5 highest-ROI customizations to build next, with effort-to-impact scores.

---

## Phase 2 — Sequential (Phase 1 must complete first)

### 2-A · Guide Character — Phase 1 [Sonnet]
**Ticket:** FEAT-039
**Depends on:** Phase 1 complete (no hard dependency, but 2-A benefits from knowing CUSTOMIZATION_AUDIT.md surface list)
**Files:** New `src/components/guide/GuideCharacter.tsx`, `src/components/guide/guide-config.ts`, `src/app/(dashboard)/layout.tsx`

Build the reactive guide character system. Phase 1 is static — pre-written tips, reactive triggers only. No AI calls yet.

**Architecture:**

```
guide-config.ts — maps page routes to guide tips:
{
  "/leads": [
    { trigger: "idle_60s", message: "Still deciding? Try filtering by Tier A." },
    { trigger: "repeated_visit_no_action", message: "You've been here three times. That lead isn't going to close itself." }
  ],
  ...
}
```

**Trigger system:**
- `idle_60s`: user has been on the page 60+ seconds with no click/scroll/keystroke
- `repeated_visit_no_action`: user has visited this route 3+ times in the current session without completing the primary action (defined per-route in config)
- `empty_state`: primary data container on page is empty (injected via a `data-guide-empty="true"` attribute on the container)
- `first_visit`: user has never visited this route (check `localStorage` key `covos:visited:[route]`)

**Component:**
- Fixed bottom-right position. Small avatar (32×32, use the face sketch placeholder from David's Covos logo work — or a simple CSS-drawn face circle as placeholder until assets arrive).
- On trigger: speech bubble slides up from avatar with the contextual tip. Deadpan sardonic voice matching platform tone.
- Dismiss on click anywhere or after 8 seconds. Dismissed tips don't repeat in the same session.
- "Don't show these" toggle in Settings → Preferences (add to GeneralSettingsTab, new `guideEnabled` boolean on User, PATCH `/api/users/me/preferences`).

**Content:** Write sardonic tip text for these pages minimum: `/leads`, `/clients`, `/analytics`, `/settings`, `/vault`, `/tasks`, first-visit to any page.

**Verification:** Character appears on idle trigger, disappears on dismiss, doesn't repeat dismissed tips, is toggleable from Settings. Zero new TS errors.

---

### 2-B · TeamFeed Presence + Notification Polish [Sonnet]
**Ticket:** UX-FEAT-002 (completion pass)
**Depends on:** 1-A (presence route must exist)
**Files:** `src/components/team-feed/TeamFeedSidebar.tsx`, `src/app/api/team-messages/stream/route.ts`

Close out the TeamFeed overhaul with the polish layer:

1. **Unread count badge** on the TeamFeed toggle button in the nav. When panel is closed and a new message arrives via SSE, increment a `unreadCount` state. Badge shows count. Clears on panel open.
2. **Subtle accent dot** on the TeamFeed nav icon when there are unread messages (indigo dot, 6px, top-right of icon).
3. **Smooth panel open/close animation** — CSS transition `width` from 0 to saved width. Easing: `ease-out 200ms`. Panel content fades in after slide completes (200ms delay on opacity).
4. **@mention notifications** — already built in Sprint 21-B. Verify that mentioned users receive an in-app notification that links to the specific message. If the notification `href` is missing or wrong, fix it.
5. **Mobile**: on viewports < 768px, TeamFeed renders as a bottom sheet (full-width, slides up from bottom, height 70vh). Drag-to-dismiss. Panel width localStorage is ignored at this breakpoint.

**Verification:** Badge increments correctly, clears on open. Animation is smooth. Mobile bottom sheet works. Zero new TS errors.

---

### 2-C · Top 3 Customization Items from Audit [Sonnet]
**Ticket:** FEAT-034 (implementation phase)
**Depends on:** 1-D (CUSTOMIZATION_AUDIT.md must be complete)
**Scope:** Implement the top 3 highest-ROI, lowest-effort items from the customization audit ranking table. The exact items are determined by the audit output, but based on current state the likely candidates are:

**Likely item 1 — Display Density Toggle:**
Add `density: "compact" | "comfortable"` to `GlobalSettings` (or `User` preferences). CSS: inject `data-density` attribute on `<body>`. Define compact overrides in `globals.css` (reduce `py` padding on table rows, reduce card padding, tighten metric card line-height). Toggle in Settings → General. Default: comfortable.

**Likely item 2 — Default Tab Memory:**
For pages with tab bars (`/clients`, `/settings`, `/tasks`, `/vault`), persist the last-active tab to `localStorage` key `covos:tab:[route]`. On mount, initialize tab state from localStorage before falling back to URL param.

**Likely item 3 — Table Column Chooser (Leads table):**
Add a column visibility control to the leads pipeline table. Button: "Columns" with `Columns` icon. Dropdown checklist of available columns. Persist selections to `localStorage` key `covos:leads-columns`. Hideable columns (non-hideable: Name, Status, Actions): Tier, Impact Score, Close Likelihood, Territory, Assigned Rep, Last Activity, Source.

Each item should be fully implemented and verified individually. If the audit reveals higher-ROI alternatives, use those instead — the above is an educated pre-audit estimate.

**Verification per item:** Feature works, state persists on reload, zero new TS errors.

---

## Phase 3 — Final Gate

### 3-A · TypeScript Clean + Docs Sync [Haiku]
**Runs after all Phase 2 tasks are complete.**

1. Run `npx tsc --noEmit`. Confirm only the 5 pre-existing basecamp/dotenv errors. Zero new errors across all sprint work. If new errors exist, fix before proceeding.
2. Update `STATUS.md`: close all completed items, update "Last Updated" header with today's date and a sprint summary line.
3. Update `BACKLOG.md`: remove all items that shipped in this sprint. Zero ✅ entries should remain.
4. Confirm `CHANGELOG.md` has an entry for each shipped item (date + commit hash placeholder + summary).

### 3-B · Sync, Commit, Push [Haiku]
**After 3-A is verified clean.**

```
git add -A
git commit -m "Sprint Cowork: TeamFeed overhaul, contrast audit, vault preview, guide character Phase 1, customization layer"
git push origin main
```

Monitor Vercel deployment. Confirm no build failures. Log deployment URL to STATUS.md.

---

## Dependency Graph

```
Phase 1 (all parallel):
  1-A TeamFeed Resize/Pane  ──────────┐
  1-B Contrast Audit        ──────────┤──► Phase 2
  1-C Vault Preview         ──────────┤
  1-D Customization Audit   ──────────┘

Phase 2 (sequential, but 2-A/2-B/2-C can overlap after Phase 1):
  2-A Guide Character       (independent of 2-B, 2-C)
  2-B TeamFeed Polish       (depends on 1-A presence route)
  2-C Customization Impl    (depends on 1-D audit output)

Phase 3:
  3-A TS Clean + Docs       (after all Phase 2 done)
  3-B Git Sync              (after 3-A)
```

---

## File Touch Summary

**New files:**
- `src/components/team-feed/` — presence dot styles
- `src/components/vault/VaultPreviewModal.tsx`
- `src/components/guide/GuideCharacter.tsx`
- `src/components/guide/guide-config.ts`
- `src/app/api/team/presence/route.ts`
- `src/app/api/team-messages/typing/route.ts`
- `docs/CONTRAST_AUDIT.md`
- `docs/VAULT_PREVIEW_TYPES.md`
- `docs/CUSTOMIZATION_AUDIT.md`

**Modified files:**
- `src/components/team-feed/TeamFeedSidebar.tsx` — resize, two-pane, typing, presence
- `src/components/vault/vault-file-tile.tsx` — trigger preview instead of download
- `src/app/(dashboard)/layout.tsx` — mount GuideCharacter
- `src/components/settings/GeneralSettingsTab.tsx` — density toggle, guide toggle
- `src/app/globals.css` — contrast patches, density tokens
- `STATUS.md`, `BACKLOG.md`, `CHANGELOG.md`

---

## Critical Constraints (Always Active)

- `prisma db push` only — never `migrate dev`
- `npx tsc --noEmit` must pass before any git
- Zero mocks, stubs, or placeholders in shipped code
- Docs first, then git (per SYNC_PROTOCOL.md)
- Pre-existing 5 errors (scripts/basecamp/dotenv) are expected — do not touch
