# GHM Dashboard — UI/UX Design Specification
# Evidence-Based Design: Lessons from What Works and What Users Hate
# Version 1.0 — February 23, 2026

---

## RESEARCH SYNTHESIS: WHAT THE MARKET TELLS US

Before designing anything, we studied what users actually love and hate about 
the tools doing this closest to what we're building.

### What AgencyAnalytics Users Hate
- Integrations break silently — data becomes stale or missing, no warning
- Report cover pages are "unbelievably ugly" with no customization
- Inflexible reporting — can't go beyond standard templates
- No GMB grid tracking (forces a second tool)
- Crashes on the 1st of every month when everyone pulls reports simultaneously
- Pricing punishes growth — per-client surcharges double unexpectedly
- "The automated reports aren't really automated" — you babysit the connections

### What ClickUp Users Hate
- Too much of everything — buttons you don't know what they do
- You waste time looking for things instead of doing things
- Loads in 3-5 seconds — death by a thousand waits
- So many features that the core function (task management) gets buried
- Mobile is an afterthought
- Misses the last 10-15% in every category — good at nothing, okay at everything

### What Linear Users Love (the gold standard for task UI)
- "Scandinavian" design — minimal, functional, calm. No visual noise.
- Keyboard-first — nearly everything accessible without a mouse
- <50ms interactions via local-first architecture — feels instant
- Issues feel like tasks, not database entry forms
- Clean sidebar for metadata, big distraction-free description area
- "If you want a tool that feels invisible, go with Linear"
- Opinionated — it doesn't ask you to configure the world to start working

### What All Agency Reporting Users Want That They Can't Get
- Show me what needs my attention RIGHT NOW without me having to find it
- Connect the data to the action — don't just show a number, tell me what to do
- Don't make me log into 6 tools to know if a client is healthy
- Reports that look professional without requiring design work
- Tell me when something breaks (integrations, rankings, sites) before I find out
  the hard way on a client call

---

## DESIGN PHILOSOPHY FOR GHM DASHBOARD

### The One Sentence Version
**"Show David what needs to happen right now. Get out of the way."**

This is an operator tool for a single power user running 6 clients with AI.
It is not a collaboration tool. It is not a reporting showcase.
It is a command center. Every design decision flows from that.

### The Three Laws
1. SURFACE BEFORE SEARCH — David should never have to look for what needs doing.
   The system should tell him. If something needs attention, it appears.
   If it doesn't appear, it doesn't need attention.

2. ONE CLICK TO CONTEXT — From any notification, alert, or summary item,
   one click should open the full context of that item. No drilling through
   menus. No going to a different section and searching.

3. SPEED IS A FEATURE — Every interaction should feel instant. Perceived
   performance matters as much as actual performance. Optimistic UI updates,
   local state, no full-page reloads for simple actions.

---

## LAYOUT ARCHITECTURE

### The Shell
Left sidebar (fixed, narrow, icon-first):
  Top: GHM logo mark (not full wordmark — space is precious)
  Navigation icons with tooltips on hover:
    - Home (daily queue / command center)
    - Clients (client list)
    - Tasks (full pipeline)
    - Content (content studio)
    - Reports
    - Settings (gear, bottom)
  
  Below nav icons: Client quick-jump panel
    Colored dot per client (client color)
    Click → jump directly to that client's focus view
    Unread alert badge on dot if client has unresolved issue
  
  Bottom: Avatar / name, notification bell, dark/light toggle

Why this beats current sidebar: The existing sidebar has text labels that
compress as a panel. This approach keeps the sidebar at ~56px wide, 
giving maximum horizontal space to the actual work area. The client 
color-dot strip becomes muscle memory — you learn "German Auto Doctor 
is red, click the red dot" within a week.

### Content Area Zones

