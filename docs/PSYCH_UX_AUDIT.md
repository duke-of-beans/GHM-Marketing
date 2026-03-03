# Psychological UX Audit — Sprint 36

Generated: 2026-03-03
Sprint: 36 (Demo-Ready)
Scope: Full platform walk-through from first login to daily operation

---

## 1. First Impressions (Onboarding Flow)

**Current state:** AdminSetupWizard (master) and onboarding-wizard (sales reps) guide new users through setup. Both have clear step indicators and skip options.

**Strengths:** Progressive disclosure, low initial cognitive load, brand colors visible immediately. The "Let's go →" CTA on the final step creates momentum.

**Issues:**
- The wizard steps lack a progress percentage or "3 of 5" indicator on mobile viewports — users can't gauge remaining effort.
- No celebration moment on completion. After finishing setup, the user is dumped to the dashboard with no acknowledgment. Recommend a confetti micro-animation or success card: "You're all set — here's what to do first."
- The skip button sits beside the primary CTA with identical visual weight. Users who accidentally skip miss critical setup (branding, team invite). Recommend making skip a text link, not a button.

**Severity:** Medium. First impressions set retention tone.

---

## 2. Empty States (Pre-Data Experience)

**Current state:** EmptyState component (Sprint 36) now provides consistent icon + title + description + optional CTA across 9 major components.

**Strengths:** Consistent visual language, descriptions tell users what to do next, CTAs link to the creation flow.

**Issues:**
- Several secondary pages still use raw `<p>` text for empty states (compensation-config, permission-manager, cost dashboard). These feel like errors rather than intentional states.
- The product-catalog empty state is the gold standard: icon, explanation, CTA button. Other pages should match this pattern.
- Empty states in data tables (DataTable `emptyMessage` prop) render as flat text inside a table cell — feels broken. Recommend rendering the EmptyState component when the table body is empty.

**Severity:** Low-Medium. Most high-traffic pages are fixed.

---

## 3. Feedback Loops (Toast + Loading States)

**Current state:** 380 toast calls via sonner across 50+ components. All use `toast.success()` / `toast.error()` pattern.

**Strengths:** Consistent library (sonner), good error/success distinction, most destructive actions show confirmation toasts.

**Issues:**
- No toast duration standardization — some success messages flash too quickly for reading.
- Error toasts show generic messages ("Something went wrong") in ~15% of cases. These should include the action that failed: "Failed to save client settings" not "Something went wrong."
- Loading states are inconsistent: some pages show skeleton loaders (TeamFeed, task-queue-client), others show a centered Loader2 spinner (ContentList), and some show nothing during fetch. Recommend standardizing on skeletons for lists and spinners for single-item loads.
- The `confirm()` browser dialog is used for 4 destructive actions. These feel jarring compared to the polished UI. Recommend migrating to AlertDialog for visual consistency.

**Severity:** Medium. Error feedback directly affects user trust.

---

## 4. Navigation & Wayfinding

**Current state:** Sidebar nav, breadcrumbs on some pages, tab navigation (Tasks, Settings).

**Strengths:** Tab memory via URL params (tasks ?tab=approvals), sidebar highlights active page.

**Issues:**
- No breadcrumbs on client detail pages. User navigates Clients → Client → Keywords → Scan and has no trail back. Recommend breadcrumb component on all nested routes.
- The Settings page has 10+ tabs but no visual grouping. Users hunting for "Positions" or "Cost Dashboard" scroll through a flat tab list. Recommend grouped sections: "Team & Access", "Platform Config", "Integrations", "Data."
- Dashboard layout customization (PATCH /api/dashboard-layout) exists but is not discoverable — no "customize" button or onboarding hint.

**Severity:** Medium. Users with 10+ clients will feel navigation pain.

---

## 5. Cognitive Load

**Current state:** Dense data pages (task queue, pipeline kanban, reports) show significant information per screen.

**Issues:**
- Task queue shows priority, status, category, assignee, client, due date, and checklist progress all in one row. This is 7 data dimensions — recommend progressive disclosure (expand-on-click for details, show only priority + title + status + assignee in collapsed view).
- The pipeline kanban shows all lead statuses simultaneously. For new users, the 7-column board is overwhelming. Recommend a "simplified view" toggle that collapses to 3 stages (Prospecting → Active → Closed).
- Content generation has 5 separate generators (blog, social, PPC, meta, strategy) each accessed via different buttons. Users don't know which to use. Recommend a "Generate Content" entry point with a guided selector: "What do you want to create?"

**Severity:** High for new users, low for power users.

---

## 6. Trust & Security Perception

**Current state:** Permission system in place, role-based access, TOTP 2FA available.

**Strengths:** Permission presets make role assignment fast. Audit logs exist.

**Issues:**
- No visible security indicators. Users managing client data should see trust signals — last login, session count, data encryption status.
- The TOTP setup flow exists but is not prompted during onboarding. Recommend nudging admin users to enable 2FA on first login.
- The client portal generate-token flow creates tokens with no visible expiry. Users may not realize tokens are time-limited.

**Severity:** Low for internal tool, but matters for enterprise demos.

---

## 7. Error Recovery

**Current state:** Most API errors caught with try/catch and toast.error().

**Issues:**
- No retry mechanism for failed fetches. If a report generation fails, the user must manually click "Generate" again with no indication of what went wrong.
- Bulk operations (bulk delete, bulk reassign) show a single success/error toast. If 3 of 10 items fail, the user doesn't know which ones. Recommend itemized feedback for bulk operations.
- Form validation is client-side only in several places (new lead dialog, content edit). Server errors return generic messages. Recommend field-level error mapping.

**Severity:** Medium. Failed operations without clear recovery paths cause user anxiety.

---

## 8. Delight & Momentum

**Issues:**
- No micro-celebrations for milestones (first client won, 10th report generated, streak of completed tasks). These create positive reinforcement loops.
- The "Queue clear" empty state in task queue is a missed celebration moment. Instead of a plain message, this could be a satisfying green checkmark animation with "All caught up!"
- No progress indicators for long-running AI operations (content generation, voice capture, website audit). These can take 10-30 seconds with no feedback beyond a spinner.

**Severity:** Low priority but high demo impact.

---

## Prioritized Recommendations (Track D+ / Backlog)

### Sprint 36 Scope (Track D)
1. Migrate `confirm()` dialogs → AlertDialog (4 instances)
2. Generic error toast cleanup (add action context to messages)

### Backlog (Post-Sprint 36)
3. Onboarding completion celebration
4. Breadcrumb component for nested routes
5. Settings tab grouping
6. AI operation progress indicators
7. Simplified pipeline view for new users
8. Bulk operation itemized feedback
9. Content generation guided entry point
10. 2FA onboarding nudge

---

*This audit is observational — no code changes. Implementation recommendations feed into Track D (Sprint 36) and BACKLOG.md.*
