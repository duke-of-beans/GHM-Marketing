# GHM Dashboard — UX Design Philosophy & Interaction Model
# How the Operator's Brain Works and How the Design Supports It
# Version 2.0 — February 23, 2026
# Supersedes: UXUI_DESIGN_SPEC.md (v1.0 — that doc covers visual details)
# This doc covers: mental model, interaction architecture, design philosophy

---

## THE HONEST CRITIQUE OF V1.0

The first UI spec described good features with good visual design.
It had one major flaw: it was designed for a team tool, not a solo operator
with AI assistance.

Every design pattern it borrowed from (Linear, ClickUp, AgencyAnalytics)
was built for 5-50 people handing work to each other. The notifications,
assignments, approvals, and handoff flows all assume multiple humans.

GHM Dashboard is built for one person who is also an AI director.
That requires a completely different interaction architecture.

---

## THE SOLO OPERATOR MENTAL MODEL

### How David Actually Works

David does not open a dashboard and stare at a Kanban board.
He works in sessions. Each session has a client or a category context.

A real day looks like this:

  8:00 AM — Opens dashboard. Scans: what needs me today? (30 seconds)
  8:05 AM — Enters German Auto Doctor session. Works for 90 minutes.
             During this time, he doesn't want to think about Cerrones.
  9:35 AM — Closes GAD session. Returns to home. Scans: what's next?
  9:37 AM — Enters Sevcik's session. Works for 60 minutes.
  10:37 AM — System alert appears: "McIlvain site returned 404"
             He flags it, creates a task, stays in Sevcik's mode.
  ... continues through the day

This is fundamentally different from a project manager scanning a team board
and delegating. David is the executor AND the manager AND the QC.

The design must support three mental modes:
  SURVEY MODE: "What does everything look like right now?" (quick, ambient)
  SESSION MODE: "I'm working on [Client] for the next X minutes" (focused)
  RESPONSE MODE: "Something just happened that needs my attention" (interrupt)

Most dashboard tools only design for Survey Mode.
GHM needs all three to feel natural.

---

## DESIGN ARCHITECTURE: HUB AND SPOKE

The correct architecture for this system is Hub-and-Spoke with Progressive Disclosure.

THE HUB (home / command center):
  Answers one question: "What does everything look like right now?"
  Designed for SURVEY MODE.
  Information hierarchy: health first, action required second, detail third.
  No deep data on this screen. That lives in the spokes.

THE SPOKES (client sessions, module views):
  Designed for SESSION MODE.
  When you enter a spoke, the whole interface shifts to that context.
  Everything irrelevant becomes peripheral or hidden.
  Maximum depth of information for that context.

INTERRUPTS (alerts, system notifications):
  Designed for RESPONSE MODE.
  Surface in any mode without destroying the current context.
  Always actionable — never just informational.

This is the architecture that works. It's how the Vercel dashboard redesign
was approached ("same tabs between projects and teams, always know where you are"),
how the DP World enterprise logistics dashboard was rebuilt, and how the best
tools feel "invisible" — they support how you think, not how the data is organized.

---

## PROGRESSIVE DISCLOSURE: THE CORE DESIGN LAW

The #1 mistake every agency tool makes: showing everything at once.
AgencyAnalytics has 80 integrations visible. ClickUp has buttons for features
you don't use and never will. Every tool that gets "too cluttered" complaints
violated this law.

The law: SHOW THE MINIMUM THAT ENABLES THE NEXT DECISION.

Applied to every screen in GHM:

KEYWORDS VIEW — First disclosure layer:
  Top 5 keywords for this client. Position. Change. That's it.
  
  Second disclosure layer (user clicks "see all"):
  Full keyword table with sparklines, GSC data, competitor positions.
  
  Third disclosure layer (user clicks a keyword):
  Full history, content opportunity analysis, linked pages.

CLIENT CARD ON HUB — First disclosure layer:
  Client name. Health dot (green/yellow/red). Days since last activity. Alert badge if any.
  This is all you see. Six clients, six health dots. 3-second scan.
  
  Second disclosure layer (user hovers):
  Top 3 open tasks. Last completed item. Next report due date.
  
  Third disclosure layer (user clicks):
  Full client session — all tabs, all data.

