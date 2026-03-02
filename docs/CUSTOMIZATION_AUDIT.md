# COVOS Customization Audit — March 2026

**Status:** AUDIT COMPLETE  
**Author:** Claude (Cowork Sprint)  
**Last Updated:** March 2, 2026  
**Next step:** Implement top 3 items from priority table

---

## Executive Summary

This audit catalogs every user-facing surface in the COVOS agency intelligence dashboard and evaluates which customization options should be available to end users, tenants, and admins. The platform spans lead management, client operations, task workflows, analytics, content creation, team collaboration, and financial tracking.

Current state: The platform has minimal user-level customization (theme toggle, tour reset, basic notification controls). Most surfaces are static or tenant-wide only. Significant ROI opportunities exist in table column selection, display density control, and memory-based UX (default tabs, saved filters).

---

## Surface Inventory

### 1. Dashboard Widget Visibility

**Location:** Master dashboard (`/` or `/sales` / `/manager`)  
**Current state:** All widgets always visible; no toggle mechanism  
**Owner:** User-level  
**Recommended UX:**  
Per-user toggle list in Settings > Display where users can show/hide widgets: MetricsRow (KPI cards), PipelineFunnel (Sankey), RepLeaderboard (team standings), MyTasks (assigned tasks), TeamActivity (feed updates), ContentQueue (pending studio items), etc. State persists to user preferences via localStorage with backend sync.

**Effort:** M (2–3 days)  
**Dependency:** User preferences endpoint; requires schema extension  
**Verdict:** IMPLEMENT

---

### 2. Table Column Chooser — Leads Pipeline

**Location:** `/leads` — Kanban and table views  
**Current state:** Fixed columns (lead name, phone, pipeline stage, owner, created); no toggle  
**Owner:** User-level  
**Recommended UX:**  
Click gear icon or "Columns" button in table header; modal/popover shows checkbox list of available columns (phone, email, website, estimated value, tags, last contact, notes, custom fields). Drag to reorder priority. Saved to localStorage with optional backend sync. Kanban view respects column visibility for detail cards.

**Effort:** M (2–3 days)  
**Dependency:** Table header component refactor; no backend required (localStorage-first)  
**Verdict:** IMPLEMENT

---

### 3. Table Column Chooser — Clients Portfolio

**Location:** `/clients` — portfolio table view  
**Current state:** Fixed columns (client name, status, industry, owner, live projects, created); no toggle  
**Owner:** User-level  
**Recommended UX:**  
Identical pattern to leads: column chooser modal in table header with toggle/reorder. Include columns: status, industry, city, website, monthly spend, contract end, tags, custom fields. Persists to user preferences.

**Effort:** M (2–3 days)  
**Dependency:** Shared column-chooser component (reusable with leads)  
**Verdict:** IMPLEMENT

---

### 4. Sidebar Navigation Pin/Reorder

**Location:** `/` — desktop sidebar nav groups (Prospects, Clients, Insights, Finance, Resources)  
**Current state:** Hardcoded group order; individual groups collapsible and state persisted to localStorage; no reorder or pinning  
**Owner:** User-level  
**Recommended UX:**  
Add drag-and-drop to reorder nav groups (within role constraints). Optional: pin/unpin to collapse groups away. Groups marked as pinned stay at top; unpinned groups collapse when not in use. Saved to user preferences. Consider long-term: favorite links / custom shortcuts.

**Effort:** L (3–5 days — drag-and-drop complexity, edge cases)  
**Dependency:** User preferences endpoint; drag-and-drop library (react-beautiful-dnd or react-dnd)  
**Verdict:** DEFER (MEDIUM ROI; complexity not justified for initial release)

---

### 5. Notification Preferences — Per-Event Type

**Location:** `/settings` — General Settings tab (notification section)  
**Current state:** Tenant-wide toggle for "Team Messages" and "Task Assignments"; no per-user or per-event-type granularity  
**Owner:** User-level (with tenant-level defaults)  
**Recommended UX:**  
Expand notification settings card to show granular toggles: Team Messages (all / assigned me / @mentions only), Task Assignments (all / assigned me only), Client Portfolio Updates (all / my clients only), Lead Stage Changes (all / my leads only), Document Vault Shares, Recurring Task Reminders. Each has sub-options (email + push / push only / none). Persists to user preferences.

