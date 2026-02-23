# CODEBASE REALITY MAP
## Operations Layer vs Existing Infrastructure
*Generated 2026-02-23 — Pre-Build Dependency Audit (Final Pass)*

---

## PURPOSE

The FINAL_SYNTHESIS.md was produced by a multi-Claude council that had no visibility into the
actual codebase. This document maps every synthesis concept to what already exists, flags
conflicts, and provides the corrected implementation path. **Any deviation from this map
during build requires explicit approval.**

---

## SECTION 1: CRITICAL CONFLICTS (Must Resolve Before Sprint 0)

### 1.1 ClientTask Already Exists — DO NOT Create Parallel "Task" Table

**Synthesis proposed:** New `Task` table with id, tenantId, clientId, title, type, status, priority...
**Reality:** `ClientTask` already exists with 30+ fields covering the full task lifecycle:
- Identity: id (Int autoincrement), clientId, title, description, category, source
- Pipeline: priority (P1-P4), status (queued → complete/rejected/cancelled), sortOrder, dueDate
- Content: contentBrief (Json), draftContent, approvedContent, deployedUrl, outcomeMetrics
- Assignment: assignedToUserId (Int FK → User), assignedByUserId (Int FK → User)
- Timing: createdAt, updatedAt, startedAt, completedAt, deployedAt, measuredAt, statusChangedAt
- Context: scanId, domainId, targetKeywords (Json), competitorRef
- Relations: ClientNote[], TaskTransition[], ClientProfile, User (assignee), User (assigner)

**Resolution:** Extend ClientTask with new columns. DO NOT create a new Task table.

### 1.2 Status Machine Already Exists — DO NOT Rebuild

**Location:** `src/lib/tasks/status-machine.ts`
**Provides:**
- 9 states: queued, in_progress, review, approved, deployed, measuring, complete, rejected, cancelled
- Transition rules with permission requirements (requiresElevated, requiresComment)
- Priority system: P1-P4 with labels, colors, weights
- Helper sets: ACTIVE_STATUSES, TERMINAL_STATUSES, DONE_STATUSES

**Resolution:** Import and extend the existing status machine. Add new states only if genuinely needed.

### 1.3 AdminTask Exists as Separate Internal Queue

**Schema:** AdminTask has id, title, description, category (onboarding/setup/billing/ops/followup/other), priority (P1-P4), status (open/in_progress/done/cancelled), assignedToId, createdById, subjectUserId, dueDate, completedAt, notes.

**Implication:** Three task systems exist: ClientTask (client work), AdminTask (internal ops), and the synthesis proposed a unified Task. The operations layer should NOT unify these — they serve different purposes. ClientTask is the primary operational unit; AdminTask handles internal admin work.

### 1.4 User IDs Are Int, Not String

**Every** user/client FK in the schema uses `Int @id @default(autoincrement())`. The synthesis used String UUIDs throughout. All new tables must use Int for user/client foreign keys.

### 1.5 Zero tenantId Anywhere

The schema has no tenantId on any table. `src/lib/tenant/` exists but uses file-based config with a single GHM tenant. Operations layer should NOT add tenantId columns — multi-tenancy is handled at the middleware/context level, not per-row.

---

## SECTION 2: EXISTING INFRASTRUCTURE THE SYNTHESIS DIDN'T KNOW ABOUT

### 2.1 Task Infrastructure (Sprint 1 is ~60% Built)

**Task API Routes (already implemented):**
- `POST /api/tasks` — Create task
- `GET /api/tasks/dashboard` — Dashboard task view
- `GET /api/tasks/queue` — Queue view with filtering
- `PUT /api/tasks/reorder` — Drag-and-drop reordering
- `POST /api/tasks/recalculate-priorities` — Priority recalculation
- `PUT /api/tasks/[id]/transition` — Status transition
- `PUT /api/tasks/[id]/approve` — Approve task
- `PUT /api/tasks/[id]/reject` — Reject task
- `PUT /api/tasks/[id]/request-changes` — Request changes
- `PUT /api/tasks/[id]/assign` — Assign to user
- `POST /api/tasks/[id]/generate-brief` — AI content brief generation
- `GET /api/tasks/[id]/history` — Transition history