ZONE A — Command Center (Home view, daily default)
  Top: "Today" banner — date, day number in month, days until month-end report
  
  DAILY QUEUE widget (most prominent):
    "Here's what needs your attention today"
    Max 7 items, auto-ranked by: overdue first, then critical, then high priority
    Each item: client color bar | type icon | title | one-line context | 
    "Start" button
    "Start" button moves task to IN PROGRESS and opens the task detail pane
  
  CLIENT HEALTH STRIP:
    6 horizontal cards, one per client
    Each card: client name, color, health score (0-100), last activity date,
    alert count (red badge if any)
    Hovering a card expands a mini-panel: top 3 open tasks, last completed task,
    next report due date
    Clicking navigates to that client's focus view
  
  ALERTS panel (right side):
    System-generated alerts that need attention but aren't tasks yet
    Examples: "Cerrones site returned 404 on /porsche-service/ (detected 2h ago)"
    "McIlvain GSC has 3 new crawl errors"
    "German Auto Doctor — no GMB post in 38 days"
    Each alert has: severity icon, description, "Create Task" and "Dismiss" buttons
    Dismissed alerts are logged but removed from view
  
  QUICK STATS bar (bottom of zone A):
    Tasks completed this week | Tasks completed this month | 
    Clients with open criticals | Days until oldest overdue task

### ZONE B — Task Pipeline View
This is the main workspace. Accessed from "Tasks" nav or from any
"View all tasks" link throughout the app.

PIPELINE KANBAN:
  5 columns across full width:
    QUEUED | IN PROGRESS | READY FOR REVIEW | APPROVED | DONE
  
  Each column header: stage name, count badge, "+ Add task" link
  
  Column behavior:
    QUEUED — sorted by priority (critical at top), then due date
    IN PROGRESS — sorted by last updated (most recent action first)
    READY FOR REVIEW — sorted by "waiting since" (oldest first — review the stale ones)
    APPROVED — sorted by completed date (most recent first)
    DONE — collapsed by default, expandable, sorted by completed date
  
  Task card design (this is the Linear lesson applied):
    Height: compact by default (~72px), expandable on hover to ~120px
    
    Compact state:
      Left edge: 4px colored bar (client color)
      Left: type icon (16px) — small, consistent iconography per task type
      Main: task title (one line, truncated if needed)
      Right: priority badge (dot only — red/orange/yellow/gray)
      Right: due date (if set) — red if overdue
      Right: client tag (short name, colored pill)
    
    Hover expanded state (no click required):
      Shows: first 2 lines of description
      Shows: checklist progress (e.g., "5/9 items complete")
      Shows: "Last updated 2h ago"
      Quick actions appear: Move stage arrows | Start | Complete checklist
    
    Click → opens Task Detail Pane (sliding panel from right, not a new page)

  FILTER BAR above columns:
    Client filter (multi-select, color pills)
    Type filter (SEO / PPC / GMB / Website / Content / Admin / Cluster)
    Priority filter
    "My tasks only" toggle (for when team expands)
    Search (keyboard shortcut: /)
    
  DRAG AND DROP:
    Cards are draggable between columns
    Dropping into READY FOR REVIEW checks if checklist is complete
    If checklist incomplete: shows modal "X items not yet checked. Move anyway?"
    This is the key QC enforcement mechanism.

TASK DETAIL PANE (right-side panel, not full page):
  Opens alongside the Kanban — Kanban stays visible (width adjusts)
  
  Header: client color bar | task title (editable inline) | stage selector dropdown
  
  Meta row: type | priority | due date | assignee | source
  (All editable inline, single click)
  
  Description: full markdown-rendered text
  
  CHECKLIST section (most prominent after description):
    Items with checkboxes
    Completed items shown with strikethrough, pushed to bottom
    "Add item" link at bottom
    Progress bar: "7/9 complete" shown visually
    If stage = READY FOR REVIEW and checklist < 100%: 
      orange banner "Checklist incomplete — mark all items before approving"
  
  Notes section: running log, timestamped entries, append-only
    (like a Slack thread for the task — you add updates, never edit old ones)
  
  Activity log: auto-logged events (stage changes, checklist completions, etc.)
  
  CLOSE: clicking outside the pane or pressing Escape closes it

