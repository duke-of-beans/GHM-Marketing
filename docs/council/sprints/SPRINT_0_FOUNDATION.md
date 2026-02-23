# SPRINT 0 — FOUNDATION
## Schema Migration + Alert Engine + Notification System
*Dependency: CODEBASE_REALITY_MAP.md (read before building)*

---

## GOAL

Stand up the operational plumbing that all subsequent sprints depend on: new database tables, the alert rule evaluation engine, the notification delivery system, and external API health monitoring. Zero UI in this sprint — pure backend infrastructure.

---

## PRE-BUILD CHECKLIST

- [ ] Read CODEBASE_REALITY_MAP.md §1-§3 (conflicts + existing infra + table plan)
- [ ] Verify Prisma schema compiles with existing 60+ models
- [ ] Confirm all FKs use Int (not String)
- [ ] Confirm no tenantId columns added
- [ ] Run `npx prisma validate` before and after changes

---

## DELIVERABLES

### D1: Schema Migration

**New tables (8):**

```prisma
model AlertEvent {
  id            Int       @id @default(autoincrement())
  type          String    // "scan_alert" | "payment_overdue" | "rank_change" | "health_degraded" | "custom"
  severity      String    // "critical" | "warning" | "info"
  clientId      Int?      @map("client_id")
  title         String
  description   String?   @db.Text
  sourceType    String    @map("source_type")  // "competitive_scan" | "payment_check" | "rank_tracking" | "nap_scan" | "manual"
  sourceId      Int?      @map("source_id")    // FK to source record (scanId, invoiceId, etc.)
  metadata      Json?     // Structured alert data
  ruleId        Int?      @map("rule_id")      // Which AlertRule triggered this
  acknowledged  Boolean   @default(false)
  acknowledgedBy Int?     @map("acknowledged_by")
  acknowledgedAt DateTime? @map("acknowledged_at")
  autoTaskCreated Boolean @default(false) @map("auto_task_created")
  createdAt     DateTime  @default(now()) @map("created_at")

  client        ClientProfile? @relation(fields: [clientId], references: [id], onDelete: Cascade)
  rule          AlertRule?     @relation(fields: [ruleId], references: [id])
  taskLinks     TaskAlertLink[]

  @@index([clientId, createdAt(sort: Desc)])
  @@index([type, severity])
  @@index([acknowledged])
  @@index([createdAt(sort: Desc)])
  @@map("alert_events")
}

model AlertRule {
  id              Int       @id @default(autoincrement())
  name            String
  description     String?
  sourceType      String    @map("source_type")  // "competitive_scan" | "payment" | "rank" | "nap" | "health"
  conditionType   String    @map("condition_type") // "threshold" | "delta" | "status_change" | "missing_data"
  conditionConfig Json      @map("condition_config") // { field, operator, value, window }
  severity        String    @default("warning")
  isActive        Boolean   @default(true) @map("is_active")
  autoCreateTask  Boolean   @default(false) @map("auto_create_task")
  taskTemplate    Json?     @map("task_template") // { title, category, priority, contentBrief }
  notifyOnTrigger Boolean   @default(true) @map("notify_on_trigger")
  cooldownMinutes Int       @default(1440) @map("cooldown_minutes") // 24h default — don't re-fire same alert
  lastTriggeredAt DateTime? @map("last_triggered_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  alerts          AlertEvent[]

  @@index([sourceType, isActive])
  @@map("alert_rules")
}

model NotificationEvent {
  id          Int       @id @default(autoincrement())
  userId      Int       @map("user_id")
  type        String    // "alert" | "task_assigned" | "task_status" | "report_ready" | "system"
  title       String
  body        String?
  href        String?   // Deep link to relevant page
  alertId     Int?      @map("alert_id")
  read        Boolean   @default(false)
  readAt      DateTime? @map("read_at")
  channel     String    @default("in_app") // "in_app" | "push" | "email" | "all"
  delivered   Boolean   @default(false)
  deliveredAt DateTime? @map("delivered_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@index([userId, read, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@map("notification_events")
}

model TaskAlertLink {
  id        Int       @id @default(autoincrement())
  taskId    Int       @map("task_id")
  alertId   Int       @map("alert_id")
  createdAt DateTime  @default(now()) @map("created_at")

  task      ClientTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  alert     AlertEvent @relation(fields: [alertId], references: [id], onDelete: Cascade)

  @@unique([taskId, alertId])
  @@map("task_alert_links")
}

model DataSourceStatus {
  id                  Int       @id @default(autoincrement())
  provider            String    @unique // "dataforseo" | "ahrefs" | "pagespeed" | "google_business" | "google_ads" | "wave" | "outscraper"
  displayName         String    @map("display_name")
  status              String    @default("healthy") // "healthy" | "degraded" | "down" | "unknown"
  lastCheckAt         DateTime? @map("last_check_at")
  lastSuccessAt       DateTime? @map("last_success_at")
  lastFailureAt       DateTime? @map("last_failure_at")
  consecutiveFailures Int       @default(0) @map("consecutive_failures")
  avgLatencyMs        Int?      @map("avg_latency_ms")
  errorMessage        String?   @map("error_message")
  metadata            Json?     // Provider-specific health data
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@map("data_source_status")
}

model TaskChecklistItem {
  id          Int       @id @default(autoincrement())
  taskId      Int       @map("task_id")
  label       String
  isComplete  Boolean   @default(false) @map("is_complete")
  completedAt DateTime? @map("completed_at")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")

  task        ClientTask @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_checklist_items")
}

model TaskChecklistTemplate {
  id          Int       @id @default(autoincrement())
  name        String
  category    String    // Matches ClientTask.category values
  items       Json      // Array of { label, sortOrder }
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([category, isActive])
  @@map("task_checklist_templates")
}

model RecurringTaskRule {
  id              Int       @id @default(autoincrement())
  name            String
  clientId        Int?      @map("client_id") // null = applies to all active clients
  category        String    // ClientTask category
  title           String    // Template title (supports {clientName} interpolation)
  description     String?
  priority        String    @default("P3")
  checklistTemplateId Int?  @map("checklist_template_id")
  cronExpression  String    @map("cron_expression") // e.g. "0 9 1 * *" = 1st of month at 9am
  isActive        Boolean   @default(true) @map("is_active")
  lastRunAt       DateTime? @map("last_run_at")
  nextRunAt       DateTime? @map("next_run_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  tasks           ClientTask[]

  @@index([isActive, nextRunAt])
  @@map("recurring_task_rules")
}
```