**Task UI (already implemented):**
- `TasksPageClient` — Two-tab shell (Work + Approvals)
- `TaskQueueClient` — Drag-and-drop queue with DndKit, category filtering, priority badges, task detail sheet, status transitions, list/grid view toggle
- `ApprovalsTab` — Content review queue for elevated users
- `MyTasksWidget` — Dashboard widget showing assigned tasks

**Task Transition Tracking:**
- `TaskTransition` model stores fromStatus, toStatus, userId, comment, createdAt

### 2.2 Competitive Scan Pipeline (Complete 8-Step Workflow)

**Location:** `src/lib/competitive-scan/`
**Files:** executor.ts, data-fetcher.ts, delta-calculator.ts, alert-generator.ts, task-creator.ts, health-score.ts, intel-processor.ts, index.ts

**executor.ts flow:**
1. Fetch data (client + competitors) via data-fetcher
2. Calculate deltas (vs previous scan + vs competitors) via delta-calculator
3. Generate alerts (significant changes) via alert-generator → returns {critical[], warning[], info[]}
4. Calculate health score via health-score → weighted: Digital Assets 20%, Reviews 20%, Speed 15%, Momentum 25%, Competitive 20%
5. Save scan to `CompetitiveScan` table (clientData, competitors, deltas, alerts, healthScore, apiCosts as Json)
6. Create tasks from actionable alerts via task-creator → creates `ClientTask` records with scanId link
7. Update client profile (healthScore, lastScanAt, nextScanAt)
8. Run upsell detection → saves high-value opportunities (score ≥ 80) to `UpsellOpportunity`

**Batch execution:** `executeBatchScan()` processes multiple clients sequentially with 2s rate limiting.

**alert-generator.ts** transforms deltas into alerts with severity levels:
- Thresholds: CRITICAL_DECLINE (-20%), WARNING_DECLINE (-10%), etc.
- Alert types: backlink_loss, review_decline, speed_degradation, competitor_gain, gap_widening, ranking_gain, ranking_drop

**task-creator.ts** auto-creates ClientTask records from actionable alerts:
- Links tasks to scanId for traceability
- Builds contentBrief from alert details
- Maps alert categories to ClientTask categories

### 2.3 Alert-Like Systems Already Running

**Competitive Scan Alerts:** Generated during scan execution, stored as Json in CompetitiveScan.alerts. The task-creator converts actionable alerts to ClientTask records.

**Upsell Detector:** `src/lib/upsell/detector.ts` — analyzes scan alerts to identify product upsell opportunities. GAP_TO_PRODUCT_MAP maps gap categories to products. Calculates opportunityScore from severity + client health + pricing model. Already integrated into scan pipeline.

**Payment Escalation:** `src/app/api/cron/payment-check/` — checks invoice statuses and can create ClientTask records for overdue payment follow-ups.

**Implication for new AlertEvent system:** The new alert rule engine should fire AFTER scan execution completes, consuming the alerts that are already being generated. Don't rebuild alert generation — add a rule evaluation layer on top.

### 2.4 API Provider Integrations (Sprints 2-6 are Wiring, Not Building)

**Enrichment providers (all built):**
- `src/lib/enrichment/providers/google-business/` — client.ts, insights.ts, posts.ts, reviews.ts
- `src/lib/enrichment/providers/google-ads/` — client.ts, campaigns.ts
- `src/lib/enrichment/providers/dataforseo.ts` — DataForSEO integration
- `src/lib/enrichment/providers/ahrefs.ts` — Ahrefs integration
- `src/lib/enrichment/providers/pagespeed.ts` — PageSpeed Insights
- `src/lib/enrichment/providers/nap-scraper/` — health.ts, matcher.ts, registry.ts, scanner.ts, scraper.ts
- `src/lib/enrichment/cache.ts` — EnrichmentCache with TTL
- `src/lib/enrichment/cost-tracker.ts` — EnrichmentCostLog per-call tracking