### ZONE C — Client Focus View
Accessed by clicking a client name/card anywhere in the app.
This is the "client session" mode — everything about one client.

HEADER BAR:
  Client name | Tier badge (T1/T2/T3) | Health score circle | 
  "Generate Report" button | Site link (opens in new tab)

TABS:
  Overview | Tasks | SEO | PPC | GMB | Site Health | 
  Content | Cluster (T3 only) | Reports

OVERVIEW TAB:
  Left column (60%):
    Open tasks by type: mini-Kanban, this client only
    Last 3 completed tasks (with dates)
  
  Right column (40%):
    Top 5 keywords: current position, weekly change indicator (↑↓)
    GMB: days since last post (green <30, yellow 30-45, red >45)
    Site health score with last check date
    Next report due

SEO TAB:
  Keyword rankings table:
    Keyword | Current Position | Last Week | Change | Target URL | Trend (7-day sparkline)
    Color coded: green (<10), yellow (11-20), gray (>20)
    "Opportunities" toggle: filters to positions 11-20
    "Losses" toggle: filters to drops of 3+ this week
  
  GSC Integration panel:
    Coverage issues (expandable)
    Indexing status for pages added this month
    Core Web Vitals overview

PPC TAB:
  Active campaigns list
  This month vs last month: Spend | Clicks | Conversions | CPA
  "Top wasted spend" alert if CPA > 3x target
  Monthly review task button

GMB TAB:
  Post history (calendar view, not list)
  "Days since last post" — large, prominent
  Review response queue: unresponded reviews in red
  Business info section with "Verify all current" checklist

SITE HEALTH TAB:
  Health score gauge (large)
  Component scores: WP Core | Plugins | PHP | Performance | Security | Uptime
  Active alerts (color coded)
  Last check timestamp

CLUSTER TAB (T3 clients only):
  Site grid (not list) — visual thumbnail-style cards
  Each card: domain, target keyword, stage badge, issue count
  Stage progression shown as horizontal stages per card
  See detailed cluster view below

---

## SPECIFIC MODULE UI DESIGNS

### Daily Queue — Design Intent
The Daily Queue is the most important UI element in the entire dashboard.
It is what David sees when he opens his laptop in the morning.

Design principle: It should look like a SHORT list, not an overwhelming backlog.
Never more than 7 items. Auto-curated by the system. Each item is actionable.
When you click "Start", the item disappears from the queue and your status
updates to show it's in progress. The queue re-renders the next highest priority
item. This creates a satisfying "clearing the queue" loop.

Visual treatment:
  Clean white card (or dark equivalent)
  Each item is a single horizontal row:
    Left: colored client dot (6px circle, client color)
    Left: type icon (seo/ppc/gmb/website icon, 16px)
    Center: task title — bold, 16px
    Center below: client name + priority + due date — 12px gray
    Right: "Start →" button (subtle, appears on row hover)
  
  The "Start →" button: pressing it adds a subtle check animation and the
  row smoothly animates out (height collapse, 200ms). The next item slides up.
  This is the Linear micro-interaction philosophy — make the right action
  feel satisfying.

### Cluster Site Kanban — Design Intent
The cluster site manager is a specialized kanban for the satellite site workflow.
It needs to solve the specific problem we saw in GAD: "Abu says done, Gavin 
says not approved" with no structured record of why.

CLUSTER HEADER:
  Client name | Cluster name | Strategy type | Progress: "6/10 sites approved"
  
