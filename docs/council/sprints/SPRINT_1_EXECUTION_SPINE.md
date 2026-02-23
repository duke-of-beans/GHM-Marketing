# SPRINT 1 — EXECUTION SPINE ✅ COMPLETE
## Extend Existing Task System with Checklists, Recurring Tasks, Alert Links
*Completed: 2026-02-23*

---

## STATUS: ALL DELIVERABLES COMPLETE

- [x] D1: Checklist API (GET/POST /api/tasks/[id]/checklist, PUT/DELETE /api/tasks/[id]/checklist/[itemId], PUT /api/tasks/[id]/checklist/reorder)
- [x] D1: Checklist templates API (GET/POST /api/checklist-templates, PUT/DELETE /api/checklist-templates/[id])
- [x] D1: TaskChecklist UI component (task-checklist.tsx) — fixed API response shape mismatch
- [x] D1: Checklist wired into task detail sheet with progress bar + apply-template picker
- [x] D2: Recurring tasks management page (/recurring-tasks)
- [x] D2: RecurringTasksClient list view with active toggle, edit, delete
- [x] D2: RecurringTaskForm dialog (create/edit with cron presets, client picker, template picker)
- [x] D2: Recurring tasks API response shape fixed (success/data pattern)
- [x] D3: Alert + recurring origin badges in task detail sheet
- [x] D4: POST /api/tasks extended (checklistItems, sourceAlertId, recurringRuleId)
- [x] D4: task-creator.ts updated to create TaskAlertLink when AlertEvent exists
- [x] Queue API extended (sourceAlertId, recurringRuleId, checklistComplete in response)
- [x] QueueTask type updated with new fields
- [x] Nav: "Recurring Tasks" link added to Clients group (elevated only)
- [x] Schema: RecurringTaskRule client + checklistTemplate relations added
- [x] Schema: TaskChecklistTemplate description field + category nullable + recurringRules back-relation
- [x] Migration: 20260223103724_sprint1_schema_relations applied

**TypeScript:** 0 errors in Sprint 1 files (21 pre-existing errors unchanged)

---

Enhance the existing task pipeline with operational intelligence: checklists for structured work, recurring rules for automated task creation, and alert-to-task linking for traceability. All work extends existing components — zero rewrites.

---

## PRE-BUILD CHECKLIST

- [ ] Sprint 0 migration applied (TaskChecklistItem, RecurringTaskRule, etc. tables exist)
- [ ] Existing task API routes tested and working
- [ ] Read existing components: task-queue-client.tsx, tasks-page-client.tsx, approvals-tab.tsx
- [ ] Read existing status-machine.ts to understand transition rules

---

## EXISTING INFRASTRUCTURE (Do NOT Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| Task CRUD API | /api/tasks/route.ts | ✅ Complete |
| Task queue view | /api/tasks/queue | ✅ Complete |
| Task dashboard view | /api/tasks/dashboard | ✅ Complete |
| Status transitions | /api/tasks/[id]/transition | ✅ Complete |
| Approve/Reject/Changes | /api/tasks/[id]/approve,reject,request-changes | ✅ Complete |
| Assignment | /api/tasks/[id]/assign | ✅ Complete |
| Priority recalculation | /api/tasks/recalculate-priorities | ✅ Complete |
| Drag-and-drop reorder | /api/tasks/reorder | ✅ Complete |
| AI brief generation | /api/tasks/[id]/generate-brief | ✅ Complete |
| Transition history | /api/tasks/[id]/history | ✅ Complete |
| Task queue UI | components/tasks/task-queue-client.tsx | ✅ Complete (DndKit, filtering, detail sheet) |
| Tasks page shell | components/tasks/tasks-page-client.tsx | ✅ Complete (Work + Approvals tabs) |
| Dashboard widget | components/dashboard/my-tasks-widget.tsx | ✅ Complete |
| Status machine | lib/tasks/status-machine.ts | ✅ Complete (9 states, transitions, priorities) |

---

## DELIVERABLES

### D1: Checklist System

**New API routes:**
| Route | Method | Purpose |
|-------|--------|---------|
| /api/tasks/[id]/checklist | GET | Get checklist items for a task |
| /api/tasks/[id]/checklist | POST | Add checklist item (or apply template) |
| /api/tasks/[id]/checklist/[itemId] | PUT | Toggle complete, update label |
| /api/tasks/[id]/checklist/[itemId] | DELETE | Remove item |
| /api/tasks/[id]/checklist/reorder | PUT | Reorder checklist items |
| /api/checklist-templates | GET, POST | List/create templates |
| /api/checklist-templates/[id] | PUT, DELETE | Update/delete template |