**OAuth (built):**
- `src/lib/oauth/google.ts` — Google OAuth implementation
- `src/lib/oauth/google-ads.ts` — Google Ads OAuth
- `src/lib/oauth/encrypt.ts` — Token encryption (AES-256-GCM)
- `GBPConnection` table with accessTokenEnc, refreshTokenEnc, accountId, locationId
- `GoogleAdsConnection` table with OAuth + customerId

**Rank tracking (built):**
- `KeywordTracker` + `RankSnapshot` tables
- `PendingRankTask` for async DataForSEO polling
- `src/lib/enrichment/rankings.ts` — ranking data handling
- Crons: `rank-tracking` (post tasks) + `rank-poll` (collect results)

**Citation/NAP (built):**
- `CitationScan` + `DirectoryHealth` tables
- Crons: `nap-scan` + `nap-health-check`

### 2.5 AI Infrastructure (Sidecars Already Have a Home)

**Location:** `src/lib/ai/`
- `client.ts` — AI client wrapper
- `router/` — complexity-analyzer.ts, model-benchmarks.ts, model-router.ts, types.ts
- `cost-tracker.ts` — AICostLog per-call tracking
- `task-intelligence.ts` — generateContentBrief, calculateTaskPriority, suggestNextTasks
- `context/system-prompt-builder.ts` — prompt construction

**Model router uses Free Energy = Uncertainty × Cost:**
- Routes to Haiku/Sonnet/Opus based on complexity/domain/performance history
- Cascade strategy for complex queries

**Implication:** Sprint sidecars (GMB post drafts, keyword briefs, report narratives) should call existing AI client and router — not create new AI integrations.

### 2.6 Report System (Sprint 5 Extends, Doesn't Replace)

- `ClientReport` table: id, clientId, type, periodStart, periodEnd, content (Json), pdfUrl, sentToClient
- `src/lib/reports/generator.ts` — report generation orchestrator
- `src/lib/reports/template.ts` — report templates
- `src/lib/reports/sections/` — citation-health.ts, gbp-performance.ts, ppc-performance.ts, rank-tracking.ts

**Resolution:** Sprint 5 adds AI narrative layer to existing report sections and extends the content Json. Does NOT create new MonthlyReport table.

### 2.7 Cron Infrastructure (9 Active Jobs)

| Cron | Purpose | Frequency |
|------|---------|-----------|
| daily-scans | Execute competitive scans for due clients | Daily |
| generate-payments | Create PaymentTransaction records | Monthly |
| invoice-monthly | Create Wave invoices | Monthly |
| invoice-status-poll | Poll Wave for invoice status updates | Daily |
| nap-health-check | Check directory scraper health | Daily |
| nap-scan | Run NAP citation scans | Weekly |
| payment-check | Escalate overdue payments | Daily |
| gbp-snapshot | Aggregate GBP insight totals → GbpSnapshot | Weekly (Mon 4am) |
| rank-poll | Poll DataForSEO for pending rank results | Hourly |
| rank-tracking | Post new rank tracking tasks to DataForSEO | Daily |

**Deployment:** Configured in `vercel.json` as Vercel Cron Jobs.

### 2.8 Dashboard & Navigation

**Master Dashboard (`/master`):**
- Server component with parallel data fetching (metrics, funnel, rep data, MRR growth, context stats, settings, team users, saved layout)
- `MasterDashboardGrid` — react-grid-layout draggable widget grid with saved layout per user
- Existing widgets: MetricsRow, QuickActions, RevenueMetrics, Goals, PipelineFunnel, RepLeaderboard, MyTasksWidget, ManagementFees, CompanyProfitability
- User layout saved to `User.dashboardLayout` (Json field)