SITE CARDS (6 columns: Draft → Built → In Review → Changes Needed → Approved → Live)

  Card design:
    Domain name (primary, bold)
    Target keyword (secondary)
    Template badge (doctor-style / review-style / landing)
    Issue count (red badge, prominently placed)
  
  "IN REVIEW" column has special treatment:
    Column header is yellow/amber
    Cards show: "Waiting X days" — encourages timely review
  
  "CHANGES NEEDED" column:
    Card expands to show issue list
    Each issue: type badge | description | "Resolved" checkbox
    Card shows progress: "3/5 issues resolved"
    "Re-submit" button only activates when all issues are resolved
    This button = the only path back to "In Review"
  
  This directly solves: no more "Abu says done" with no structured verification.
  The system enforces that every flagged issue is resolved before re-submission.

ISSUE PANEL (opens from card):
  Issue type selector: Content | Image | Technical | SEO | Branding
  Description field
  Screenshot upload (drag and drop)
  "Add Issue" → auto-moves site to CHANGES NEEDED
  
  When reviewer (David doing QC) goes through a site:
    Add issues → system moves card to CHANGES NEEDED
    Whoever fixes issues checks them off
    When all resolved, re-submit → moves to IN REVIEW
    Reviewer approves → moves to APPROVED
    Clear paper trail for every site, every issue.

### Client Monthly Report — Visual Design
The report is the primary client-facing output. It needs to look better than
the AgencyAnalytics cover-page horror that users specifically complained about.

DESIGN DIRECTION: Clean, branded, confident. Not a dashboard screenshot dump.

REPORT STRUCTURE (rendered in browser, exportable as PDF):

  Cover page:
    GHM logo + client name + month/year
    Large health score indicator
    One-sentence executive summary
    NO: data tables on the cover, NO: generic stock imagery
  
  Page 2: Performance Snapshot
    3-column layout: SEO health | PPC performance | GMB activity
    Simple KPIs with clear up/down indicators
    Each column has one "highlight" — the most notable thing this month
  
  Page 3: Keyword Rankings
    Clean table, top 10 keywords
    Position change shown as colored arrows (green up, red down)
    "Page 2 Opportunities" section below — keywords to push in coming month
  
  Page 4: Work Completed
    Grouped by type: SEO | PPC | GMB | Site
    Each item: checkmark | brief description | relevant URL
    NOT a task dump — AI summarizes related tasks into coherent statements
    e.g., "Optimized 4 service pages for Porsche keywords, adding schema 
    markup and updating internal link structure" (not 4 separate task lines)
  
  Page 5: Next Month
    3-5 bullet priorities for next month
    Auto-generated from QUEUED tasks
  
  Typography: Inter or similar — clean, modern, professional
  Color: GHM brand colors + client accent color in header elements
  Footer: "GHM Digital Marketing | Confidential" on every page

### GMB Calendar — Visual Design
A visual calendar, not a list. Monthly grid.

  Days with published posts: colored dot in that cell
  Days that are "next post due": pulsing dot (subtle animation)
  Days with no post in >35 days: cell background turns amber
  
  This makes "gaps" visually obvious at a glance.
  No need to calculate dates — you see it immediately.

### Keyword Ranking Table — Micro-design
This is seen constantly. Get the details right.

  Sparkline column: 7-day trend as tiny 40px-wide chart
    Visual context: is position stable, trending up, trending down?
    Much more informative than just current vs last week number
  
  Position badges: 
    1-3: gold background
    4-10: green
    11-20: yellow (page 2 — these are opportunities)
    21+: light gray
  
  Change indicator:
    ↑2 in green if improved
    ↓3 in red if dropped
    → in gray if unchanged
  
  Clicking a keyword → opens mini-panel: tracked URL, position history chart 
  (30 days), "Create optimization task" button

### Site Health Gauge — Visual Design
Each client has a health score 0-100. This should be visceral, not just a number.

  Large circular progress arc (180 degrees, like a speedometer)
  Score number in center, large
  Arc color transitions: red (0-59) → yellow (60-79) → green (80-100)
  
  Below gauge: 6 component pills
    Each pill: component name | score | status icon
    Clicking a pill expands detail for that component
  
  "Alert" items glow red subtly
  
  This is better than the AgencyAnalytics approach of burying health data 
  in a sub-tab. Health score is visible on every client card and in every
  client overview — it's always ambient context.