**UI changes (extend existing task-queue-client.tsx detail sheet):**
- Add checklist section below task description in the Sheet component
- Toggle checkboxes inline
- "Apply Template" button when checklist is empty
- Progress indicator (3/5 complete)
- Auto-update `task.checklistComplete` when all items checked

**Auto-checklist on task creation:**
- When creating a ClientTask, check if TaskChecklistTemplate exists for that category
- If yes, auto-create TaskChecklistItem records from template

### D2: Recurring Task Engine

**Cron job:** `/api/cron/recurring-tasks/route.ts`
- Runs daily (add to vercel.json)
- Queries RecurringTaskRule where isActive=true AND nextRunAt <= now()
- For each rule:
  - If clientId is set: create one ClientTask for that client
  - If clientId is null: create ClientTask for every active ClientProfile
  - Interpolate {clientName} in title template
  - Apply checklist template if checklistTemplateId set
  - Update lastRunAt and calculate nextRunAt from cronExpression
  - Create NotificationEvent for task assignee

**UI for managing recurring rules:**
- New page: `/recurring-tasks` (add to nav under Clients group)
- List view: name, frequency, last run, next run, active toggle
- Create/edit form: name, client (optional), category, title template, priority, cron expression (human-friendly picker), checklist template (dropdown)

### D3: Alert-to-Task Linking

**Extend task creation from alerts:**
- When alert engine (Sprint 0) creates a task via autoCreateTask, also create TaskAlertLink
- Display in task detail sheet: "Originated from: [Alert title] — [date]" with link to alert
- Display on alert detail: "Generated task: [Task title]" with link to task

**Extend task detail sheet:**
- Show alert source badge when sourceAlertId is set
- Show recurring rule badge when recurringRuleId is set
- Link to originating alert or recurring rule

### D4: Task Creation Enhancements

**Extend POST /api/tasks:**
- Accept optional `checklistItems: Array<{label, sortOrder}>` in body
- Accept optional `recurringRuleId` in body
- Accept optional `sourceAlertId` in body

**Extend task-creator.ts (competitive scan):**
- After creating ClientTask from scan alert, also create TaskAlertLink if AlertEvent exists

---

## FILE CHANGES

**New files:**
1. `src/app/api/tasks/[id]/checklist/route.ts` — Checklist CRUD
2. `src/app/api/tasks/[id]/checklist/[itemId]/route.ts` — Individual item operations
3. `src/app/api/tasks/[id]/checklist/reorder/route.ts` — Reorder items
4. `src/app/api/checklist-templates/route.ts` — Template CRUD
5. `src/app/api/checklist-templates/[id]/route.ts` — Individual template
6. `src/app/api/cron/recurring-tasks/route.ts` — Recurring task cron
7. `src/app/(dashboard)/recurring-tasks/page.tsx` — Recurring tasks management page
8. `src/components/tasks/task-checklist.tsx` — Checklist UI component
9. `src/components/tasks/recurring-task-form.tsx` — Create/edit recurring rule form
10. `src/lib/ops/recurring-tasks.ts` — Recurring task logic (cron expression parsing, task creation)

**Modified files:**
1. `src/components/tasks/task-queue-client.tsx` — Add checklist section to detail sheet, alert/recurring badges
2. `src/app/api/tasks/route.ts` — Accept checklist items on creation
3. `src/lib/competitive-scan/task-creator.ts` — Create TaskAlertLink when AlertEvent exists
4. `src/components/dashboard/nav.tsx` — Add "Recurring Tasks" link under Clients group
5. `vercel.json` — Add recurring-tasks cron schedule

---

## TESTING CRITERIA

- [ ] Checklist items CRUD works via API
- [ ] Applying template creates items from template
- [ ] Toggling all items marks task.checklistComplete = true
- [ ] Recurring task cron creates tasks on schedule
- [ ] Recurring task with null clientId creates tasks for all active clients
- [ ] {clientName} interpolation works in title template
- [ ] Alert-originated tasks show alert source badge
- [ ] Recurring-originated tasks show recurring rule badge
- [ ] Existing drag-and-drop queue still works
- [ ] Existing status transitions still work
- [ ] Existing approvals tab still works

---

## WHAT THIS SPRINT DOES NOT DO

- No new task statuses (existing 9 are sufficient)
- No Kanban/board view (existing list + grid is sufficient for now)
- No task dependencies/blocking (defer to future sprint)
- No task time tracking (estimatedMinutes exists but no timer UI)
- No task comments (ClientNote with taskId already exists)