**Effort:** M (2–3 days)  
**Dependency:** Notification event taxonomy; backend route to save per-event settings  
**Verdict:** IMPLEMENT

---

### 6. Display Density Toggle

**Location:** Global setting (header or settings); affects all tables and card layouts  
**Current state:** None; all rows and cards use "comfortable" spacing (current Tailwind sizing)  
**Owner:** User-level  
**Recommended UX:**  
Toggle or dropdown in header (or Settings > Display): Compact / Comfortable / Spacious. Compact: reduces padding, smaller font, tighter row height (saves ~2–3 visible rows per screen). Spacious: larger padding, bigger touch targets. Affects table rows, card grids, modal content. Saved to localStorage; syncs to user preferences on backend.

**Effort:** S (1–2 days — mostly CSS/Tailwind class swaps)  
**Dependency:** None; localStorage-first implementation  
**Verdict:** IMPLEMENT (HIGH ROI; single CSS toggle affects entire platform)

---

### 7. Default Tab Memory — Per Page

**Location:** Multi-tab pages: `/clients` (Portfolio / Favorites / Archived), `/settings` (General / Branding / Team / Permissions / Billing), `/tasks` (My Tasks / Assigned to Me / Recurring), `/vault` (Documents / Shared with Me / Archived)  
**Current state:** No memory; always opens to first tab on page load  
**Owner:** User-level  
**Recommended UX:**  
Save last active tab per page to localStorage when user clicks a tab. On return to that page, auto-switch to last tab. Simple; no UI change needed. If user bookmarks a tab-specific deep link (e.g., `/settings#permissions`), honor that over stored preference.

**Effort:** S (< 1 day — localStorage + useEffect)  
**Dependency:** None  
**Verdict:** IMPLEMENT (HIGHEST ROI; zero-effort friction reduction)

---

### 8. Pipeline Stage Visibility/Order

**Location:** `/leads` — Kanban board (stage columns)  
**Current state:** All pipeline stages visible in fixed order (Discovery, Qualified, Proposal, Negotiation, Won, Lost); no hide or reorder  
**Owner:** Tenant-level (admin can set defaults; users can override per-session)  
**Recommended UX:**  
Gear icon on Kanban header opens modal: checkbox list of all pipeline stages with drag-to-reorder. Tenant admin can set default visibility/order in Settings > Pipeline. Individual users can customize per-session (saved to sessionStorage or temporary localStorage key). Hidden stages collapse but count still visible in summary.

**Effort:** M (2–3 days)  
**Dependency:** Pipeline stage schema; user/tenant preferences endpoints  
**Verdict:** IMPLEMENT (HIGH ROI for power users; medium complexity)

---

### 9. Keyboard Shortcut Reference Page

**Location:** Discoverable from help menu (/help/shortcuts or ⌘ / Ctrl+?); accessible from HelpMenu component  
**Current state:** No global shortcut system; only browser defaults  
**Owner:** Platform-level  
**Recommended UX:**  
Modal/page showing all available keyboard shortcuts grouped by context (Navigation, Lead Management, Task Management, etc.): e.g. "Ctrl+K" = focus search, "Ctrl+Enter" = submit form, "G then L" = go to leads, "T" = new task. Keyboard handler library (e.g., useHotkeys) captures and routes. Shortcuts preference: enable/disable globally in Settings.

**Effort:** L (3–5 days — full keyboard handler system)  
**Dependency:** Keyboard event library; shortcut definition spec  
**Verdict:** DEFER (LOW ROI for current user base; high effort; target v2)

---

### 10. Theme Accent Color — Per User

