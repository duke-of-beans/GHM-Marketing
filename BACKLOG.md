# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** February 24, 2026 — Sprint 5 shipped. FEAT-014 (PM platform import) added. Sprint 6 is next.
**Owner:** David Kirsch

This file contains ONLY open work. When an item ships:
1. Add a row to CHANGELOG.md (date + commit + summary)
2. Delete the item from this file
3. Update STATUS.md "Last Updated" line
4. Then commit

Completed history lives in CHANGELOG.md. Never put ✅ items here.

---

## 🗺️ RECOMMENDED SPRINT SEQUENCE (February 23, 2026)

Foundation → out. Each sprint unblocks the next.

| Sprint | Focus | Items | Size | Why This Order |
|--------|-------|-------|------|----------------|
| ~~1~~ | ~~Production Foundation~~ | ~~Security Hardening + Sentry + Structured Logging~~ | ✅ SHIPPED | ~~Gates all external use.~~ |
| ~~2~~ | ~~Ops Spine Completion~~ | ~~Client Portal Decision + Ops Sprint 6 (Reporting Pipeline)~~ | ✅ SHIPPED | ~~Fulfills contract promise of monthly delivery. Portal ambiguity off the board.~~ |
| ~~3~~ | ~~Bulk Operations~~ | ~~Ops Sprint 7 (bulk content/task/pipeline)~~ | ✅ SHIPPED | ~~Team can't scale without batch actions. Additive to existing systems.~~ |
| ~~4~~ | ~~Intelligence Layer~~ | ~~Ops Sprint 8 (MoM/YoY trends, churn risk, health trajectories)~~ | ✅ SHIPPED | ~~Synthesizes all collected data. Turns dashboard into indispensable ops platform.~~ |
| ~~UX~~ | ~~UX Bug Batch~~ | ~~BUG-001–007 + ARCH-001~~ | ✅ SHIPPED | ~~First-impression fixes: search bar, nav, Wave error, OS key hints, doc cleanup.~~ |
| ~~5~~ | ~~Data Access + Admin Visibility~~ | ~~Data Export + User Activity/Session Stats~~ | ✅ SHIPPED | ~~External data requests + internal usage intelligence.~~ |
| 6 | UX Completeness | Static Empty States + Pipeline Filter UX debt + Keyboard Shortcuts | ~1 session | Closes gap between functional and polished. |
| 7 | Sales Enablement Polish | Audit PDF PPC + Brochure PPC + Save Searches | ~0.5 sessions | Completes ITEM-001 scope. Power-user filter layer. |
| 8 | Content Power | Bulk Content Ops + Competitor Tracking Manual + Custom Report Builder | ~1 session | Makes content and competitive intelligence practical at scale. |
| 9 | COVOS Self-Service | COVOS Admin Onboarding Wizard | ~2 sessions | Requires Sprint 1 security first. Unlocks white-label productization. |

**Background (no code needed, external waits):**
- W7 Kill Gusto — run parallel Wave payroll cycle, then ops decision
- I4 GBP OAuth — monitor Google API Console approval

---

## 🐛 UX BUGS & POLISH — Added February 23, 2026

### UX-BUG-001: Search Bar — Click-Outside Should Close
Search bar currently only closes on Escape key. Clicking anywhere outside should also dismiss it. Standard web convention.
**Scope:** Add `onBlur` or click-outside handler (e.g., `useClickOutside` hook) to search component.
**Size:** ~30 min.

### UX-BUG-002: Search Bar — Expansion Behavior Wrong, Not Layout-Aware
When activated, clicking the search bar triggers a large gray transparent square overlay — the cmdk modal rendering broken/empty. The correct behavior: the search bar should stay in its top navbar position and expand responsively horizontally (smooth CSS transition, max-width expansion). Results dropdown renders inline below the bar, no modal, no overlay, no teleportation. The bar must also be aware of the Team Feed panel state — when the panel is open/expanded, the expanded search bar width should respect that boundary and not overlap or ignore it.
**Recommended fix:** Replace modal-style cmdk trigger with an inline expanding input. Width transitions from collapsed (e.g., 200px) to expanded (fills available nav space minus Team Feed panel width when open). Results render as a positioned dropdown below the input. `useModifierKey()` already exists for the shortcut hint.
**Related:** UX-BUG-001 (click-outside to close), UX-BUG-007 (cmdk transparent square — same root cause, can fix together).
**Size:** ~2–3 hrs.

