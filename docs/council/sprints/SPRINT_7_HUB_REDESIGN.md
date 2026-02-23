# SPRINT 7 — HUB REDESIGN
## Operations Nav Group + Dashboard Widgets + Alert Feed + Health Monitor
*Dependency: Sprints 0-6 (all backend infra and domain snapshots)*

---

## GOAL

Surface all operational intelligence in the dashboard. New nav group, new dashboard widgets, alert feed page, health monitor page, and notification center. This is the UI payoff for Sprints 0-6.

---

## EXISTING INFRASTRUCTURE (Extend, Don't Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| Dashboard nav | src/components/dashboard/nav.tsx | ✅ Grouped collapsible sidebar with NAV_GROUPS array |
| Master dashboard | src/app/(dashboard)/master/page.tsx | ✅ MasterDashboardGrid with draggable widgets |
| Dashboard grid | components/dashboard/MasterDashboardGrid.tsx | ✅ react-grid-layout with saved user layouts |
| Realtime events | src/lib/realtime/event-store.ts + use-realtime.ts | ✅ SSE-based event system |
| Push notifications | src/lib/push.ts + PushSubscription table | ✅ Web push delivery |
| My Tasks widget | components/dashboard/my-tasks-widget.tsx | ✅ Existing dashboard widget |

---

## DELIVERABLES

### D1: Nav Group Addition

**Modify:** `src/components/dashboard/nav.tsx` — Add Operations group to NAV_GROUPS:

```typescript
{
  id: "operations",
  label: "Operations",
  elevatedOnly: true,
  defaultExpanded: false,
  links: [
    { href: "/alerts",          label: "Alert Feed",     icon: "🔔", permission: "canViewAlerts" },
    { href: "/health",          label: "Health Monitor",  icon: "💚", permission: "canViewOperationalHealth" },
    { href: "/recurring-tasks", label: "Recurring Tasks", icon: "🔄", permission: "canManageAlertRules" },
    { href: "/data-sources",    label: "Data Sources",    icon: "📡", permission: "canViewOperationalHealth" },
  ],
}
```

Insert between "Insights" and "Finance" groups.

### D2: Dashboard Widgets (3 new)

**Add to MasterDashboardGrid children map:**

**AlertsSummaryWidget:**
- Shows count of unacknowledged alerts by severity (critical/warning/info)
- Last 3 critical alerts with title and timestamp
- "View All" link to /alerts
- Subscribes to SSE for real-time updates

**DataSourceHealthWidget:**
- Grid of provider status indicators (green/yellow/red dots)
- Provider name + last check time
- Click to expand with latency and error details

**OpsHealthWidget:**
- Aggregate health score across all active clients
- Distribution chart (how many clients in each health band)
- "Needs Attention" count with link to filtered client list

### D3: Alert Feed Page

**Route:** `/alerts` → `src/app/(dashboard)/alerts/page.tsx`

**Features:**
- Filterable list of AlertEvent records
- Filters: severity, type, client, acknowledged/unacknowledged, date range
- Acknowledge action (single + bulk)
- Click to expand: full alert details, linked tasks, source context
- "Create Task" action from any alert (opens task creation with pre-filled data)

### D4: Health Monitor Page

**Route:** `/health` → `src/app/(dashboard)/health/page.tsx`

**Features:**
- Client health scorecard: all active clients with health score, last scan date, trend
- Sort by health score (lowest first = needs attention)
- Click client row → expand to show domain breakdowns (site health, rankings, GBP, PPC)
- Data source status panel (DataSourceStatus records)
- "Run Scan" action per client (triggers executeScan)

### D5: Data Sources Page

**Route:** `/data-sources` → `src/app/(dashboard)/data-sources/page.tsx`

**Features:**
- All DataSourceStatus records with status, last check, consecutive failures, avg latency
- Status history chart per provider
- Manual "Check Now" action
- Alert rule configuration per data source

### D6: Notification Center

**UI component:** Notification bell icon in nav (desktop + mobile)
- Unread count badge
- Dropdown showing recent NotificationEvent records
- Click notification → navigate to href
- "Mark all read" action
- Integrates with SSE for real-time delivery

### D7: Settings Page Extension

Extend existing `/settings` page with "Operations" section:
- Alert rule management (list, create, edit, toggle)
- Notification preferences (which channels for which alert types)
- Data source monitoring toggle
- Recurring task overview

---

## FILE CREATION ORDER

1. `src/components/dashboard/alerts-summary-widget.tsx`
2. `src/components/dashboard/data-source-health-widget.tsx`
3. `src/components/dashboard/ops-health-widget.tsx`
4. `src/components/dashboard/notification-bell.tsx`
5. `src/app/(dashboard)/alerts/page.tsx` + client components
6. `src/app/(dashboard)/health/page.tsx` + client components
7. `src/app/(dashboard)/data-sources/page.tsx` + client components
8. Modify `nav.tsx` — add Operations group
9. Modify `MasterDashboardGrid` — add 3 new widget slots with default positions
10. Modify `master/page.tsx` — render new widgets
11. Extend settings page with Operations section

---

## TESTING CRITERIA

- [ ] Operations nav group visible to elevated users only
- [ ] Alert feed page loads with proper filtering
- [ ] Acknowledge action updates alert and refreshes list
- [ ] "Create Task" from alert pre-fills task form
- [ ] Health monitor shows all clients sorted by health score
- [ ] Data sources page shows real provider statuses
- [ ] Notification bell shows unread count
- [ ] Notification dropdown shows recent notifications
- [ ] Click notification navigates to correct page
- [ ] SSE delivers real-time alert/notification updates
- [ ] New dashboard widgets render in grid
- [ ] Existing widget layouts not broken (saved layouts preserved)
- [ ] Mobile nav still works (no Operations in mobile bottom nav — too many items)