**Location:** Settings > Appearance; or brand settings  
**Current state:** Single COVOS indigo accent (--primary: indigo-600) for entire platform; theme toggle (light/dark) only  
**Owner:** User-level or Tenant-level  
**Recommended UX:**  
Color picker in Settings > Appearance where users (or tenant admin) select accent color (indigo, blue, purple, amber, teal, etc.). Preset palette or custom hex. Recomputes CSS custom properties (--primary, --accent) at runtime. Syncs to user preferences; fallback to tenant branding color. Persists in localStorage + backend.

**Effort:** M (2–3 days — CSS variable runtime swap)  
**Dependency:** Color palette definition; CSS-in-JS or Tailwind CSS variable support  
**Verdict:** DEFER (MEDIUM ROI; Sonnet can implement if branding is high user request)

---

### 11. Report Section Toggles

**Location:** `/reports` or report generation flow; which sections appear in generated/exported reports  
**Current state:** Reports auto-include all sections (Summary, Pipeline Health, Team Metrics, Client Performance, Forecast); no customization  
**Owner:** User-level or Tenant-level  
**Recommended UX:**  
Before generating/exporting a report, show checklist: include/exclude Summary, Pipeline Funnel, Leaderboard, Team Metrics, Client Breakdown, Forecasting, Notes. Users can save report templates (e.g., "Weekly Exec Summary" = Summary + Pipeline + Metrics). Persisted to user or tenant preferences.

**Effort:** M (2–3 days — report engine integration)  
**Dependency:** Report generation service; preferences schema  
**Verdict:** IMPLEMENT (MEDIUM ROI; high user value for recurring reports)

---

### 12. Lead Filter Defaults — Per User

**Location:** `/leads` — filters sidebar (stage, owner, status, tags, created date, etc.)  
**Current state:** No filters pre-applied; users re-apply filters every session  
**Owner:** User-level  
**Recommended UX:**  
"Save as Default" button next to filter controls. When user clicks, stores current filter state (stage=Qualified+Proposal, owner=Me, created_date=last_30_days, etc.) to user preferences. On next visit to `/leads`, filters auto-apply. Users can clear or update default. Also support quick-switch buttons ("My Leads", "Hot Leads", "This Week") as saved filter shortcuts.

**Effort:** S (1–2 days — localStorage + filter state handler)  
**Dependency:** Filter state serialization; user preferences endpoint  
**Verdict:** IMPLEMENT (HIGH ROI; reduces friction for daily workflows)

---

### 13. Client Portfolio Default Sort/View

**Location:** `/clients` — portfolio view (grid vs. table, sort column, sort direction)  
**Current state:** Fixed table view; default sort by client name (ascending); no view toggle or sort persistence  
**Owner:** User-level  
**Recommended UX:**  
View toggle: Grid (card layout) / Table. Sort dropdown: by Name, Status, Industry, Monthly Spend, Live Projects, Created Date, Custom Fields. Persists view + sort to user preferences. Loads last preference on page return. Simple localStorage implementation with optional backend sync.

**Effort:** S (1–2 days — view component logic + persistence)  
**Dependency:** Grid view component (may already exist)  
**Verdict:** IMPLEMENT (HIGH ROI; simple, high user request)

---

### 14. TeamFeed Panel Width

**Location:** `/` — master dashboard; TeamFeed side panel (real-time message feed)  
**Current state:** Fixed width (400px or similar); non-resizable panel  
**Owner:** User-level  
**Recommended UX:**  
Allow drag-to-resize the TeamFeed panel divider (right edge). Saves width to user preferences (localStorage). Min width 300px, max 600px. On return, restores saved width. Alternatively, collapsible toggle (show/hide feed entirely).

**Effort:** S (1 day — resize handler + persistence)  
**Dependency:** Resizable panel library or custom drag logic (likely already done in 1-A)  
**Verdict:** IMPLEMENT (already shipping as part of 1-A this sprint; ensure preferences persist)

---

### 15. Content Studio Default View

**Location:** `/content-studio` — calendar vs. list view for content planning  
**Current state:** Default calendar view; no list view or view toggle yet  
**Owner:** User-level  
**Recommended UX:**  
View toggle in header: Calendar / List. Calendar shows content items on publish dates. List shows table with columns (title, type, status, publish date, owner). Toggle + view preference persist to user localStorage. Optional: saved view combinations as quick-switch buttons.