### UX-BUG-003: Payments Page — Wave Widget Fails Without Graceful Degradation
Wave GraphQL UNAUTHENTICATED error is surfaced raw in the UI: `Wave bank data unavailable — showing DB records only. (Error: Wave GraphQL error: [{"extensions":{"code":"UNAUTHENTICATED"...`. Raw JSON/stack traces must never reach the UI.
**Fix:** Catch Wave auth errors specifically. Show a clean amber inline notice: "Live bank data unavailable. Showing payment records only." with a refresh icon. Error detail to server log only.
**Size:** ~1 hr.

### UX-BUG-004: Left Nav — Auto-Scroll on Group Expand at Bottom of Panel
When scrolled to the bottom of the nav and a collapsed group is expanded, new items render below the viewport. User has to manually scroll to see them.
**Fix:** On expand, `scrollIntoView({ behavior: 'smooth' })` on the last item in the expanded group. Only trigger when the group is at/near the bottom of the scroll container.
**Size:** ~1 hr.

### UX-BUG-005: "Team" Nav Group — Rename to Better Reflect Contents
"Team" contains Service Catalog and Document Vault — neither of which is team-management in the conventional sense. Misleading label.
**Suggested rename:** "Resources", "Operations", "Library", or "Workspace" — pick what fits the nav language and what a rep would intuitively scan for.
**Size:** ~15 min.

### UX-BUG-006: Command Palette — macOS Symbol Shown on Windows
The command palette hint displays ⌘ instead of Ctrl on Windows. UI should detect the OS and show the correct modifier key.
**Fix:** Use `navigator.platform` or `navigator.userAgentData.platform` to detect OS. Show `Ctrl+K` on Windows/Linux, `⌘K` on macOS. Create a shared `useModifierKey()` hook and apply globally to all shortcut hints.
**Size:** ~30 min.

### UX-BUG-007: Command Palette — Opens as Empty Transparent Square (Broken)
When triggered, the command palette renders a transparent grey rectangle with no content. Confirmed still occurring. Same root cause as UX-BUG-002 — the modal/cmdk approach is broken. Fix is to eliminate the modal entirely in favor of the inline expanding search bar described in UX-BUG-002. Resolving UX-BUG-002 should close this simultaneously.
**Scope:** Fix as part of UX-BUG-002 search bar overhaul. Do not attempt to patch cmdk in isolation — the modal pattern is being abandoned.
**Size:** Resolved by UX-BUG-002 fix.

### UX-BUG-008: Team Feed Panel — Mac/Apple Icon Showing (Wrong Platform Icon)
The Team Feed panel is displaying a Mac/Apple keyboard icon. Should show the correct OS-aware modifier key icon, same as UX-BUG-006 (which fixed the command palette hint). The `useModifierKey()` hook exists but either isn't wired into the Team Feed send shortcut hint, or the Team Feed has a hardcoded Mac icon that wasn't caught in the UX Bug Batch.
**Scope:** Find the send shortcut hint in the Team Feed panel component. Replace any hardcoded ⌘ or Apple icon with `useModifierKey()` output. ~15 min once located.
**File:** Search `src/components/` for TeamFeed or team-feed component — look for keyboard hint near the send button.
**Size:** ~15–30 min.