**Nav (`src/components/dashboard/nav.tsx`):**
- Grouped collapsible sidebar: Prospects (Discovery, Pipeline), Clients (Portfolio, Tasks, Content Studio, Website Studio), Insights (Analytics), Finance (Payments), Team (Service Catalog, Vault)
- Permission-gated links
- Mobile bottom nav
- Dashboard link is role-specific (/master vs /sales)

**Implication for Sprint 7 (Hub Redesign):**
- Add new nav group for Ops (Alerts, Health Monitor, Data Sources) or extend Insights
- Add new widgets to MasterDashboardGrid (Alerts, Health Overview, Data Source Status)
- Don't rebuild the dashboard — extend the grid

### 2.9 GlobalSettings — Centralized Config

**Fields relevant to operations layer:**
- Feature toggles: contentStudioEnabled, scanningEnabled, voiceCaptureEnabled, bugReportingEnabled
- Scan settings: scanFrequencyDays, scanCostLimit
- Notification settings: emailNotifications, taskAssignmentAlerts, scanCompleteAlerts, pushMessagesEnabled, pushTasksEnabled
- API keys: openaiApiKey, googleApiKey, semrushApiKey, ahrefsApiKey (encrypted)
- Goals: goalsEnabled, monthlyDealTarget, monthlyRevenueTarget

**Also:** `AppSetting` model exists as key/value store for runtime config.

**Resolution:** Operations layer reads GlobalSettings for feature flags and notification preferences. Use AppSetting for new ops-specific runtime config (alert thresholds, scan schedules). Don't create new config tables.

### 2.10 Other Systems (Don't Touch)

| System | Location | Notes |
|--------|----------|-------|
| Auth/Session | src/lib/auth/ | NextAuth with session, permissions, roles |
| Permissions | src/lib/permissions/ | checker, middleware, presets — granular per-feature flags stored as Json on User |
| Realtime | src/lib/realtime/ | SSE-based event-store + use-realtime hook |
| Push | src/lib/push.ts | Web push via PushSubscription table |
| Email | src/lib/email/ | Templates + sending |
| Wave | src/lib/wave/ | Full accounting integration (accounts, bills, customers, invoices, sync, webhooks) |
| Basecamp | src/lib/basecamp/client.ts | External project management integration |
| SCRVNR | src/lib/scrvnr/voice-capture.ts | Voice/DNA extraction for content generation |
| Tenant | src/lib/tenant/ | File-based tenant config (GHM only) |
| Monitoring | src/lib/monitoring/performance.ts | Performance tracking |
| Audit | src/lib/audit-log.ts | AuditLog table + logging utility |
| Bug tracking | src/lib/bug-tracking.ts | BugReport table + UI |
| Vault | src/lib/vault/vault.ts | File storage with Vercel Blob |
| Team messaging | TeamMessage + TeamMessageRead | Audience-based messaging with read tracking |
| Content versioning | ClientContent + ContentVersion | Content generation with version history |

---

## SECTION 3: REVISED TABLE PLAN

### New Tables (genuinely needed)

| Table | Purpose | Sprint |
|-------|---------|--------|
| TaskChecklistItem | Checklist items within a task | 1 |
| TaskChecklistTemplate | Reusable checklist templates | 1 |
| RecurringTaskRule | Cron-like rules for auto-creating tasks | 1 |
| AlertEvent | Structured alert records (replaces Json storage) | 0 |
| NotificationEvent | User-facing notifications | 0 |
| AlertRule | Configurable alert conditions | 0 |
| TaskAlertLink | Many-to-many: tasks ↔ alerts | 0 |
| DataSourceStatus | Health tracking for external APIs | 0 |
| SiteHealthSnapshot | Point-in-time site health data | 2 |
| GbpSnapshot | Point-in-time GBP metrics | 3 |
| PpcSnapshot | Point-in-time PPC metrics | 6 |

### Column Migrations (extend existing tables)

**ClientTask — add columns:**
- `recurringRuleId` Int? — FK to RecurringTaskRule
- `sourceAlertId` Int? — FK to AlertEvent (replaces scanId for alert-originated tasks)
- `blockedReason` String? — why task is blocked
- `checklistComplete` Boolean @default(false) — quick filter for tasks with checklists