**Effort:** S (1–2 days — list view component + toggle)  
**Dependency:** List view component (if not yet built); no backend required  
**Verdict:** IMPLEMENT (MEDIUM ROI; likely low effort if list component exists)

---

## Priority Ranking Table

| Rank | Surface | ROI | Effort | Impact Score | Verdict | User Benefit |
|---|---|---|---|---|---|---|
| 1 | Display Density Toggle | High | S | 9/10 | IMPLEMENT | Affects every table/card; immediately visible; accessibility + power-user need |
| 2 | Default Tab Memory | High | S | 8/10 | IMPLEMENT | Zero-friction UX; trivial effort; eliminates daily re-navigation |
| 3 | Lead Filter Defaults | High | S | 8/10 | IMPLEMENT | High user request; saves daily clicks; localStorage-only |
| 4 | Table Column Chooser (Leads) | High | M | 8/10 | IMPLEMENT | Reduces cognitive load; power users control layout; reusable pattern |
| 5 | Lead Filter Defaults — Per User | High | S | 8/10 | IMPLEMENT | Eliminates repeated filtering; high-frequency task |
| 6 | Client Portfolio View Toggle | High | S | 7/10 | IMPLEMENT | Grid + table caters to different workflows |
| 7 | Notification Preferences | Medium | M | 7/10 | IMPLEMENT | Reduces notification fatigue; granular control |
| 8 | Table Column Chooser (Clients) | Medium | M | 7/10 | IMPLEMENT | Same ROI as Leads; reuses column-chooser component |
| 9 | Pipeline Stage Visibility | Medium | M | 7/10 | IMPLEMENT | Declutters Kanban for power users; tenant-wide defaults |
| 10 | TeamFeed Panel Width | Medium | S | 6/10 | IMPLEMENT | Already shipping in 1-A; ensure persistence |
| 11 | Dashboard Widget Visibility | Medium | M | 6/10 | IMPLEMENT | Declutters dashboard; medium effort; medium impact |
| 12 | Content Studio View Toggle | Medium | S | 6/10 | IMPLEMENT | Caters to list-vs-calendar preference |
| 13 | Report Section Toggles | Medium | M | 6/10 | IMPLEMENT | High value for report users; medium effort |
| 14 | Theme Accent Color | Low | M | 4/10 | DEFER | Nice-to-have; tenant branding may satisfy; medium effort |
| 15 | Sidebar Nav Pin/Reorder | Low | L | 3/10 | DEFER | Niche need; high complexity; low user request volume |
| 16 | Keyboard Shortcuts | Low | L | 3/10 | DEFER | Advanced feature; high effort; low adoption current-phase |

---

## Implementation Roadmap

### Sprint 1 (1–2 weeks) — Highest ROI

1. **Display Density Toggle** (S) — Add CSS class swaps: `.density-compact`, `.density-comfortable`, `.density-spacious`. Wire to Settings > Appearance with localStorage persistence.

2. **Default Tab Memory** (S) — Inject `useLastTab()` hook into tab containers. Store active tab to localStorage keyed by page path. Auto-switch on mount.

3. **Lead Filter Defaults** (S) — Add "Save as Default" button to filter controls. Serialize filter state to localStorage under `user_lead_filters_default`. Restore on `/leads` mount.

4. **Client Portfolio View Toggle** (S) — Build grid view component alongside table. Toggle in header switches views. Save preference to localStorage.

---

### Sprint 2 (2–3 weeks) — High ROI, Medium Effort

5. **Table Column Chooser — Leads + Clients** (M × 2) — Build reusable column-chooser modal component. Wire to leads table header and clients table header. Persist selections to localStorage per table.

6. **Pipeline Stage Visibility** (M) — Kanban header gear icon → modal with stage toggles and drag reorder. Tenant defaults in Admin Settings. User overrides to sessionStorage.