### ARCH-001: Orphaned File Audit
Significant doc drift across sprints. Old sprint files, duplicate summaries, obsolete prompts, and stale handoff docs are cluttering the root and docs/.
**Scope:** Audit root-level `.md` files — candidates for archive: PHASE_*.md, SESSION_*.md, DEPLOYMENT_SUMMARY_2025-*.md, INLINE_HANDOFF.md, HANDOFF_PROMPT.md, HANDOFF_CLIENT_OPS_SUITE.md, PHASE4_CONTINUATION.md, PHASE_3_POLISH_COMPLETE.md, UX_*.md in root, MISSING_FEATURES_TODO.md, PRODUCTIZING_BACKLOG.md, CONTENT_STUDIO_*.md, CLIENT_DETAIL_FIX.md, ADD_CLIENT_FEATURE.md. Audit docs/ for same. Create `docs/archive/` and move historical-only files there. Update FILE INDEX in STATUS.md.
**Size:** ~1 hr.

---

## 🧭 HOW TO PICK WORK

Pick the top item in your current tier that unblocks the next thing.

| Tier | Meaning |
|------|---------|
| 🔴 MUST | Blocking client or rep operations right now |
| 🟠 SHOULD | Blocking productization, investor pitch, or next client tier |
| 🟡 WOULD | High value, no current blocker |
| ⚪ FUTURE | Vision items, deferred until scale |

---

## 🔴 MUST — Active Blockers

### W7 — Kill Gusto
**Context:** Wave AP/payroll is fully built and validated. Gusto is running in parallel.
**Gate:** Complete at least one successful payroll cycle through Wave → confirm Wave covers payroll + contractor 1099 → cancel Gusto.
**Note:** Gavin is W-2/2% shareholder in Gusto. Do NOT migrate mid-year. Plan: close 2026 on Gusto, migrate to Wave Payroll Jan 2027 alongside equity restructure. Arian + future reps are 1099 via dashboard → Wave bills, no Gusto needed.
**Action:** Ops decision, no code. ~30 min once gate is cleared.

### I4 — Google Business Profile OAuth (external wait)
**Context:** GBP integration fully built — OAuth flow, reviews, insights, posts, Local Presence tab. App in Testing mode with David + Gavin as test users.
**Gate:** Google API Console approval for external app status.
**Action:** Monitor approval → flip from Testing to Published → verify OAuth flow with a real client listing. ~1 hr once approved.

---

## 🟠 SHOULD — Productization & Growth

### Ops Layer Sprints 7–8
**Context:** Sprint 6 (Reporting Pipeline) shipped Feb 23. Sprints 7–8 remain.
**Sprint 7 — Bulk Operations:** Bulk content approve/archive/assign, bulk task close, batch pipeline actions.
**Sprint 8 — Advanced Analytics + Insights:** Trend analysis, MoM/YoY comparisons, churn risk scoring, client health trajectory charts.
**Size:** ~1 session per sprint.
**Files:** `src/components/content/BulkActions.tsx`, `src/app/(dashboard)/analytics/`

### FEAT-014: Project Management Platform Import (Productization)
For onboarding new agency customers — import their existing tasks/projects from whatever PM tool they're replacing. Makes migration frictionless and removes the "we'd have to re-enter everything" objection.
**Scope:** Adapters for the most common platforms: Basecamp (already have a crawler in scripts/), Asana, Monday.com, ClickUp, Trello. Import can be per-user (just my tasks) or global (whole workspace). Maps external tasks to `ClientTask` records — fields: title, description, assignee, due date, status. Unmatched clients get a staging area (import queue) where admin maps external project names to GHM clients before finalizing. Non-matching tasks can be imported as admin tasks or discarded.
**Implementation path:** OAuth or API key per platform (stored in Oktyv vault), generic `TaskImportAdapter` interface, platform-specific adapters, import wizard UI in Settings (admin-only), preview/mapping step before commit.
**Priority:** 🟠 SHOULD — productization blocker for cold agency onboarding.
**Size:** ~1 session per adapter (Basecamp adapter is mostly done via existing crawler). Full wizard ~1 additional session.
**Files:** `scripts/basecamp-crawl.ts` (existing, adapt), `src/lib/importers/` (new), `src/app/(dashboard)/settings/` (import wizard tab)
**Context:** Multi-tenant infrastructure is live (covos.app, TENANT_REGISTRY). This is the self-service onboarding a second agency would use to get onto the platform without GHM support. Spec documented in PRODUCTIZING_BACKLOG.md (commit c2a6daa).
**Scope:** Guided in-product wizard — API config, vendor selection, contractor/vendor setup, env var checklist (live UI showing which env vars are set/missing), role/permission briefing.
**Size:** ~2 sessions.
**Files:** `src/app/(dashboard)/settings/onboarding/` (new), `src/lib/tenant/`



