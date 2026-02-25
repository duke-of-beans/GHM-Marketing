# GHM DASHBOARD — SPRINT 7 HANDOFF
**Generated:** February 24, 2026
**For:** Next fresh Claude session
**Project path:** `D:\Work\SEO-Services\ghm-dashboard`

---

## MANDATORY BOOTSTRAP (do this first, no exceptions)

```
1. Filesystem:read_file  D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
2. Filesystem:read_file  D:\Work\SEO-Services\ghm-dashboard\STATUS.md        (first 80 lines)
3. Filesystem:read_file  D:\Work\SEO-Services\ghm-dashboard\BACKLOG.md
4. Filesystem:read_file  D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md     (first 60 lines)
```

Output the BUSINESS SESSION INITIALIZED verification block before touching any code.

**Sync, commit, push rule:** Always docs-first. Close items in STATUS.md + BACKLOG.md + CHANGELOG.md, update Last Updated header, THEN git add/commit/push. Never just git.

---

## WHERE WE ARE

**Last commit:** `5af8e44` — Sprint 6 complete and pushed to main.

**Sprint history (all shipped):**
- Sprints 1–4: Security, Client Portal, Bulk Ops, Intelligence Layer
- Sprint 5: Data Export (leads + clients CSV) + User Activity admin tab
- Sprint 6: Search bar portal fix (UX-BUG-007), Team Feed modifier key (UX-BUG-008), Pipeline filter debt (deal value slider, days in stage, lead source), Keyboard shortcuts system (? overlay, G+key nav)

**Active UX bugs still open (not Sprint 7 scope, but note them):**
- UX-BUG-001: Click-outside closes search bar (~30 min, easy)
- UX-BUG-002: Search bar inline expansion (still modal approach, marked as open)
- UX-BUG-003/004/005: Payments Wave graceful degradation, nav scroll, nav group rename

---

## SPRINT 7 SCOPE

Sprint 7 is "Sales Enablement Polish" per the backlog sprint table. Three items:

### 7A — Save Searches (Pipeline)
Users can save a named filter preset on the Leads pipeline page and recall it from a dropdown. This is a power-user feature — reps who work the same segment daily (e.g., "Tier A in Texas, unassigned") shouldn't have to re-configure filters every session.

**Implementation path:**
- Schema: `SavedSearch` model — `id, userId, name, filtersJson, createdAt`. Scoped per user.
- API: `GET /api/saved-searches` (list mine), `POST /api/saved-searches` (save current), `DELETE /api/saved-searches/[id]`
- UI: Small "Save" button in the filter bar header (next to "Clear all"). Clicking it prompts for a name (inline input or tiny popover). A "Saved Searches" dropdown in the filter bar loads presets. Applying a preset overwrites current filter state. Deleting from the dropdown removes it.
- State: when a saved search is active, show its name as a badge in the filter bar header (replacing "X active filters").
- Files: `src/components/leads/lead-filter-bar-advanced.tsx`, `prisma/schema.prisma`, new API route

**Size:** ~1.5 hrs

---

### 7B — Audit PDF: PPC / Google Ads Section

The existing audit PDF (generated from `scripts/generate-audit.ts` or similar, rendered via a template) needs a Google Ads / PPC section added. This section surfaces the value prop for paid advertising management — it's part of ITEM-001 scope (full PPC/Ads language already in `CLIENT_AGREEMENT.md`).

**What the section should include:**
- Google Ads account status (connected vs not — pull from existing GBP/Ads integration state)
- Current monthly ad spend (if connected) or "No active campaigns detected"
- Estimated missed clicks from no/underperforming paid presence (formula: industry CPC × search volume estimate from existing review/rating data as proxy)
- Recommendation block: campaign type suggestion (Local Services Ads vs Search vs both), budget range, expected CTR vs organic
- CTA: "Request a free PPC audit" with the agency's contact

**Files to check first:**
- Find the audit generation logic: search `src` for `generate-audit` or `audit-pdf` or `AuditReport`
- Check `src/components/leads/lead-detail-sheet.tsx` for the "Audit + Demo" button wired in Sprint 1 (`handleGenerateAll`)
- The audit template is likely in `src/lib/audit/` or similar

**Size:** ~1.5 hrs once files are located

---

### 7C — Brochure PDF: PPC Version

Separate from the audit — a one-page agency brochure (leave-behind / proposal doc) that emphasizes the PPC/paid search offering. Currently the brochure template exists but likely only covers SEO services. This adds a variant or appends a PPC page.

**What it needs:**
- Value prop paragraph: why paid + organic together outperforms either alone
- Services offered: Local Services Ads, Google Search Ads, campaign management, monthly reporting
- Pricing/engagement structure (reference `CLIENT_AGREEMENT.md` §1.1 for the language that's already approved)
- One visual: a simple before/after or funnel diagram (SVG inline or placeholder)
- Same brand/style as existing brochure

**Files:** Find the brochure template — search for `brochure` or `proposal` in `src/lib/` or `scripts/`

**Size:** ~1 hr once template is located

---

## KEY FILES TO KNOW

```
src/components/leads/lead-filter-bar-advanced.tsx   — filter bar (Sprint 6 updated)
src/app/(dashboard)/leads/client.tsx                — leads page, filteredLeads memo
src/app/(dashboard)/leads/page.tsx                  — server component, DB query + serialization
src/components/dashboard/DashboardLayoutClient.tsx  — layout, keyboard shortcuts wired
src/hooks/use-modifier-key.ts                       — OS-aware modifier key hook
src/hooks/use-keyboard-shortcuts.ts                 — NEW Sprint 6
src/components/ui/keyboard-shortcuts-help.tsx       — NEW Sprint 6
src/components/search/AISearchBar.tsx               — search bar with portal
src/components/team-feed/TeamFeedSidebar.tsx        — sidebar feed
prisma/schema.prisma                                — data model
```

---

## BACKLOG ITEMS ADDED THIS SESSION (not Sprint 7, but note them)

- **FEAT-014:** PM Platform Import (Basecamp, Asana, Monday, ClickUp) — full spec in BACKLOG.md
- **UX-FEAT-001:** Lead gen filter bar presentation overhaul — the default visible state undersells the intelligence system. Needs hierarchy rework to lead with Tier, Impact Score, Close Likelihood. Spec in BACKLOG.md under `## 🟠 SHOULD`.

---

## STANDARD SYNC PROTOCOL (reminder)

Every session end:
1. Close completed items in STATUS.md (check them off)
2. Delete shipped items from BACKLOG.md, add rows to CHANGELOG.md
3. Update `Last Updated:` header in both files
4. `git add -A; git commit -m "feat: Sprint 7 — [summary]"`
5. `git push`

---

## OPEN QUESTIONS FOR SPRINT 7

Before starting 7B/7C, locate the audit/brochure generation files — they may be in `scripts/`, `src/lib/`, or a separate directory. Search for `audit`, `brochure`, `pdf`, `proposal` across the repo first. If the PDF generation uses a different pattern than expected, adjust scope accordingly.

For 7A (Save Searches), run `npx prisma migrate dev --name add_saved_searches` after schema change, verify zero new TS errors before proceeding to UI.