---

## MICRO-INTERACTIONS AND FEEDBACK DESIGN

These are what separate Linear from Jira in user feel. Every action needs 
a response that confirms it worked.

Stage change on a task:
  Card smoothly shifts columns with 200ms ease animation
  Stage badge updates with a brief color pulse
  Toast notification (bottom right, 3 seconds): "Task moved to In Progress"

Checklist item check:
  Checkbox gets a satisfying check animation
  Item text briefly turns gray before strikethrough
  Progress bar at top of checklist updates immediately
  If this was the last item: confetti-less but clean "All items complete ✓" 
  banner appears, with "Move to Ready for Review?" CTA

Task complete:
  Card briefly expands then smoothly slides out of its column with a fade
  Counter on the DONE column increments with a subtle bump animation
  Daily Queue removes the item with the same smooth slide-out

Alert dismissed:
  Alert card slides out with slight leftward swipe
  "Dismissed" logged silently in activity log

Report generated:
  Progress steps shown as report is assembled:
  "Collecting keyword data... ✓"
  "Pulling completed tasks... ✓"
  "Generating summary... ✓"
  "Report ready. Preview below."
  Never just a spinner with no context.

---

## COLOR SYSTEM

Client colors (used consistently across ALL views — cards, dots, tabs, 
report headers, everything):
  German Auto Doctor: #E53E3E (red — urgency, precision)
  Cerrones European: #3182CE (blue — European heritage, trust)
  McIlvain Motors: #D69E2E (gold — Porsche, prestige)
  Sevcik's Service Center: #38A169 (green — Texas, growth)
  Alaska Ocean Safaris: #00B5D8 (cyan — ocean, Alaska sky)
  GHM Internal: #805AD5 (purple — agency brand)

Task type colors (for left-edge bars and icons):
  SEO: #4299E1 (blue)
  PPC: #9F7AEA (purple)
  GMB: #F6AD55 (orange)
  Website: #4FD1C5 (teal)
  Content: #68D391 (green)
  Admin: #A0AEC0 (gray)
  Cluster: #FC8181 (salmon-red)
  Report: #F687B3 (pink)

Priority dot system (replaces verbose badges in compact view):
  Critical: #E53E3E filled circle
  High: #DD6B20 filled circle
  Medium: #D69E2E filled circle
  Low: #718096 filled circle