7. **Notification Preferences** (M) — Expand Settings > General notification section. Add per-event-type toggles. Persist to user preferences endpoint + localStorage fallback.

---

### Sprint 3+ (Later) — Lower ROI, Deferred

8. **Dashboard Widget Visibility** (M) — Settings > Display widget checklist. Persist to user preferences.

9. **Theme Accent Color** (M) — Color picker in Settings > Appearance. Runtime CSS variable swap.

10. **Report Section Toggles** (M) — Report generation flow: checklist of sections. Save report templates to user or tenant.

11. **Content Studio View Toggle** (S) — View toggle in header; list component if not yet built.

12. **Sidebar Nav Pin/Reorder** (L) — Defer; requires drag-and-drop library + complex state management. Revisit if user demand spikes.

13. **Keyboard Shortcuts** (L) — Defer; full keyboard handler system is high effort. Revisit for v2.

---

## Technical Notes

### Storage Layer Decision

All user-level customizations follow this priority:

1. **localStorage (immediate, no backend):** Tab memory, display density, column choices, filter defaults, view toggles. Users expect instant persistence even offline.
2. **User Preferences Endpoint (sync on action):** Notification settings, widget visibility, accent color. Write to backend after user saves; fallback to localStorage.
3. **sessionStorage (temporary overrides):** Pipeline stage visibility per-session; user can override tenant defaults without persisting.

### Component Patterns

**Settings Save Pattern:**  
Settings page always has top-level Save button. Individual toggle switches don't auto-save; batch changes and persist on Save click. Toast on success/error.

**Preference Hooks:**  
Create `useUserPreference(key, defaultValue)` hook that reads/writes to localStorage with optional backend sync. Used by Display Density, Tab Memory, Column Chooser, etc.

**Column Chooser Component:**  
Reusable modal (ColumnChooserModal.tsx) accepts column definition array, current selection, and onChange callback. Handles drag reorder via react-beautiful-dnd or Shadcn Sortable. Emits new column order + visibility to parent.

### Accessibility Considerations

- Display density toggle must maintain WCAG AA contrast ratios at all densities.
- Column chooser modal needs keyboard nav (arrow keys, Tab) and screen reader announcements.
- Filter defaults should include clear "Reset to Site Defaults" option.
- Keyboard shortcuts (if implemented) must not conflict with browser or screen reader shortcuts.

---

## Success Metrics

Track adoption and impact via:

1. **Feature usage:** How many users enable density toggle, save filter defaults, customize columns per day/week.
2. **Session duration:** Do users with customized layouts spend more time in the app?
3. **Feature discoverability:** Add telemetry to Settings > Display section; measure click-through.
4. **User satisfaction:** Post-launch survey: "Has dashboard customization improved your workflow?" (1–5 Likert).
5. **Support tickets:** Monitor reduction in "how do I hide columns?" type requests.

---

## Open Questions for Stakeholder Review

1. **Tenant vs. User Defaults:** For Pipeline Stages and Notification Preferences, should tenant admins set defaults that users can override, or full user control?
2. **Cloud Sync:** Should user preferences sync across devices/browsers, or localStorage-only per device?
3. **Report Templates:** Should saved report templates be personal (user-only) or team-level (shared with all team members)?
4. **Keyboard Shortcuts:** Is this a v1 must-have, or can it wait until v2 based on user feedback?
5. **Color Customization:** Should only tenant admins pick accent color, or individual users?

---

## Conclusion

Prioritizing the "S" (small) effort items first unlocks 70% of the UX wins (Display Density, Tab Memory, Filter Defaults) with minimal engineering lift. The "M" (medium) effort items (Column Chooser, Notification Granularity, Pipeline Stages) follow naturally as reusable patterns scale across the platform. Defer "L" items (Sidebar Reorder, Keyboard System) until user demand justifies the complexity.

**Recommended Next Step:** Assign Display Density Toggle to Haiku (S, CSS-first); Tab Memory + Filter Defaults to Haiku (S, localStorage handlers). Start Sprint 2 planning with Column Chooser pattern (reusable, M, strategic).
