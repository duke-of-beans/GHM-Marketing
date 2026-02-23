# GHM DASHBOARD — OPERATIONS LAYER ARCHITECTURE
## Final Council Synthesis — Build-Authoritative
**Date:** February 23, 2026
**Status:** APPROVED — Begin Implementation
**Scope:** Operational layer only. Payments, onboarding, sales pipeline, and data infrastructure are untouched.

---

## CORE ARCHITECTURE: UNANIMOUS DECISIONS

These decisions are settled. No further debate.

**Task is the atomic unit.** Every workflow is a signal emitter that produces tasks. Every module plugs into the task engine. There are no independent systems — only domain adapters on a single execution spine.

**SessionContext before UI.** Every component is session-aware from birth. Retrofitting is prohibitively expensive.

**Alert ≠ Notification.** Separate tables, separate rendering, separate lifecycle. This is cognitive architecture, not a team feature.

**Solo-to-team via data enrichment and UI disclosure.** Same tables, same queries, same components. More fields revealed as humans are added. No mode switches. No settings toggles. No rebuilds.

**String types, not DB enums.** Task types, statuses, and alert sources are strings. Covos tenants will invent types we can't predict.

**`tenantId` on every new table.** Non-negotiable for Covos productization path.

**Templates are factories, not live references.** Checklist items are copied at task creation time. Updating a template never mutates in-flight tasks.

**AlertRules live in the database from day one.** Not code-first-then-migrate. JSON condition objects evaluated by cron. Initial rules are seed data inserted on deploy.

---

## DESIGN CONSTRAINTS

Six guidelines agreed before council convened:

1. **SessionContext is user-scoped.** Each user has their own session. Hub shows "my clients" (operator) or "all clients with who's-working-on-what" (manager).
2. **Assignment scales from one.** `assignedToId` on every task, hidden in UI when solo. Appears when second user exists.
3. **Alerts are universal.** Same system at 1 user and 10 users.
4. **AI scales by role.** Solo: draft → accept. Team: draft → delegate. Manager: summarize → flag.
5. **Gavin's view is the owner template.** Build as role-based view, not person-specific.
6. **Daily Queue scales to per-user queues.** Same algorithm, different input set based on assignment.

**Overarching:** The system feels like a solo command center with one person and naturally expands into team orchestration as people are added.

---

## DATA MODEL

All tables include `tenantId`, `createdAt`, `updatedAt` unless noted.

### Task Engine

```prisma
model Task {
  id               String    @id @default(cuid())
  tenantId         String    @map("tenant_id")
  clientId         String    @map("client_id")
  title            String
  description      String?
  type             String    // string, extensible: 'seo', 'ppc', 'gmb', 'website', 'content', 'admin', 'report', 'cluster'
  status           String    @default("backlog") // 'backlog', 'queued', 'in_progress', 'ready_for_review', 'approved', 'done'
  priority         String    @default("medium") // 'critical', 'high', 'medium', 'low'
  blocked          Boolean   @default(false)
  blockedReason    String?   @map("blocked_reason")
  dueAt            DateTime? @map("due_at")
  assignedToId     String    @map("assigned_to_id")
  createdById      String    @map("created_by_id")
  source           String    @default("manual") // 'manual', 'system', 'recurring', 'import'
  sourceAlertId    String?   @map("source_alert_id")
  recurringRuleId  String?   @map("recurring_rule_id")
  completedAt      DateTime? @map("completed_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  // Relations
  client           ClientProfile @relation(fields: [clientId], references: [id])
  assignedTo       User          @relation("taskAssignee", fields: [assignedToId], references: [id])
  createdBy        User          @relation("taskCreator", fields: [createdById], references: [id])
  checklistItems   TaskChecklistItem[]
  linkedAlerts     TaskAlertLink[]

  @@map("tasks")
}

model TaskChecklistItem {
  id            String    @id @default(cuid())
  taskId        String    @map("task_id")
  label         String
  isRequired    Boolean   @default(true) @map("is_required")
  isCompleted   Boolean   @default(false) @map("is_completed")
  order         Int
  completedAt   DateTime? @map("completed_at")

  task          Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("task_checklist_items")
}

model TaskChecklistTemplate {
  id         String   @id @default(cuid())
  tenantId   String   @map("tenant_id")
  taskType   String   @map("task_type")
  name       String
  items      Json     // Array of { label, isRequired, order }
  isDefault  Boolean  @default(false) @map("is_default")
  version    Int      @default(1)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("task_checklist_templates")
}

model RecurringTaskRule {
  id               String    @id @default(cuid())
  tenantId         String    @map("tenant_id")
  clientId         String?   @map("client_id") // null = all clients
  taskType         String    @map("task_type")
  title            String
  templateId       String?   @map("template_id")
  cadence          String    // 'daily', 'weekly', 'monthly', 'custom'
  customDays       Int?      @map("custom_days")
  nextRunAt        DateTime  @map("next_run_at")
  deduplicationKey String    @map("deduplication_key") // prevents duplicate active tasks
  enabled          Boolean   @default(true)
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  @@map("recurring_task_rules")
}
```

