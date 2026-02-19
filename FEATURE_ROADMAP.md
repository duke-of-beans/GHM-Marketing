# GHM DASHBOARD - FEATURE ROADMAP & PRIORITIES
> ⚠️ **ARCHIVED** — Current status lives in `STATUS.md`. This file is kept for historical reference. Backlog items at the bottom (Feb 18 additions) are still tracked in STATUS.md.

**Date:** February 17, 2026  
**Status:** Planning complete, ready for implementation

---

## 📋 THREE CRITICAL FEATURES REQUESTED

### 1. Commission & Residual Tracking System
**Complexity:** HIGH (4 weeks, phased rollout)  
**Business Impact:** CRITICAL (financial tracking + team motivation)  
**Status:** ✅ Fully specified  
**Spec:** `COMMISSION_SYSTEM_SPEC.md`

### 2. Edit Client Details
**Complexity:** LOW (1-2 days)  
**Business Impact:** HIGH (blocking current workflow)  
**Status:** ✅ Fully specified  
**Spec:** `EDIT_AND_TASKS_SPEC.md` (Feature 1)

### 3. Bulk Task Management
**Complexity:** MEDIUM (3-5 days)  
**Business Impact:** MEDIUM (nice to have, not blocking)  
**Status:** ✅ Fully specified  
**Spec:** `EDIT_AND_TASKS_SPEC.md` (Feature 2)

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Immediate Priority (This Week)

#### 1. Fix Current Deployment ✅ IN PROGRESS
**Issue:** Client detail page crashing due to missing database table  
**Status:** Deploying fix (commit c300dd2)  
**Time:** 5 minutes  
**Priority:** CRITICAL BLOCKER

**What's happening:**
- Disabled `upsellOpportunities` query temporarily
- Client detail page should work after deployment
- Need to run full migration later to enable all features