---

## 🟡 WOULD — High Value, No Current Blocker

### Advanced Filter Persistence + Save Searches
Pipeline filter bar has localStorage persistence. Next tier is named saved searches.
**Scope:** "Save this filter" button → names the current combo → chips above filter bar (e.g., "Hot leads - Austin") → per-user, persisted to DB, max 5 per user.
**Size:** ~2–3 hrs.

### Pipeline Filter — Remaining UX Debt
Major UX pass done Feb 22. Three items left from original spec.
**Scope:** "Lead Source" filter (organic/referral/discovery/import — in DB, not surfaced), "Deal Value" range slider, "Days in Stage" filter (stale leads > N days in current stage).
**Size:** ~2 hrs total.

### Audit PDF — Paid Search Opportunity Section
In original ITEM-001 scope, never built.
**Scope:** Add section to audit PDF — estimated monthly search volume for target keywords, competitor ad spend indicators (DataForSEO), "you're leaving X/mo in paid visibility on the table" framing.
**Size:** ~1 hr (template-driven).

### Digital Brochure — PPC/Ads Highlight
In ITEM-001 scope, never built. Brochure currently focuses only on SEO.
**Scope:** Add section to `src/app/(onboarding)/brochure/page.tsx` covering Google Ads management + PPC as part of the $2,400/mo package. Include mock campaign metrics.
**Size:** ~1 hr.

### Bulk Content Operations (Sprint 7 subset)
Content Studio manages items one at a time.
**Scope:** Checkbox multi-select on Content Studio list, bulk approve (master+ only), bulk archive, bulk assign.
**Size:** ~2 hrs.

### Competitor Tracking — Manual Add + Refresh
Competitors seeded at client creation, updated by scans. No manual refresh or manual add.
**Scope:** "Add Competitor" button (name + domain), "Remove Competitor", "Refresh Competitor Data" (re-runs enrichment on demand).
**Size:** ~2 hrs.

### Reporting — Custom Report Builder
Reports auto-generated from scan data. Power users want section control.
**Scope:** Section toggle UI before generation, per-client report template (save preferred sections), AI-written "Executive Summary" paragraph using scan delta data.
**Size:** ~1 session.

### Static Empty State Help Text
### Static Empty State Help Text
Noted in commit cb8dd9d. Current empty states are static.
**Scope:** Context-aware empty states in Leads, Clients, Content Studio — suggest next action with direct button (e.g., "Run a Discovery scan to import leads"). Pairs with AI search layer.
**Size:** ~2–3 hrs.

---

## ⚪ FUTURE — Vision & Scale

### Accessibility (WCAG 2.1 AA)
Required before enterprise sales. Start with keyboard navigation (highest ROI), then screen reader, focus indicators, high contrast mode. **Size:** ~1–2 weeks full audit + fix pass.

### Mobile-Optimized UX (Beyond Responsive)
Full-screen mobile kanban, touch-optimized lead cards with swipe actions (right = claim, left = dismiss), mobile-specific quick actions. **Size:** ~2–3 sessions.

### Native Mobile Apps (iOS + Android)
React Native with shared business logic. Expo for faster iteration.
**Prerequisite:** Security hardening + API documentation complete.

### White-Label / Multi-Agency Productization (Covos)
Multi-tenant infrastructure is live. Next tier: self-serve agency onboarding, per-tenant branding, per-tenant billing, tenant admin panel, data isolation audit.
**Prerequisite:** Vendor Flexibility Architecture ✅ complete. COVOS Admin Onboarding Wizard must ship first.
**Size:** 2–3 sessions for core self-serve flow; ongoing for billing and admin.