### Alert System

```prisma
model AlertEvent {
  id               String    @id @default(cuid())
  tenantId         String    @map("tenant_id")
  clientId         String?   @map("client_id")
  userId           String    @map("user_id") // who should see it
  severity         String    // 'critical', 'amber'
  source           String    // 'site_health', 'keyword', 'gmb', 'ppc', 'payment', 'system', 'recurring_stalled'
  title            String
  description      String?
  actionType       String    @map("action_type") // 'create_task', 'navigate', 'external'
  actionPayload    Json?     @map("action_payload") // pre-populated task data, route, or URL
  status           String    @default("active") // 'active', 'acknowledged', 'snoozed', 'dismissed', 'resolved'
  snoozedUntil     DateTime? @map("snoozed_until")
  resolvedByTaskId String?   @map("resolved_by_task_id")
  createdAt        DateTime  @default(now()) @map("created_at")
  acknowledgedAt   DateTime? @map("acknowledged_at")
  resolvedAt       DateTime? @map("resolved_at")

  linkedTasks      TaskAlertLink[]

  @@map("alert_events")
}

model NotificationEvent {
  id         String    @id @default(cuid())
  tenantId   String    @map("tenant_id")
  userId     String    @map("user_id")
  category   String    // 'report', 'task', 'system', 'payment', 'recurring_skipped'
  title      String
  body       String?
  link       String?
  isRead     Boolean   @default(false) @map("is_read")
  createdAt  DateTime  @default(now()) @map("created_at")
  readAt     DateTime? @map("read_at")
  expiresAt  DateTime  @map("expires_at") // auto-clear after 7 days

  @@map("notification_events")
}

model AlertRule {
  id              String    @id @default(cuid())
  tenantId        String    @map("tenant_id")
  name            String
  source          String    // matches AlertEvent.source
  conditionConfig Json      @map("condition_config") // { metric, operator, threshold }
  alertTemplate   Json      @map("alert_template") // { severity, title_template, description_template }
  actionTemplate  Json      @map("action_template") // { type, payload_template }
  cooldownMinutes Int       @default(60) @map("cooldown_minutes")
  lastFiredAt     DateTime? @map("last_fired_at")
  enabled         Boolean   @default(true)
  createdAt       DateTime  @default(now()) @map("created_at")

  @@map("alert_rules")
}

model TaskAlertLink {
  id           String   @id @default(cuid())
  taskId       String   @map("task_id")
  alertEventId String   @map("alert_event_id")
  createdAt    DateTime @default(now()) @map("created_at")

  task         Task       @relation(fields: [taskId], references: [id])
  alert        AlertEvent @relation(fields: [alertEventId], references: [id])

  @@unique([taskId, alertEventId])
  @@map("task_alert_links")
}
```

### Infrastructure

```prisma
model DataSourceStatus {
  id               String    @id @default(cuid())
  tenantId         String    @map("tenant_id")
  sourceName       String    @map("source_name") // 'brightlocal', 'gsc', 'gmb', 'google_ads', 'pagespeed', 'wave'
  lastSuccessAt    DateTime? @map("last_success_at")
  lastErrorAt      DateTime? @map("last_error_at")
  lastErrorMessage String?   @map("last_error_message")
  errorCount       Int       @default(0) @map("error_count")
  status           String    @default("healthy") // 'healthy', 'degraded', 'down'
  updatedAt        DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, sourceName])
  @@map("data_source_statuses")
}

model UserSession {
  userId          String   @id @map("user_id")
  tenantId        String   @map("tenant_id")
  currentClientId String?  @map("current_client_id")
  mode            String   @default("survey") // 'survey', 'session', 'response'
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("user_sessions")
}
```