Theme:
  Default: light mode (clean, professional, readable in daylight)
  Dark mode: true dark (#1A202C base), not "gray mode"
  Sidebar: always slightly darker than content area
  
Typography:
  Primary: Inter (or system-ui stack for performance)
  Monospace (for domains, URLs, code snippets): JetBrains Mono
  Sizes: 12 (meta/labels), 14 (body), 16 (card titles), 20 (section headers), 
         28 (page headers), 48 (big KPI numbers)

---

## NAVIGATION DESIGN

Current state: sidebar with text links
Proposed: icon sidebar + breadcrumb system + keyboard palette

KEYBOARD COMMAND PALETTE (⌘K / Ctrl+K):
  This is the Linear killer feature. One keyboard shortcut opens a 
  search/command box:
  
  Type "cerrones" → shows all Cerrones tasks, filtered immediately
  Type "new task" → opens new task creator
  Type "report german" → navigates to German Auto Doctor reports
  Type "gad cluster" → opens GAD cluster view
  
  This is the fastest navigation method for a power user.
  David will use this 50+ times per day within a week of having it.
  No scrolling sidebars, no remembering where things are.

BREADCRUMB SYSTEM:
  Always visible below the top bar:
  Clients > German Auto Doctor > Tasks > Site Health
  
  Each crumb is clickable (navigates up the hierarchy)
  This solves the "where am I and how do I get back" problem that 
  ClickUp users constantly complain about

BACK NAVIGATION:
  Browser back works naturally (proper URL routing for every view)
  No full page reloads for tab changes within a client view

---

## GAVIN'S VIEW — DESIGN SPECIFICS

Gavin is not an operator. He checks in once every few days.
His view should answer one question: "Are all my clients healthy and being served?"

GAVIN HOME:
  Large company health card at top:
    "5 active clients · 2 open alerts · $12,000 MRR"
    
  Client grid (2×3 cards):
    Each card: client name | health score gauge (small, 50px) | 
    tier badge | "Last active: 2 hours ago" | "Next report: March 3"
    Alert badge if any unresolved issue
    
  "Needs Your Attention" section:
    Only items explicitly flagged for Gavin (client approval needed, 
    strategic decision required, client complaint)
    Nothing else. He doesn't see David's task queue.
    
  Recent reports section:
    Last 3 generated reports — click to view
    
  No Kanban. No task detail. No edit ability.
  Read-only. Clean. Confidence-inspiring.
  
  A new client referral from Arian creates a card here:
    "New client referred: [Name] — [Service needed]"
    "Review & approve" CTA
    This is Gavin's one operational action — approve new clients.

---

## PERFORMANCE TARGETS

These are non-negotiable design constraints, not aspirational:

Page initial load: < 2 seconds (first meaningful paint)
Task stage change (drag and drop): instant (optimistic update, sync in background)
Client focus view tab switch: < 300ms (data prefetched on hover)
Command palette open: < 100ms
Search results appear: < 200ms after typing
Report generation: < 30 seconds (with progress steps shown)
Keyword data refresh: background, never blocks UI

Method: React Query for caching and background sync. Optimistic updates on 
all mutations (show the result immediately, roll back only on error).
This is why Linear feels instant — it doesn't wait for the server.

---

## WHAT WE ARE EXPLICITLY NOT BUILDING

Based on the research, these are features that tools add which make users 
hate the product:

❌ Feature toggles everywhere (ClickUp disease)
   "If you're not using this feature, you still see the button for it."
   Solution: Features that aren't relevant to a client type are hidden, 
   not just disabled. T1 client? No cluster tab exists. Not a tooltip that 
   says "upgrade to T3." It's just absent.

❌ Configuration hell
   "Before you can use this, please set up 12 things first."
   Solution: Sensible defaults for everything. A new client is created with 
   the right checklists, the right recurring tasks, the right structure — 
   automatically. You can adjust, but you don't have to.

❌ Data without context
   "Rankings: 15 keywords tracked. Here's a table."
   Solution: Every data display has a so-what. Rankings table shows: 
   "3 keywords on page 2 — ready to push to page 1" as a callout 
   above the full table.

❌ Reports that look like screenshots
   Solution: Designed pages with narrative AI summaries, not data dumps.

❌ Notifications without actions
   "You have 12 notifications" → opens a list of events with no buttons.
   Solution: Every notification is actionable. "Site returned 404 → Fix now / 
   Create task / Dismiss." You never just see a fact with no path forward.

❌ Modal hell
   "Click this → confirm dialog → another dialog → form"
   Solution: Inline editing everywhere. Single-click stage changes.
   Modals only for truly destructive or irreversible actions.

---

## IMPLEMENTATION NOTES FOR BUILDERS

The blueprint defines WHAT to build. This document defines HOW it should feel.
When implementing, test each module against these questions:

1. Can a user understand what to do on this screen in <5 seconds?
2. Is the most important action visually dominant?
3. Does every action have immediate visual feedback?
4. Can the most common actions be done without a mouse?
5. Does removing features make this better?

The last question is the most important. When in doubt, remove.
Linear beat Jira not by adding features but by removing the ones that 
got in the way.

---

END OF UI/UX DESIGN SPECIFICATION v1.0
This document pairs with OPERATIONS_BLUEPRINT.md — that document defines 
the modules; this document defines how they look and feel.