**Column migrations on existing tables:**

```prisma
// Add to ClientTask model:
  recurringRuleId   Int?    @map("recurring_rule_id")
  sourceAlertId     Int?    @map("source_alert_id")
  blockedReason     String? @map("blocked_reason")
  checklistComplete Boolean @default(false) @map("checklist_complete")

  recurringRule     RecurringTaskRule? @relation(fields: [recurringRuleId], references: [id])
  checklistItems    TaskChecklistItem[]
  alertLinks        TaskAlertLink[]

// Add to ClientProfile model:
  alertEvents       AlertEvent[]
```

**Relation additions to User model:**
```prisma
  acknowledgedAlerts AlertEvent[] @relation("AlertAcknowledger") // needs acknowledgedBy FK
```

### D2: Alert Rule Evaluation Engine

**Location:** `src/lib/ops/alert-engine.ts`

**Pattern:** Post-scan hook. Called after `executeScan()` completes. Also callable from payment-check and rank-poll crons.

```typescript
// Core interface
interface AlertEngineInput {
  sourceType: "competitive_scan" | "payment" | "rank" | "nap" | "health";
  sourceId: number;
  clientId: number;
  data: Record<string, unknown>; // Source-specific data to evaluate against rules
}

// Main function
async function evaluateAlertRules(input: AlertEngineInput): Promise<{
  alertsCreated: AlertEvent[];
  tasksCreated: ClientTask[];
  notificationsSent: NotificationEvent[];
}>
```

**Implementation steps:**
1. Fetch active AlertRules where sourceType matches
2. For each rule, check cooldown (lastTriggeredAt + cooldownMinutes)
3. Evaluate conditionConfig against input data
4. If triggered: create AlertEvent, optionally create ClientTask (via existing task-creator pattern), create NotificationEvent
5. Update rule.lastTriggeredAt
6. Return created records for logging