**Total new tables: 10** (Task, TaskChecklistItem, TaskChecklistTemplate, RecurringTaskRule, AlertEvent, NotificationEvent, AlertRule, TaskAlertLink, DataSourceStatus, UserSession)

Domain-specific tables (KeywordRanking, PpcSnapshot, GmbActivity, SiteHealthCheck, PageRecord, Cluster, ClusterSite, MonthlyReport) are added in their respective phases.

---

## FRONTEND ARCHITECTURE

### SessionContext (Zustand Store)

```typescript
interface SessionState {
  currentClientId: string | null;
  mode: 'survey' | 'session' | 'response';
  enteredAt: Date | null;
}

interface SessionActions {
  enterSession: (clientId: string) => void;
  exitSession: () => void;
  enterResponseMode: () => void;
}
```

Persists to localStorage for multi-tab recovery. Syncs to UserSession table on change for presence visibility. Provider wraps the app layout.

SessionContext drives: sidebar rendering (full nav vs client-scoped), data fetching scope (all clients vs filtered), alert display (show all vs queue non-current), header state (client color bar + session timer).

### Component Pattern: Compact/Full Sub-Components

Every data-displaying component exports two sub-components sharing a common data hook:

```typescript
// Example: GmbStatus
export const GmbStatus = {
  Compact: () => { /* health dot, days since post, one-line */ },
  Full: () => { /* calendar, review queue, post history, action buttons */ },
};

// Both use:
function useGmbData(clientId: string) { /* shared data fetching */ }
```

This is semantic density, not responsive CSS. A compact component on a 4K monitor still renders compact. Responsive layout is orthogonal.

### AI Sidecar Interface

```typescript
interface AIAction {
  id: string;
  label: string;
  level: 2; // Level 2 only for now (contextual, explicit buttons)
  handler: (context: any) => Promise<AIResult>;
}

interface AIResult {
  content: string;
  type: 'draft' | 'suggestion' | 'analysis';
  actions: ('accept' | 'edit' | 'regenerate')[];
}
```

All AI sidecars call the existing Content Studio service. One AI backend, many entry points. AI content always labeled "AI draft" with Accept | Edit | Regenerate controls. Nothing client-facing without explicit human acceptance.

---

## BACKEND SERVICES

### Rule Engine (`/lib/rules/engine.ts`)

Queries AlertRule table. Evaluates conditions against latest data snapshots. Creates AlertEvents via the alert router. Called by cron job (configurable interval, default 15 minutes for critical checks, daily for non-urgent).

Supported condition operators: `gt`, `lt`, `eq`, `daysSince`, `percentChange`. Covers every case in the blueprints without needing a generic rule language.

### Alert Router (`/lib/alerts/router.ts`)

Determines which userId receives an alert based on client assignment. Solo mode: always the single user. Team mode: assigned client owner, with critical alerts additionally copying to admin role. Single function, not scattered across modules.

### Task Factory (`/lib/tasks/factory.ts`)

Creates tasks from templates (copy-on-create pattern for checklists). Handles recurring rule deduplication: before creating, checks for active tasks with same `recurringRuleId` + `clientId` + status not DONE/APPROVED. If found, escalates existing task priority and emits notification instead of creating duplicate.

### Alert-Task Linker (`/lib/alerts/linker.ts`)

On manual task creation, soft-matches against open AlertEvents (same clientId + compatible type). If match found, UI prompts "Link to active alert?" with one-click confirm. On link, alert status transitions to RESOLVED.

### Operational Health Metrics (`/lib/health/operational.ts`)

Read-only interface consumed by existing health scoring function:

```typescript
getOperationalHealthData(clientId) => {
  taskCompletionRate      // last 30 days
  overdueTaskCount
  unresolvedCriticalAlerts
  daysSinceLastCompletedTask
}
```