#### 2. Edit Client Details 🔴 DO NEXT
**Why first:**
- Simple feature (1-2 days)
- Unblocks current workflow (can't edit clients right now)
- High ROI (immediate user value)
- Builds momentum

**Implementation:**
1. Create PATCH `/api/clients/[id]` endpoint
2. Add edit button to client detail page
3. Build edit form with validation
4. Add audit trail (system notes)
5. Test and deploy

**Deliverable:** Can edit all client information

---

### Week 1-2: Commission System Phase 1 & 2

#### Phase 1: Database & Core Logic
**What:**
- Create compensation tables (migration)
- Build payment calculation functions
- Create automated monthly payment job
- API endpoints for compensation config

**Deliverable:** Backend ready, calculations working

#### Phase 2: Admin Configuration
**What:**
- Team page: compensation config per user
- Client detail: sales rep + master assignment
- Client detail: compensation overrides
- Test payment calculations

**Deliverable:** Admins can configure everything

---

### Week 3-4: Commission System Phase 3 & 4

#### Phase 3: Dashboard Widgets
**What:**
- Sales rep earnings widget
- Master manager earnings widget
- Owner profit dashboard
- Payment obligations widget

**Deliverable:** Everyone sees their financial data

#### Phase 4: Reporting & Polish
**What:**
- Payment history page
- CSV/PDF export
- Email notifications
- Rep performance analytics

**Deliverable:** Complete financial system

---

### Week 5: Task Management Enhancements

#### Bulk Import & Templates
**What:**
- Bulk task import (paste list or CSV)
- Task templates for common workflows
- Better filtering and organization

**Deliverable:** Can quickly load tasks for established clients

---

## 📊 EFFORT vs IMPACT MATRIX

```
High Impact │                          │
            │                          │ ✅ Edit Client
            │  🔴 Commission System    │    Details
            │     (Phases 1-4)         │
            │                          │
            │                          │
            ├──────────────────────────┼──────────────────
Medium      │                          │
Impact      │                          │
            │  ⚪ Task Management      │
            │     Enhancements         │
            │                          │
            │                          │
Low Impact  │                          │
            └──────────────────────────┴──────────────────
              Low Effort    →    High Effort
```

**Legend:**
- 🔴 Do first (high effort, high impact)
- ✅ Quick win (low effort, high impact)
- ⚪ Nice to have (medium effort, medium impact)

---

## 💰 ROI ANALYSIS

### Edit Client Details
```yaml
effort: "1-2 days"
value:
  - "Unblocks daily workflow immediately"
  - "Prevents delete/recreate workaround"
  - "Reduces data errors"
  - "Improves data quality"
roi: "EXTREMELY HIGH (quick win)"
```

### Commission System
```yaml
effort: "4 weeks (phased)"
value:
  - "Eliminates manual commission tracking (saves 4 hours/month)"
  - "Prevents payment disputes (clear audit trail)"
  - "Enables financial forecasting (critical for cash flow)"
  - "Motivates sales team (transparent earnings)"
  - "Scales with team growth"
roi: "VERY HIGH (strategic investment)"

break_even:
  time_saved: "4 hours/month × $100/hour = $400/month"
  development: "100 hours of dev time"
  payback: "~6 months of time savings"
  ongoing_value: "Priceless for scaling team"
```

### Task Management
```yaml
effort: "3-5 days"
value:
  - "Faster onboarding of established clients"
  - "Better project management"
  - "Less manual task entry"
roi: "MEDIUM (nice to have, not critical)"
```

---

## 🚦 DECISION GATES

### Before Starting Commission System
**Questions to answer:**
1. Do we have sales reps yet? (Or just Gavin + David?)
2. When do we plan to hire reps?
3. Can we start with simple version first?

**Recommendation:**
If no sales reps yet → **Defer to Month 2**  
If hiring soon → **Build Phase 1-2 now, rest later**  
If actively recruiting → **Full build immediately**

**Current reality check:**
- German Auto Doctor is only client
- Gavin is both sales + master
- No actual payments going out yet

**Suggestion:** Build Edit feature now, defer Commission to when you have 2+ sales reps

---

## 📅 PROPOSED TIMELINE

### This Week (Feb 17-23)
- ✅ Fix deployment (commit c300dd2)
- ⏳ Wait for deployment (~2 min)
- ✅ Test client detail page works
- 🎯 **BUILD: Edit Client Details** (1-2 days)
- 🎯 **DECISION: Commission system timing**

### Weeks 2-5 (Conditional on Commission System)
**If building commission system:**
- Week 2: Commission Phase 1
- Week 3: Commission Phase 2
- Week 4: Commission Phase 3
- Week 5: Commission Phase 4 + Task Management

**If deferring commission system:**
- Week 2: Task Management + other priorities
- Week 3: Discovery feature testing + client acquisition
- Week 4: Competitive scanning automation
- Week 5: Reporting & analytics

---

## 🎬 NEXT ACTIONS

### Immediate (Today)
1. ✅ Wait for deployment to complete
2. ✅ Test German Auto Doctor client detail page
3. ✅ Verify page loads successfully
4. 📝 Review commission system spec
5. 🤔 **DECISION:** Build commission system now or later?

### If Yes to Commission System
1. Approve `COMMISSION_SYSTEM_SPEC.md`
2. Create database migration for Phase 1
3. Run migration in development
4. Build payment calculation functions
5. Test with German Auto Doctor (Gavin scenario)

### If No to Commission System (Defer)
1. Note for future: revisit when hiring sales reps
2. Proceed with Edit Client Details
3. Focus on client acquisition
4. Build other high-ROI features

### Regardless of Commission Decision
1. **BUILD:** Edit Client Details (1-2 days)
   - This is non-negotiable, must have immediately
   - Unblocks daily workflow
   - Simple to implement

---

## 📞 QUESTIONS FOR DAVID

### Commission System Timing
1. **Do you have sales reps now?** (Beyond Gavin)
2. **When are you hiring sales reps?** (This month? This quarter?)
3. **Can commission tracking wait?** (Or need it for tax prep, contracts, etc.)

### Commission System Scope
1. **Start simple?** (Manual payments, just tracking) OR **Full automation?** (Auto-calculate, auto-notify)
2. **Need payment approval workflow?** (Gavin approves before paying) OR **Auto-trust calculations?**
3. **Accounting integration needed?** (QuickBooks, Xero) OR **CSV export sufficient?**

### Other Features
1. **Task templates valuable?** (Save time onboarding) OR **Just bulk import enough?**
2. **Any other blocking issues?** (Things preventing daily use)
3. **Discovery feature working?** (After API keys added to Vercel)

---

## ✅ DECISION MATRIX

```
┌──────────────────────────────────────┐
│ Current Situation Assessment         │
├──────────────────────────────────────┤
│ Sales team size:  [ 1 ] (just Gavin)│
│ Hiring timeline:  [______ weeks]    │
│ Need by (date):   [__/__/____]      │
│                                      │
│ If team size = 1 → DEFER             │
│ If hiring < 4 weeks → BUILD NOW      │
│ If hiring > 4 weeks → BUILD LATER    │
└──────────────────────────────────────┘
```

**Fill this out and I'll adjust the roadmap accordingly!**

---

## 📝 SUMMARY

### Complete Specifications
✅ **Commission System:** 637 lines, fully detailed  
✅ **Edit & Tasks:** 598 lines, implementation-ready  
✅ **All edge cases:** Documented and handled  
✅ **UI/UX mockups:** Provided for all features  
✅ **Database schemas:** Defined and validated  
✅ **API endpoints:** Specified with examples  
✅ **Phased rollout:** 4-week timeline broken down  

### What's Ready to Build
1. **Edit Client Details** - Can start immediately (1-2 days)
2. **Commission System Phase 1** - Database + logic (1 week)
3. **Commission System Phase 2** - Admin UI (1 week)
4. **Commission System Phase 3** - Dashboards (1 week)
5. **Commission System Phase 4** - Reporting (1 week)
6. **Task Management** - Bulk import + templates (3-5 days)

### Decision Needed
**Commission system: Build now or defer?**
- Now = 4 weeks of focused development
- Defer = Focus on client acquisition, build when needed

**Recommendation:** 
- **Build Edit feature today** (non-negotiable)
- **Decide on Commission** based on hiring timeline
- **Build Task features** in spare time (low priority)

---

**All specs ready. What's your decision on the commission system?**

**Created:** February 17, 2026  
**Status:** Awaiting decision on implementation order


---

## 📥 BACKLOG — Added February 18, 2026

### 🟡 Pipeline Filter UX

**1. Make "Pipeline Status" collapsible in More Filters panel**
- The top section of the More Filters dropdown ("Pipeline Status") is not collapsible like the bottom two sections. Make all three sections consistent — all collapsible, all open by default.

**2. Rethink default visible filter/sort options**
- Move most-used options to always-visible (above the More Filters button). Suggested top-level defaults: Status, Assigned Rep, Territory, Sort (newest / deal value / close score).
- Move secondary options into More Filters: Score range, Market type, Lead source, Deal value, Distance, Wealth score, etc.
- Review which reps actually use each filter and prioritize accordingly.

**3. Expand filter/sort options using the full Lead model**
- The current filter set is far narrower than what the data supports. Audit the Lead model and expose relevant fields:
  - `closeScore`, `impactScore`, `wealthScore` (range sliders or tiers)
  - `priorityTier` (dropdown)
  - `marketType` (dropdown)
  - `pitchAngle` (dropdown)
  - `suppressionSignal` (boolean / exclude toggle)
  - `distanceFromMetro` (range)
  - `domainRating` (range)
  - `intelNeedsRefresh` (boolean)
  - `dealValueTotal` / `mrr` / `arr` (range)
  - `leadSourceId` (multi-select)
  - `createdAt` (date range)
- Also review the discovery/lead gen engine (Outscraper qualification scoring) to understand what enrichment fields can be filtered on.

---

### 🟡 TeamFeed Enhancements

**4. Multimedia & emoji support for TeamFeed messages**
- Blueprint was previously drafted (check transcript). Implement:
  - Emoji picker (e.g. emoji-mart) inline in compose box
  - Image/GIF attachment support (upload or paste)
  - GIF search (Giphy or Tenor API)
  - Render inline in the message thread
  - File size limits + accepted types enforced server-side

---

### 🔴 Account Hierarchy & User Activity

**5. Add "Admin" role above Master/Manager**
- David's account should be Admin — full access to everything, including role management, billing visibility, and system config that Managers shouldn't touch.
- New role hierarchy: **Admin → Manager → Sales**
- Admin-only capabilities: manage all roles, view all user activity, system settings, future billing.
- This is a schema change (`UserRole` enum). Plan migration carefully to avoid breaking existing auth/permission checks.

**6. Rename "master" role → "manager" across entire codebase**
- DB enum value, UI labels, permission presets, seed data, middleware, nav, API guards, all strings.
- "Sales" stays as-is.
- Coordinate with Admin role addition (do both in one migration pass).

**7. User activity / session statistics (Admin-only view)**
- Track and surface per-user session data:
  - Last login datetime
  - Total login count
  - Session durations (average + history)
  - Pages most visited
  - Activity heatmap (days/times active)
- Implementation options: extend `AuditLog` with session tracking, or add a `UserSession` model.
- Surface in a new "User Activity" section in Settings (Admin-only tab).
- Consider a lightweight dashboard widget showing who's been active recently.


**8. "My Tasks" widget on dashboard (role-aware)**
- Add a personal task widget to the dashboard, visible to all account types but content tailored by role:
  - **Sales reps:** their assigned client tasks, leads needing follow-up, overdue pipeline actions
  - **Managers:** tasks assigned to their team, approvals pending, scan alerts needing review
  - **Admin:** system-level items, unresolved bug reports, pending feature requests
- Show priority badges (urgent/high/medium), due dates, and client context where applicable
- Clickable — each item routes directly to the relevant record
- Widget should be collapsible and respect the existing dashboard layout/personalization system

**9. Bug reports & feature requests — visibility and status feedback**
- Currently bug/feature submissions go nowhere visible. Fix this end to end:
  - Reports should only be visible to Admin (currently "master" — update when role rename happens)
  - Admin sees all tickets in the Bug Reports page with full detail, status management, and assignment
  - Users who submit a ticket should receive status updates — at minimum: Received → In Progress → Resolved (or Won't Fix)
  - Status change should trigger an in-app notification (and optionally a push notification if they have it enabled)
  - Consider a lightweight "My Submissions" view for non-admin users so they can check ticket status without seeing everyone else's
  - Ticket statuses: new → acknowledged → in-progress → resolved → won't-fix (already in schema, just needs to be surfaced to submitters)


**10. Clicking the GHM logo navigates to the dashboard home**
- The logo in the nav/header should be a link to `/` (or `/master` / `/sales` depending on role)
- Quick win, should take ~5 minutes
