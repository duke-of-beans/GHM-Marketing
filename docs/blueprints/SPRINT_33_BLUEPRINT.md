# SPRINT 33 — CUSTOMIZATION AUDIT BLUEPRINT
## Single instance, documentation sprint
**Date:** March 1, 2026
**Project:** D:\Work\SEO-Services\ghm-dashboard
**Output:** `docs/CUSTOMIZATION_AUDIT.md`

---

## Mission
Produce a comprehensive, ranked audit of every configurable surface across the GHM/COVOS platform. This is a **document sprint only** — no code changes, no schema changes, no component changes. The output is a spec that will drive multiple future implementation sprints.

Guide Character (FEAT-039) is **excluded** from this sprint — it requires David's character design assets. This sprint covers FEAT-034 only.

---

## What "Done" Looks Like
A single file `docs/CUSTOMIZATION_AUDIT.md` exists, committed, and pushed. It is comprehensive enough that a future Cowork agent can read it and know exactly what to build for any customization feature without asking any clarifying questions. No code was modified.

---

## Audit Scope — Every Surface To Examine

For each surface below, the agent reads the relevant source files and determines:
1. **Current state** — is this customizable today? If yes, how and where is it stored?
2. **Proposed UX** — what would the customization look like? (user-level settings panel? tenant-level admin config? per-page toggle?)
3. **Storage** — `localStorage` for cosmetic/session, `UserSettings`/`GlobalSettings` DB for persistent, `TenantConfig` for tenant-level
4. **Scope** — per-user / per-tenant / global
5. **Effort** — S (< 2 hrs) / M (2–8 hrs) / L (8+ hrs)
6. **Priority recommendation** — Must / Should / Would / Future

### SECTION 1: Dashboard Widgets
- Widget visibility (add/remove/show/hide, not just rearrange)
- Widget order/arrangement (drag-and-drop — is it working? persisted correctly?)
- Default widget layout per role (admin vs manager vs sales first-login defaults)
- Widget density toggle (compact / comfortable / spacious)

### SECTION 2: Data Tables
Audit each table: `portfolio.tsx`, `PaymentsOverview`, `leads/client.tsx`, `DataImportTab` preview, `BillingTab`
For each: column show/hide, column order, column width persistence, saved sort preference

### SECTION 3: Navigation
- Sidebar group collapse/expand (currently localStorage — working for all groups?)
- Sidebar item pin/unpin
- Sidebar group reorder
- Nav item badges (unread counts — present? configurable?)
- Default landing page per role

### SECTION 4: Notification Preferences
Audit `src/components/settings/GeneralSettingsTab.tsx` and `src/lib/notifications/`:
- What notification types exist?
- Can users toggle individual types (push vs in-app vs email)?
- What's missing? Propose a complete preference matrix.

### SECTION 5: Page-Level Defaults
Per major page — what filters/views/sorts can be remembered:
- Leads: saved filter as default, kanban sort, default view
- Clients: sort, view (table vs card), active filters
- Tasks: status filter, sort, assignee filter
- Analytics: date range, metric focus
- Vault: space tab, sort

### SECTION 6: Display Preferences
- Theme (light/dark) — in GeneralSettingsTab, working?
- Language/locale — any hook in place?
- Date format (MM/DD vs DD/MM)
- Currency format (formatCurrency — locale-aware?)
- Compact vs comfortable spacing
- Table row density

### SECTION 7: Quick Actions
- Which quick actions appear on manager/sales dashboards
- Order of quick actions
- Custom quick action (external URL or internal page link)

### SECTION 8: Pipeline Customization (Tenant-Level)
- Pipeline stage names — can tenants rename? (currently hardcoded enum)
- Stage colors — configurable?
- Lead tier labels (Tier A/B/C) — renameable?
- Custom lead fields — any mechanism?

### SECTION 9: Keyboard Shortcuts
- List all current shortcuts from `src/hooks/use-keyboard-shortcuts.ts`
- Shortcut reference overlay — shipped Sprint 6, confirm it works
- User remapping — worth building?

### SECTION 10: Content Studio Preferences
- Default template/format for new briefs
- Default AI tone for content generation
- Default section visibility

### SECTION 11: Report Preferences
- Default sections included in client reports
- Default report schedule (day/frequency)
- Preferred report format per client (monthly vs quarterly default)

---

## Document Structure

`docs/CUSTOMIZATION_AUDIT.md` must follow this structure:

```markdown
# COVOS PLATFORM — CUSTOMIZATION AUDIT
**Date:** March 2026
**Status:** Complete — drives Sprint 34+ implementation
**Scope:** Every configurable surface across GHM Dashboard v32

## Executive Summary
[2-3 paragraphs: what exists today, biggest gaps, recommended sequence]

## Priority Matrix
[Table: Surface | Current State | Scope | Effort | Priority | Sprint Target]

## Section 1: Dashboard Widgets
[Per subsurface: Current State / Proposed UX / Storage / Scope / Effort / Priority]

...all 11 sections...

## Implementation Sequence (Recommended)
[Ordered list with rationale]
```

---

## Source Files To Read (In Order)
Read-only — do not modify any of these.

```
src/components/dashboard/DashboardLayoutClient.tsx
src/components/dashboard/dashboard-widgets.tsx
src/hooks/use-keyboard-shortcuts.ts
src/components/layout/ (list, find nav/sidebar file)
src/components/settings/GeneralSettingsTab.tsx
src/components/settings/CompensationTab.tsx
src/components/clients/portfolio.tsx
src/app/(dashboard)/leads/client.tsx
src/app/(dashboard)/tasks/page.tsx
src/components/analytics/analytics-dashboard.tsx
src/components/vault/vault-client.tsx
src/lib/notifications/ (list directory)
src/types/index.ts
src/hooks/use-dashboard-event.ts
prisma/schema.prisma (UserSettings + GlobalSettings models)
src/lib/format.ts
```

---

## Quality Gates
1. `docs/CUSTOMIZATION_AUDIT.md` exists and is >200 lines
2. All 11 sections present and substantive
3. Priority Matrix covers every surface examined
4. No source files were modified (git diff shows only docs/ changes)
5. Git clean after commit

## Stopping Conditions
- Source file not found → note "NOT FOUND" and continue with remaining sections
- Do not infer contents without reading the file

## Commit Message
`docs: CUSTOMIZATION_AUDIT.md — comprehensive personalization surface audit (FEAT-034)`

## Docs Sync
1. Delete `FEAT-034` from BACKLOG.md
2. Add to CHANGELOG.md: `| March 2026 | [hash] | FEAT-034: CUSTOMIZATION_AUDIT.md — 11-section surface audit |`
3. Update STATUS.md Last Updated header
4. `git add -A && git commit -m "docs: Sprint 33 customization audit complete" && git push`