The operational layer provides data. The health scoring module owns the calculation. No circular dependencies. Weights can be tuned without touching operational code.

---

## BUILD PHASES

Everything ships at final quality. Phases are sprints — each one delivers a complete, production-grade layer of the system. No MVPs, no placeholders, no "we'll fix it later."

### Phase 0 — Foundation (Sprint 1)

**Database:**
- Run migration for all 10 core tables
- Seed default AlertRules (uptime down, SSL expiring, 30-day no activity, recurring task stalled)
- Seed default TaskChecklistTemplates (new page SEO, existing page optimization, technical fix, GMB monthly post, monthly PPC review, site health check)

**Frontend:**
- SessionContext Zustand store with localStorage persistence
- UserSession sync on context change
- Component pattern documented with one reference implementation (TaskCard.Compact / TaskCard.Full)

**Backend:**
- Rule engine skeleton (reads AlertRule table, evaluates, creates AlertEvents)
- Alert router (userId resolution based on client assignment)
- Task factory (template copy-on-create, deduplication logic)
- Alert-task linker (soft-match on creation)

### Phase 1 — Execution Spine (Sprint 2)

**UI:**
- TaskCard.Compact (Daily Queue) and TaskCard.Full (Kanban)
- TaskDetail slide-out panel with checklist enforcement (block READY_FOR_REVIEW unless all required items checked)
- KanbanBoard with drag-and-drop and stage transition guards
- DailyQueue widget (homepage, max 7 items, priority algorithm: overdue → critical → blocked-self → high priority in_progress → GMB due in 3 days)
- AlertPanel slide-out (queries active AlertEvents, action buttons for Create Task / Dismiss / Snooze)
- Alert-to-Task one-click conversion (pre-populated from actionPayload)
- Manual task creation form with template-based checklist auto-population
- Bulk import script for master-tasks.json and Basecamp data

**Pages:**
- `/tasks` (Kanban view, default)
- `/tasks/list` (List view)
- Client Focus View: Tasks tab (session-scoped via SessionContext)

**Automation:**
- Cron: HTTP uptime check every 30 minutes for all client domains → AlertRule evaluation
- Cron: Daily recurring task spawner with deduplication
- RecurringTaskRules active: monthly GMB post, monthly report task

**At completion:** David opens the dashboard, sees Daily Queue populated from imported tasks, gets real-time alerts on site downtime, has a functional task pipeline for all work. System is operational.

### Phase 2 — Site Health + GMB (Sprint 3)

**New tables:** SiteHealthCheck, GmbActivity

**Backend:**
- Site Health cron: weekly PageSpeed API + SSL check + plugin audit
- GMB cron: daily overdue post check, review response queue
- AlertRules: PageSpeed < 60, SSL < 30 days, plugin vulnerabilities, GMB > 30 days no post, unresponded reviews > 48 hours
- DataSourceStatus entries for PageSpeed API

**UI:**
- Site Health tab in Client Focus View (health score gauge, component scores, active alerts, last check timestamp)
- GMB tab in Client Focus View (post calendar, review queue, "days since last post" prominent with red/green states, "Draft Post" AI sidecar button using Content Studio)

### Phase 3 — SEO + On-Page (Sprint 4)

**New tables:** KeywordRanking, PageRecord, PageChecklistItem

**Backend:**
- BrightLocal API integration for weekly keyword snapshots
- GSC integration (per-client OAuth tokens via vault)
- AlertRules: keyword drops ±3 positions, new crawl errors, indexing failures, Core Web Vitals regressions
- DataSourceStatus entries for BrightLocal and GSC

**UI:**
- SEO tab in Client Focus View (keyword table with position, change, trend sparkline; "Opportunities" filter for positions 11-20; "Losses" filter for drops > 3)
- Page Manager view (cross-client page lifecycle: draft → staged → QC → live → indexed → tracking)
- On-page QC checklist enforcement per page
- "Optimize" AI sidecar button on keyword rows (generates content brief via Content Studio)

### Phase 4 — Cluster Manager (Sprint 5)

**New tables:** Cluster, ClusterSite, ClusterSiteIssue