**GlobalSettings — add columns:**
- `opsAlertThresholds` Json? — configurable alert rule defaults
- `opsAutoTaskEnabled` Boolean @default(true) — toggle auto task creation from alerts

### Tables NOT Being Created (already exist or not needed)

- ~~Task~~ → Use ClientTask
- ~~UserSession~~ → Client-side Zustand store + localStorage
- ~~KeywordRanking~~ → Use KeywordTracker + RankSnapshot
- ~~PageRecord~~ → Use ComposerPage (Website Studio)
- ~~SiteHealthCheck~~ → Use SiteHealthSnapshot (new, simpler)
- ~~GmbActivity~~ → Use GbpSnapshot (new, structured)
- ~~Cluster/ClusterSite~~ → Use WebProperty (Website Studio)
- ~~MonthlyReport~~ → Extend ClientReport

---

## SECTION 4: PERMISSIONS IMPACT

**New permission flags to add to UserPermissions interface:**
- `canViewAlerts` — see AlertEvent feed
- `canManageAlertRules` — create/edit AlertRule configs
- `canViewOperationalHealth` — see DataSourceStatus, health monitors
- `canApproveClusterSites` — approve Website Studio deployments

**Existing permissions leveraged:**
- `manage_clients` → task assignment, content approval
- `view_analytics` → operational dashboards
- `manage_settings` → alert rule configuration

---

## SECTION 5: INTEGRATION FLOW MAP

### Scan → Alert → Task Pipeline (Revised)

```
Cron: daily-scans
  → executeScan() [existing]
    → data-fetcher → delta-calculator → alert-generator → {critical[], warning[], info[]}
    → health-score → weighted score
    → Save CompetitiveScan record [existing]
    → task-creator → creates ClientTask records [existing]
    → upsell-detector → saves UpsellOpportunity [existing]
    → [NEW] AlertRule evaluation engine
      → Reads CompetitiveScan.alerts
      → Evaluates AlertRule conditions
      → Creates AlertEvent records
      → For rules with autoCreateTask=true → creates ClientTask via task-creator
      → For rules with notify=true → creates NotificationEvent
      → Links AlertEvent ↔ ClientTask via TaskAlertLink
```

### Payment → Alert Pipeline (Revised)

```
Cron: payment-check [existing]
  → Polls InvoiceRecord statuses
  → Updates ClientProfile.paymentStatus
  → [NEW] AlertRule evaluation
    → Condition: paymentStatus changed to 'overdue'
    → Creates AlertEvent (type: payment_overdue)
    → Auto-creates ClientTask (category: billing)
    → Creates NotificationEvent
```

### Report Generation Pipeline (Revised)

```
RecurringTaskRule (type: monthly_report)
  → Creates ClientTask (category: reporting, status: queued)
  → AI sidecar generates narrative sections
  → Extends ClientReport.content Json
  → Generates PDF via existing report generator
  → Marks task as deployed when sentToClient=true
```

---

## SECTION 6: NAV & UI INTEGRATION

### Sidebar Changes (Sprint 7)

Add new nav group between Insights and Finance:
```typescript
{
  id: "operations",
  label: "Operations",
  elevatedOnly: true,
  defaultExpanded: false,
  links: [
    { href: "/alerts", label: "Alert Feed", icon: "🔔", permission: "canViewAlerts" },
    { href: "/health", label: "Health Monitor", icon: "💚", permission: "canViewOperationalHealth" },
  ],
}
```

### Dashboard Widget Additions (Sprint 7)

Add to MasterDashboardGrid children:
- `"alerts"` — Recent critical/warning alerts
- `"data-sources"` — DataSourceStatus health indicators
- `"ops-health"` — Aggregate operational health score

### Tasks Page Extensions (Sprint 1)

The existing tasks page has Work + Approvals tabs. Operations layer adds:
- Checklist rendering in task detail sheet
- Recurring task badge/indicator
- Alert source link (when task originated from AlertEvent)
- No new tabs needed — the two-tab structure is correct