TASK CARD IN PIPELINE — First disclosure layer:
  Client color bar. Type icon. Title. Priority dot. Due date.
  One line. ~72px height.
  
  Second disclosure layer (hover):
  First 2 lines of description. Checklist progress. Last updated.
  Quick actions: Start / Move stage.
  
  Third disclosure layer (click):
  Full task detail pane slides in. Everything: description, checklist,
  notes, activity log.

ALERTS — First (and only) disclosure layer:
  Every alert shows: what happened + what to do about it.
  No clicking to find out why it appeared.
  No navigation to a different section to act on it.
  The action button is ON the alert card.

The rule of three layers covers 95% of UX situations.
If you need a 4th layer, the information architecture is wrong.

---

## CLIENT SESSION MODE: THE MOST IMPORTANT CONCEPT

"Session Mode" is the key thing the first spec got wrong.

When David says "I'm working on German Auto Doctor for the next hour" the
system should enter a state where:

1. The sidebar collapses to show only GAD navigation (Overview, Tasks, SEO, 
   PPC, GMB, Site, Cluster, Reports)
2. The header shows "Working on: German Auto Doctor" with a client color bar
   across the full top of the interface
3. The Daily Queue re-renders filtered to GAD tasks only
4. Alerts from OTHER clients are queued, not surfaced (still visible in 
   notification panel, but don't interrupt the session)
5. Keyword data, health data, open tasks — all scoped to GAD

HOW YOU ENTER SESSION MODE:
  - Click a client card on the hub → enters session mode for that client
  - Click a client color dot in the sidebar → same
  - Keyboard: Ctrl+1 (first client), Ctrl+2 (second), etc.
  - From the command palette: type "cerrones" → top result is "Session: Cerrones"

HOW YOU EXIT SESSION MODE:
  - Click the GHM logo (always returns to hub)
  - Press Escape from anywhere (same behavior)
  - The "Working on: [Client]" header bar has an X to close the session

WHAT STAYS PERSISTENT DURING SESSION MODE:
  - Alert interrupt panel (right-side overlay) — critical alerts from any
    client still surface, but as overlays you can dismiss, not as full-page
    interruptions
  - The command palette (Ctrl+K) — still works globally
  - The clock and "X minutes in session" counter (subtle, top right)

WHY THE SESSION COUNTER MATTERS:
  Time awareness prevents the "I meant to spend 30 minutes on GAD and it's
  been 3 hours" problem. Subtle display. Not nagging. Just ambient.

---

## ALERT vs NOTIFICATION: THE DISTINCTION THAT MOST TOOLS FAIL

Every tool that gets "notification fatigue" complaints collapsed these two
concepts into one stream. They are completely different.

ALERTS = Something in the world changed and it needs your attention.
         They require a decision or an action.
         Examples:
           "Cerrones site returned 404 on /mercedes-service/ for 15 minutes"
           "McIlvain GSC found 3 new crawl errors"
           "German Auto Doctor has had no GMB post in 38 days"
           "Sevcik's PageSpeed score dropped from 74 to 58 mobile"
         
         Design: Appear as interrupt overlays in any mode.
         Color: Red (critical, needs action now) or Amber (needs action today)
         Each alert has 2-3 action buttons: "Create Task" | "Fix Now" | "Dismiss"
         "Fix Now" opens the relevant section directly (not a general navigation)
         Dismissing logs the dismissal with a note field

NOTIFICATIONS = Something happened that you should know about. No action needed.
         Examples:
           "Monthly report for McIlvain was generated"
           "Recurring task 'GMB post — Cerrones' was created"
           "Keyword 'German auto repair Simi Valley' moved to #1"
         
         Design: Bell icon count in sidebar. Opens a slide-out panel.
         Color: Blue or gray
         No action buttons. Tap to mark read. Auto-clear after 7 days.
         NEVER interrupt the current screen. Ever.

WRONG (how ClickUp, most tools work):
  One unified notification stream mixing alerts requiring action
  with system events that don't. Everything rings the bell.
  Result: User starts ignoring the bell. Misses real alerts.

RIGHT:
  Alerts interrupt. Notifications accumulate silently.
  The bell badge only increments for notifications.
  Alerts get their own visual treatment (corner overlay, distinct color).

---

## AI AS A FIRST-CLASS CITIZEN

The first spec had AI siloed in Content Studio.
AI should be ambient and accessible throughout the entire dashboard.

THREE LEVELS OF AI PRESENCE:

LEVEL 1 — PASSIVE AI (runs without asking)
  Generates the Executive Summary in monthly reports
  Suggests which QUEUED tasks are highest leverage based on client health
  Detects anomalies in keyword data and generates alert descriptions
  Surfaces "this keyword is on page 2 — it's ready to push" callouts
  Writes the first draft of GMB review responses for review
  
LEVEL 2 — CONTEXTUAL AI (appears when relevant, one-click)
  On any task detail pane: "AI Assist" button
    → Drafts description based on task type and client context
    → Suggests checklist items based on task type
  On any keyword row: "Optimize" button
    → Opens content brief for that keyword using brand voice profile
  On any GMB review: "Draft Response" button
    → Generates brand-voice response for review
  On cluster site in "Changes Needed": "AI Fix Check" button
    → Reviews the issue list and suggests which can be auto-fixed vs manual
  
LEVEL 3 — CONVERSATIONAL AI (explicit invocation, command palette)
  Ctrl+K then type: "what should I work on today?"
  → AI analyzes health scores, due dates, priorities, surfaces recommendation
  
  "summarize cerrones this month"
  → AI pulls completed tasks, keyword movement, generates paragraph summary
  
  "gavin report for german auto doctor"
  → Generates full draft monthly report ready for review
  
  "draft gmb post for sevcik's — tire rotation"
  → Generates GMB post in Sevcik's brand voice
  
  This is NOT a chatbot embedded in a corner. It's a command interface that
  knows the full context of every client, every task, every data point in
  the system. It's what makes David + AI actually superhuman at this work.

VISUAL TREATMENT FOR AI-GENERATED CONTENT:
  AI-generated content is always labeled: subtle "AI draft" badge
  Every AI output has: Accept | Edit | Regenerate options
  Accepted AI content removes the badge and becomes "owned" by David
  Nothing AI-generated is ever sent to a client or published without
  David explicitly accepting it

---

## AMBIENT HEALTH: SEEING EVERYTHING WITHOUT LOOKING

The hub must communicate the health of 6 clients in under 3 seconds.
This is an ambient awareness problem, not an information display problem.

Current proposal: 6 client cards with health scores.
Problem: requires reading 6 numbers.

Better: 6 client "vitals" — a visual language that is instantly scannable.

CLIENT VITALS STRIP (top of hub, full width, always visible):
  
  6 blocks in a horizontal row, each block is ~160px wide
  
  Block contains:
    Top: Client name (12px, caps)
    Center: Large circular health indicator (40px diameter)
             Filled arc, color: green (80-100) / yellow (60-79) / red (0-59)
             Number inside the arc: health score
    Bottom row: 3 mini-indicators (dots)
             Dot 1: Task pipeline health (green=tasks flowing / red=overdue)
             Dot 2: GMB status (green=current / red=overdue post)
             Dot 3: Site health (green=no alerts / red=active alert)
  
  Additionally: if there's an active ALERT for that client, the entire
  block gets a red left-border highlight and a badge count.
  
  This strip is visible on the hub AND as a collapsed strip at the top of
  every client session. It persists. You always know where all 6 clients stand.

"EVERYTHING IS FINE" STATE:
  When all 6 health dots are green, the strip should visually communicate
  calm. Subtle green tones, no red anywhere, no badges.
  This is a psychological design goal — David should feel relief and clarity
  when everything is healthy, not just neutrality.

"ONE THING IS WRONG" STATE:
  One block's red border is impossible to miss against 5 green blocks.
  Contrast does the work. The eye goes there immediately.

---

## THE DAILY QUEUE: REDESIGNED

The first spec had a "Daily Queue" widget with a maximum of 7 items.
Good concept. But it needs more intelligence behind what's shown.

THE QUEUE IS NOT A TO-DO LIST. IT IS AN AI-CURATED WORK ORDER.

Selection algorithm (in priority order):
  1. CRITICAL or overdue tasks (client health at risk if not done today)
  2. Tasks where David is blocking himself (ready_for_review but hasn't QC'd)
  3. GMB posts due in the next 3 days
  4. Recurring tasks that spawned today
  5. High priority tasks in_progress (remind David to close what he started)

Maximum 7 items. If more qualify, show the top 7 with "See all urgent" below.

Each queue item format:
  
  [CLIENT DOT] [TYPE ICON]  Task Title                  [DUE DATE]  [START →]
                            Client Name · Priority
  
  Nothing more. This screen is for orientation, not detail.
  
  "START →" button behavior:
    Moves task to IN PROGRESS
    Enters client session mode for that task's client
    Opens task detail pane
    All in one action
  
  This is the "one click to start working" principle.
  From "just opened the app" to "actively working on a task" = 1 click.

WHAT HAPPENS WHEN THE QUEUE IS EMPTY:
  This should feel meaningful, not blank.
  Show: "All caught up — [date] [time]" with a subtle green checkmark
  Below: "Would you like to work ahead? Here are upcoming priorities:"
         Shows next 3 tasks due this week (not marked urgent yet)
  
  This is the gamification insight from Linear: the empty state should
  feel like an achievement, not a void.

---

## DATA MUST CONNECT TO ACTION: THE COMPLETE DESIGN PATTERN

Every SEO tool complaint boils down to: "I see the data but I don't know 
what to do with it." This is a design problem, not a data problem.

The pattern for every data display:

TIER 1: The number (what is it)
TIER 2: The context (is that good or bad? vs what?)
TIER 3: The action (what do I do about it?)

EXAMPLE — Keyword rankings:

Current (bad): A table showing keyword | position | change
  Problem: position 15 for "mercedes repair simi valley" — so what?

Better:
  TIER 1: #15 for "mercedes repair simi valley"
  TIER 2: Was #18 last week (↑3) · Page 2 · Competitor: GermanAutoSpecialist.com at #7
  TIER 3: [Optimize This Page →] button that opens the linked page 
           with SEO checklist pre-loaded for that keyword

EXAMPLE — Site health alert:

Current (bad): "PageSpeed: 58 mobile"
  Problem: David knows it's bad but what exactly needs fixing?

Better:
  TIER 1: PageSpeed mobile: 58 (was 74)
  TIER 2: Dropped 16 points since last week's plugin update
           Primary issue: render-blocking resources (3 scripts)
  TIER 3: [Create Fix Task →] | [View Full Report →]
           Task pre-populates: "Fix render-blocking scripts — [Client]"
           with checklist items auto-generated from PageSpeed API recommendations

EXAMPLE — GMB status:

Current (bad): "Last post: January 15"
  Problem: David has to calculate how many days ago that was

Better:
  TIER 1: 38 days since last GMB post
  TIER 2: [Red banner] Overdue — posts should go out every 30 days
           Last post topic: "Winter tire maintenance tips"
           Suggested topics for this post: service spotlight, spring special
  TIER 3: [Write Post Now →] opens Content Studio with GMB format,
           brand voice loaded, suggested topic pre-filled

This pattern — Show → Context → Action — is the single biggest UX gap in 
every competing tool. Implementing it rigorously throughout GHM creates an 
experience where David never stares at a number and wonders what to do.

---

## REPORT UX: THE GAVIN-FIRST REDESIGN

The first spec designed reports as data documents.
Reports have two audiences with completely different needs.

DAVID reads reports: checking that data is correct before sending.
He wants dense data, accuracy, editable sections.

GAVIN reads reports: understanding what happened and feeling confident.
He wants narrative, headlines, visual hierarchy. NOT dense data tables.

These are two different reading modes for the same document.

SOLUTION: Report Preview Modes

EDITOR MODE (David's view):
  Standard document layout
  Every section is clickable to edit
  Data panels show source attribution ("pulled from GSC on Feb 23")
  "Regenerate section" buttons throughout
  Dense data tables visible
  
CLIENT MODE (the actual output — what Gavin and clients see):
  Toggle between editor mode and client mode with one button
  Client mode transforms the document:
    Tables become visual summaries (rank movement shown as arrows, not tables)
    AI narrative paragraphs are prominent
    Dense data collapses to summary KPI cards
    Report is visually branded, professional, no "data dump" feel
  
  When David previews in Client Mode, he sees exactly what Gavin will see.
  No surprises when the report goes out.

CLIENT MODE VISUAL LANGUAGE:
  Page 1 (Cover):
    Large, clean. Client name. Month. GHM logo.
    One sentence summary ("Keyword rankings improved across 7 of 10 tracked
    terms this month, with 'Simi Valley auto repair' reaching page 1 for the
    first time.")
    Three KPI chips: traffic trend / ranking momentum / work completed
    Nothing else. Zero data tables on the cover.
  
  Page 2 (Highlights):
    "What we accomplished" — narrative paragraph written by AI
    Visual ranking movement chart (positions as a simple horizontal bar, 
    before/after, no table)
    Work summary — grouped by type, written in plain English
    ("We published 3 new service pages, updated your Google Business profile
    with a February promotion post, and resolved a mobile speed issue that
    was slowing down your contact page.")
  
  Page 3 (Details — for clients who want to see more):
    This is where the tables, keyword lists, and technical details live.
    Most clients will never read page 3. It's for the ones who ask.
  
  Page 4 (Next Month):
    3-5 priority items for next 30 days
    Written as commitments, not tasks
    ("We will push 'German car repair' to page 1 by optimizing your
    services page and adding a new FAQ schema section.")

---

## GAVIN'S VIEW: THE CONFIDENCE DASHBOARD

Gavin does not need a read-only dashboard. He needs a confidence dashboard.

The psychological goal: Gavin opens this once or twice a week and feels
"everything is being handled professionally and I don't need to intervene."

That is a specific emotional outcome that must be designed for.

DESIGNING FOR EMOTIONAL OUTCOME:

Wrong: Show Gavin all the data (overwhelms, doesn't build confidence)
Wrong: Show Gavin nothing (doesn't build confidence either)
Right: Show Gavin evidence of professional execution

Evidence of professional execution looks like:
  - Tasks being completed on a regular cadence (activity graph)
  - Client health trending stable or improving (not numbers — trends)
  - Reports delivered on schedule (checkmarks, not dates)
  - No client has gone "dark" (no activity flags)
  - Alerts are being responded to within X hours (response time visible)

GAVIN HUB LAYOUT:

HEADER: "All clients are healthy as of [date/time]" (or appropriate state)
  This is the single most important sentence on the page.
  It updates in real-time. If it can't say "all clients are healthy" then
  it says specifically what needs attention.

CLIENT CARDS (2×3 grid):
  Each card:
    Client name (large)
    Tier badge
    Health arc (the circular indicator, 60px)
    "Last report: Feb 1 ✓" with green checkmark if delivered
    "Next report: Mar 1" with days countdown
    Activity indicator: "Last worked: 2 hours ago" (shows recency)
    Alert badge: only appears if there's something Gavin needs to see
  
  Clicking a card: opens read-only client view
  Report links in the card open the client-mode view of the report (not editor)

"REQUIRES YOUR ATTENTION" SECTION (only appears when relevant):
  Items explicitly flagged for Gavin:
    New client referred by Arian (needs review + approval)
    Client has complained / unusual situation flagged by David
    Strategic decision needed (e.g., "Should we expand to T3 for McIlvain?")
    
  If there are no items here, this section is HIDDEN entirely.
  Not "nothing to see here." Just absent.
  This prevents the cry-wolf problem where Gavin ignores the section
  because it's always full of low-priority items.

ACTIVITY STREAM (bottom of Gavin view):
  "Recent work across all clients" — reverse chronological
  Shows completed tasks from the last 7 days as brief items:
    "German Auto Doctor — Fixed 4 satellite site issues (Feb 22)"
    "Sevcik's — Published GMB post: Spring tire special (Feb 21)"
    "Cerrones — Monthly PPC review completed (Feb 20)"
  
  This is the "professional execution evidence" — Gavin sees that work
  is consistently being done without needing to read task details.

---

## MOBILE CONSIDERATION

The spec has been silent on mobile. This matters.

Primary use case for GHM on mobile:
  David checking the daily queue in the morning before sitting at a desk
  David getting an alert and wanting to dismiss or create a task
  Gavin checking client health from his phone

NOT a primary use case:
  Working through a full client session on mobile
  Building reports on mobile
  Managing the cluster Kanban on mobile

Design approach: Mobile is a VIEWING surface, not a working surface.

Mobile-optimized views:
  DAILY QUEUE (full function on mobile — this is a morning phone habit)
  CLIENT VITALS STRIP (stacked vertically, health dots still clear)
  ALERT INTERRUPTS (full function on mobile — alerts must reach David anywhere)
  TASK STATUS CHANGES (can move a card between stages on mobile — quick action)
  REPORT VIEW in CLIENT MODE (Gavin reads reports on his phone)

Explicitly NOT on mobile (link to desktop instead):
  Task detail editing (checklist, description, notes)
  Report editing
  Cluster kanban
  Site health deep dive
  PPC campaign management

This is the ClickUp lesson: trying to put everything on mobile makes everything bad.
Decide what mobile is for and do that excellently.

---

## THE FIVE DESIGN TESTS

Every screen in GHM must pass these five tests before it ships.

TEST 1 — THE 3-SECOND TEST
  Can a user understand what this screen is about and what to do in 3 seconds?
  If not: simplify the primary layer. More goes in progressive disclosure.

TEST 2 — THE ONE CLICK TEST
  Can the most common action on this screen be taken in one click?
  If not: promote that action higher in the visual hierarchy.

TEST 3 — THE DATA-TO-ACTION TEST
  Does every data point on this screen connect to a possible action?
  If data is shown without any path to action: either add the action 
  or remove the data (it's not actionable information, it's noise).

TEST 4 — THE SOLO OPERATOR TEST
  Does this screen assume there are other humans involved?
  (Notification to another person, "assigned to" dropdown, approval queue)
  If yes: redesign for single-operator context.

TEST 5 — THE EMPTY STATE TEST
  What does this screen look like when there's no data yet?
  (New client, empty queue, no tasks)
  If the answer is "blank space with a note": design an intentional empty 
  state that communicates next steps. Never leave the user stranded.

---

## WHAT THIS CHANGES IN THE BLUEPRINT

The OPERATIONS_BLUEPRINT.md describes what to build.
This document describes how to think about building it.

The changes this document implies for the blueprint:

1. CLIENT SESSION MODE is a first-class feature, not a filter.
   The UI architecture needs a "mode" concept, not just navigation.
   Implementation: a React Context (SessionContext) that gates which data,
   which alerts, which sidebar items are active.

2. PROGRESSIVE DISCLOSURE means every view has two states.
   "Collapsed" and "expanded" for cards, panels, tables throughout.
   Implementation: every major component has a compact/full rendering mode.

3. AI ENTRY POINTS throughout every module.
   Not a separate AI page. AI buttons/triggers embedded in context.
   Implementation: AI actions as sidecars on data components, 
   unified through a single AI service that understands current context.

4. ALERT vs NOTIFICATION distinction needs data model support.
   AlertEvent (actionable, requires response, interrupts)
   vs NotificationEvent (informational, queues silently)
   These are different tables, different display logic, different lifecycle.

5. DATA-TO-ACTION means every data component needs an action registration.
   When a keyword drops 3 spots: alert fires, action = "Optimize this page."
   When GMB goes 35 days without post: alert fires, action = "Write post."
   These action pathways need to be defined for every monitored metric.
   Implementation: AlertRule table in data model — each rule has a condition,
   an alert message template, and an action (route + pre-populated task data).

---

END OF UXUI DESIGN PHILOSOPHY v2.0

Build sequence implication:
  Before writing a single component, the SessionContext architecture
  and the Alert vs Notification data model must be defined.
  These are load-bearing design decisions that everything else sits on.
  
  Implement wrong now → refactor everything later.
  Get these right → the rest builds naturally on top.