**Backend:**
- Cluster registry per T3 client
- Site stage progression: wireframe → built → submitted → approved → live → tracking
- Approval workflow: Gavin reviews, approves/requests changes

**UI:**
- Cluster tab in Client Focus View (T3 only)
- Site grid with stage progression per card
- Issue tracker per site
- Approval UI with role-gating (first real multi-user interaction — proves team scaling patterns)

**Why here:** This is the testing ground for `assignedToId` mattering (David builds, Gavin approves). First role-gated workflow validates the scaling architecture before it touches every other module.

### Phase 5 — Reports (Sprint 6)

**New tables:** MonthlyReport

**Backend:**
- Report data aggregation from Task completions, KeywordRanking, GmbActivity, SiteHealthCheck, PpcSnapshot
- AI narrative generation using Content Studio service
- PDF export with GHM branding

**UI:**
- Client Mode first (narrative-first, visual, branded — this is the client deliverable)
  - Page 1: Cover with client name, month, one-sentence AI summary, three KPI chips
  - Page 2: Highlights with visual ranking movement, work summary in plain English
  - Page 3: Detail tables for clients who want depth
  - Page 4: Next month priorities as commitments
- Editor Mode second (dense data, source attribution, "Regenerate Section" buttons, inline editing)
- Three templates: Full, SEO Only, Maintenance
- Gavin visibility: all reports accessible in owner role view

### Phase 6 — PPC (Sprint 7)

**New tables:** PpcSnapshot

**Backend:**
- Google Ads API integration (per-client via MCC or individual OAuth)
- Monthly performance snapshots
- AlertRules: CPA > 3x target, budget pacing anomalies, quality scores < 5
- DataSourceStatus for Google Ads API

**UI:**
- PPC tab in Client Focus View (campaigns, this month vs last month, top search terms, wasted spend alerts)
- Monthly PPC review task auto-generation

### Phase 7 — Hub Redesign + Gavin's View (Sprint 8)

**UI:**
- Client Vitals Strip (6 blocks, ~160px each, health arc indicator, 3 mini-dots for task/GMB/site status, alert badge)
- Redesigned Daily Queue with completion animation (item slides out, next slides up)
- Alert overlay integrated into hub
- Quick Stats bar (tasks completed this week/month, clients with open criticals, oldest overdue)
- **Gavin's Confidence Dashboard** (owner role view):
  - Header: "All clients are healthy as of [date/time]" (or specific issue statement)
  - Client cards: health arc, last report delivery checkmark, last activity recency, alert badge only when relevant
  - "Requires Your Attention" section: hidden when empty (prevents cry-wolf)
  - Activity stream: last 7 days completed tasks as brief items
- Mobile-optimized: Daily Queue, Vitals Strip, Alerts, Report Client Mode, task status changes

### Phase 8 — Health Score Integration + Polish

**Backend:**
- Integrate operational health metrics into existing health scoring function via read-only interface
- Notification auto-cleanup cron (expire after 7 days)
- DataSourceStatus Hub widget