---

## SECTION 7: SESSION CONTEXT (Simplified)

**Synthesis proposed:** UserSession database table for tracking current focus.
**Reality:** Solo operator (David) + small team. Database session tracking is overkill.

**Resolution:** Client-side only:
- Zustand store: currentClientId, mode (hub/client/response), enteredAt
- Persist to localStorage
- No database table
- If team scales past 5, reconsider

---

## SECTION 8: RISK REGISTER

| Risk | Severity | Mitigation |
|------|----------|------------|
| Alert-generator refactor breaks existing scan pipeline | HIGH | New AlertRule engine runs AFTER scan, reads existing alerts Json. Does NOT modify alert-generator.ts |
| Status machine incompatibility | MEDIUM | Import existing status-machine.ts, extend only if new states truly needed |
| Task UI component refactor scope creep | MEDIUM | Sprint 1 extends existing components (add checklist, recurring badge). No full rewrite |
| MasterDashboardGrid layout breakage | LOW | New widgets get default positions, user layouts preserved via saved dashboardLayout |
| Cron timing conflicts | LOW | New recurring task cron runs at different time than existing 9 crons |
| Permission flag additions break existing users | LOW | New flags default to false, add via migration + presets update |
| GlobalSettings columns break existing settings page | LOW | New columns have defaults, settings page UI extended in Sprint 7 |

---

## SECTION 9: THINGS THAT DO NOT GET TOUCHED

- Lead pipeline (Lead, LeadHistory, CompetitiveIntel)
- Commission engine (UserCompensationConfig, ClientCompensationOverride, PaymentTransaction)
- Wave billing integration (InvoiceRecord, WebhookEvent, Wave lib)
- Discovery system (DiscoveryRun, LocationPreset)
- Onboarding portal (OnboardingToken, OnboardingSubmission)
- Content versioning (ClientContent, ContentVersion)
- Bug reporting (BugReport)
- Team messaging (TeamMessage, TeamMessageRead)
- Audit logging (AuditLog)
- Enrichment cache (EnrichmentCache, EnrichmentCostLog)
- OAuth flows (google.ts, google-ads.ts, encrypt.ts)
- SCRVNR/Voice (VoiceProfile, DnaCapture, DnaTokenOverride, ScrvnrGateResult)
- Website Studio core (WebProperty, BuildJob, ComposerPage) — Sprint 4 adds approval workflow ON TOP

---

## SECTION 10: REVISED SPRINT ROADMAP (SUMMARY)

| Sprint | Name | Scope (Adjusted for Reality) |
|--------|------|------------------------------|
| 0 | Foundation ✅ COMPLETE | Schema migration (8 new tables + column migrations), alert rule engine, notification system, DataSourceStatus tracking, recurring task engine, 9 API routes, wired into 3 crons |
| 1 | Execution Spine ✅ COMPLETE | Checklist CRUD (5 routes), checklist templates (2 routes), TaskChecklist UI, recurring tasks page + form, origin badges in task sheet, queue API + QueueTask type updated, nav link |
| 2 | Site Health ✅ COMPLETE | SiteHealthSnapshot table + PageSpeed cron + extend client detail page |
| 3 | SEO + GMB | GbpSnapshot + extend existing rank tracking UI + GMB insights dashboard |
| 4 | Cluster Manager | Approval workflow on existing WebProperty system |
| 5 | Reports | AI narrative layer on existing ClientReport + auto-generation via RecurringTaskRule |
| 6 | PPC | PpcSnapshot + extend existing Google Ads integration |
| 7 | Hub Redesign | New nav group + new dashboard widgets + alert feed page + health monitor page |
| 8 | Health Score | Unified health score integrating all domain snapshots |

**Key insight:** Sprints 2-6 are primarily wiring existing provider integrations into structured snapshot tables and extending existing UI — NOT building from scratch. Sprint 1 is extending a working task system, not creating one.