**Integration points (wiring into existing crons):**
- `src/lib/competitive-scan/executor.ts` → Add `evaluateAlertRules()` call after step 8 (upsell detection)
- `src/app/api/cron/payment-check/route.ts` → Add call when payment status changes
- `src/app/api/cron/rank-poll/route.ts` → Add call when significant rank changes detected

### D3: Notification Delivery Service

**Location:** `src/lib/ops/notification-service.ts`

**Channels:**
1. In-app: Create NotificationEvent record, emit SSE event via existing `src/lib/realtime/event-store.ts`
2. Push: Call existing `src/lib/push.ts` for WebPush delivery
3. Email: Call existing `src/lib/email/` for email delivery

**Reads GlobalSettings for preferences:**
- `emailNotifications` → gate email channel
- `taskAssignmentAlerts` → gate task notification types
- `scanCompleteAlerts` → gate scan notification types
- `pushMessagesEnabled` → gate push channel
- `pushTasksEnabled` → gate task push specifically

### D4: DataSourceStatus Tracking

**Location:** `src/lib/ops/data-source-monitor.ts`

**Pattern:** Wrapper around existing enrichment providers. Each provider call updates DataSourceStatus:
- On success: update lastSuccessAt, reset consecutiveFailures, calculate avgLatencyMs
- On failure: update lastFailureAt, increment consecutiveFailures, set errorMessage
- Threshold: consecutiveFailures ≥ 3 → status = "degraded", ≥ 10 → status = "down"
- On status change: fire AlertEvent via alert engine

**Initial providers to track:** dataforseo, ahrefs, pagespeed, google_business, google_ads, wave, outscraper

### D5: API Routes (Sprint 0)

| Route | Method | Purpose |
|-------|--------|---------|
| /api/alerts | GET | List alerts (filterable by type, severity, client, acknowledged) |
| /api/alerts/[id]/acknowledge | PUT | Mark alert as acknowledged |
| /api/alerts/rules | GET, POST | List/create alert rules |
| /api/alerts/rules/[id] | PUT, DELETE | Update/delete alert rule |
| /api/notifications | GET | List user notifications |
| /api/notifications/read | PUT | Mark notifications as read |
| /api/data-sources | GET | List data source statuses |
| /api/recurring-tasks | GET, POST | List/create recurring task rules |
| /api/recurring-tasks/[id] | PUT, DELETE | Update/delete recurring rules |

---

## FILE CREATION ORDER

1. `prisma/schema.prisma` — Add all new models + column migrations
2. `npx prisma migrate dev --name ops-foundation`
3. `src/lib/ops/alert-engine.ts` — Alert rule evaluation
4. `src/lib/ops/notification-service.ts` — Multi-channel notification delivery
5. `src/lib/ops/data-source-monitor.ts` — External API health tracking
6. `src/lib/ops/recurring-tasks.ts` — Recurring task cron logic
7. API routes (alerts, notifications, data-sources, recurring-tasks)
8. Wire alert engine into existing crons (executor.ts, payment-check, rank-poll)
9. Seed default AlertRules for common scenarios

---

## TESTING CRITERIA

- [ ] `npx prisma validate` passes
- [ ] Migration applies cleanly to dev database
- [ ] Alert engine creates AlertEvent when scan completes with critical alerts
- [ ] Notification created when alert fires with notifyOnTrigger=true
- [ ] DataSourceStatus updates on enrichment provider calls
- [ ] RecurringTaskRule creates ClientTask at scheduled time
- [ ] Cooldown prevents duplicate alerts within window
- [ ] Existing task-creator.ts still works (scan → task pipeline unbroken)
- [ ] Existing crons still run without errors

---

## WHAT THIS SPRINT DOES NOT DO

- No UI (Sprint 7)
- No domain-specific snapshots (Sprints 2, 3, 6)
- No report generation changes (Sprint 5)
- No task UI changes (Sprint 1)
- No nav/sidebar changes (Sprint 7)
- No dashboard widget changes (Sprint 7)