**UI:**
- Data freshness indicators on Hub (shows if BrightLocal/GSC/etc haven't synced)
- System Health widget for admin view
- Keyboard shortcuts: Ctrl+K command palette, Ctrl+1-6 client shortcuts, Escape to exit session
- Empty states for every view (intentional, communicates next steps, never blank)

---

## ALERT FATIGUE CONTROLS (Active from Phase 0)

The system must be designed for the 30-alert morning, not the 2-alert afternoon.

- **Cooldown periods:** Per-rule `cooldownMinutes`. Don't re-alert on the same condition within the cooldown window.
- **Severity batching:** Multiple amber alerts from same source → grouped into single digest notification. Only critical alerts interrupt individually.
- **Snooze vs Dismiss:** Snooze = "come back tomorrow" (snoozedUntil field). Dismiss = "I saw this, not acting" (logged for audit). Resolve = "linked to a task or fixed."
- **Deduplication for recurring:** Recurring task stalled → escalate existing task + notification, don't create duplicate.
- **Conservative start:** Ship with 4-5 rules maximum. Add more only after the alert UX is proven in daily use.
- **Rule disable:** Any rule can be disabled per-tenant from settings.

---

## SOLO-TO-TEAM SCALING BEHAVIOR

| Feature | 1 User | 3 Users | 10 Users |
|---------|--------|---------|----------|
| **Tasks** | Auto-assigned, field hidden | Assignee dropdown visible, "My tasks" toggle | Round-robin rules, load balancing view, workload chart |
| **Daily Queue** | Global, all clients | Per-user, scoped to assigned clients. Manager sees aggregated blockers | Per-user + per-team queues. Manager dashboard shows queue health |
| **Session Mode** | Session = system state | Per-user sessions. Hub shows "Sarah is on Cerrones" | Collision detection: "Mike also has Cerrones open" |
| **Alerts** | All → single user | Routed by client assignment. Critical copies to admin | Configurable routing rules. Escalation chains |
| **AI Sidecars** | Draft → accept | Draft → delegate or accept. "Assign to [person]" action | Auto-routing + adoption metrics |
| **Reports** | Single editor | Editor + reviewer role (Gavin) | Editor per client, review workflow with approval chain |
| **Hub** | All clients visible | "My clients" default, "All clients" for managers | Team groupings, department views |

**Inflection points:**
- At 2 users: Assignment becomes real (field visible, per-user queues)
- At 5 users: Presence matters (UserSession indicators, collision warnings)
- At 10+ users: Management views necessary (workload distribution, escalation chains, approval workflows — Covos enterprise tier)

---

## RISK REGISTER

### Irreversible Decisions (Must Be Right)

| Decision | Status |
|----------|--------|
| Task schema: string types, JSON checklists, assignedToId from day one | LOCKED |
| Alert/Notification separation: two tables, two lifecycles | LOCKED |
| SessionContext boundaries: ONLY clientId + mode, nothing else | LOCKED |
| tenantId on every table | LOCKED |
| Templates as factories (copy-on-create) | LOCKED |
| AlertRules in database, not code | LOCKED |

### Reversible Decisions (Can Iterate)

| Decision | Current Approach |
|----------|-----------------|
| Daily Queue algorithm | Priority + overdue + blocked-self weighting |
| Alert cooldown periods | Per-rule cooldownMinutes |
| Compact/Full component boundaries | Defined per component |
| AI sidecar scope | Level 2 only (explicit buttons) |
| Health score operational weights | Initial hardcoded, later configurable |

### Active Threats

| Threat | Mitigation |
|--------|------------|
| Alert fatigue | Conservative rules, cooldowns, snooze, severity batching |
| External API fragility | DataSourceStatus table + Hub health indicators |
| Scope creep within sprints | Each sprint has defined table + UI + automation deliverables |
| SessionContext becoming god object | Strict boundary: clientId + mode only. All other state in URL or local component state |

---

## INTEGRATION PATTERNS

New modules observe and act upon existing infrastructure. They do not modify it.

**ClientProfile:** Anchor point. Every new table has `clientId` FK. Operational layer reads health score, tier, active status. Rarely writes.

**Content Studio:** AI service backend. All AI sidecars call Content Studio's existing generation service with brand voice profiles. One AI backend, many entry points. No parallel AI infrastructure.

**Existing cron infrastructure:** New crons follow established pattern: cron fires → data collected → stored in snapshot table → AlertRules evaluated → alerts/tasks auto-generated.

**Critical discipline:** New modules create new routes, new components, new pages. They do not modify existing API routes or components. Touch points with existing code limited to: reading from ClientProfile, calling Content Studio AI service, following established cron pattern.

---

## FIVE DESIGN TESTS (Every Screen Must Pass)

1. **3-Second Test:** Can user understand what this screen is about and what to do in 3 seconds?
2. **One Click Test:** Can the most common action be taken in one click?
3. **Data-to-Action Test:** Does every data point connect to a possible action?
4. **Solo Operator Test:** Does this screen assume other humans involved? (If yes, make those elements contextually visible based on team size)
5. **Empty State Test:** Intentional empty state that communicates next steps. Never blank space.

---

*This document is the authoritative architecture specification for the GHM Dashboard operational layer. All implementation follows this spec. Deviations require explicit approval.*

*End of Final Council Synthesis*
