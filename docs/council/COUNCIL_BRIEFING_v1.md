# GHM DASHBOARD — OPERATIONS LAYER ARCHITECTURE COUNCIL
## Universal Briefing Document v1.0
**Date:** February 23, 2026
**Decision Type:** Architectural — Operations Module Design
**Scope:** Operational layer only (not payments, onboarding, sales pipeline, or data infrastructure)

---

## CONTEXT: WHAT EXISTS TODAY

GHM Digital Marketing Dashboard is a Next.js 14 / Prisma / PostgreSQL application deployed on Vercel. It serves a two-person SEO agency (David as COO/sole operator, Gavin as co-owner/business development) managing 6 active clients across SEO, PPC, GMB, and website maintenance services.

**What's built and working (95% complete):**
- Client profiles with health scoring
- Sales pipeline and lead management
- Partner/contractor commission engine with territory system
- Wave financial integration (AR invoicing, AP partner payments, webhooks)
- Competitive scanning (keyword, backlink, technical audits)
- Content Studio (AI-powered content generation with brand voice profiles)
- Onboarding portal (token-based client intake forms)
- Role-based access control (admin, master, sales_rep, viewer)
- Audit logging, credential vault integration
- Monthly report data collection infrastructure

**What does NOT exist yet — the gap this council addresses:**
- Task pipeline / work management system
- SEO workflow automation
- PPC workflow management
- GMB workflow management
- Client monthly report generation and delivery
- Cluster/satellite site management (T3 product tier)
- Alert and notification system
- Session-based UI context (working on one client at a time)
- AI integration beyond Content Studio
- Daily queue / work prioritization engine

These missing modules represent the **operational layer** — the system that turns the dashboard from a data platform into a work execution platform.

---

## THE THREE BLUEPRINT DOCUMENTS

Three architectural documents were produced that define this operational layer. Their key concepts are summarized below.

### Document 1: Operations Blueprint (926 lines)

Defines eight operational modules:

**Module 1 — Task Pipeline:** The operational spine. Every piece of work enters as a task and moves through: BACKLOG → QUEUED → IN PROGRESS → READY FOR REVIEW → APPROVED → DONE. BLOCKED is a cross-stage flag. Each task type has auto-populated checklists that enforce QC. "Ready for Review" cannot be set unless all checklist items are checked. Four views: Kanban (default), List, Focus (per-client), Daily Queue (homepage widget).

Task generation sources: manual creation, bulk import, and system-generated (competitive scan detects ranking drop → creates SEO task; GMB calendar date arrives → creates GMB task; client goes 30 days without completed task → creates account review task). Recurring tasks auto-spawn into QUEUED when due.

**Module 2 — SEO Workflow:** Structured workflows for new pages, existing page optimization, technical fixes. Keyword tracking via BrightLocal API with weekly snapshots. GSC integration per client for coverage issues, indexing status, Core Web Vitals. Movement alerts when keywords shift ±3 positions. "Opportunities" view for page-2 keywords ripe for push.

**Module 3 — PPC Workflow:** Google Ads management with campaign registry, structured review checklists, performance snapshots. Monthly review cadence with auto-generated tasks. Wasted spend alerts when CPA exceeds 3x target.

**Module 4 — GMB Workflow:** Google Business Profile management. Calendar-based posting schedule. If post date passes with no post, task auto-escalates to CRITICAL. Review response queue with 48-hour cadence. Business info audit checklists (quarterly).

**Module 5 — Site Health:** Recurring maintenance system for WordPress sites. Components: WP core, plugins, PHP, performance (PageSpeed API), security (SSL, Safe Browsing), uptime (HTTP checks every 30 minutes), forms. Auto-generates tasks when issues found. Health score 0-100 per client.

**Module 6 — On-Page SEO Checklist:** Page lifecycle management: DRAFT → STAGED → QC → LIVE → INDEXED → TRACKING. Full QC checklist (content quality, title/meta, headings, images, internal linking, schema, technical). Page Manager view across all clients.

**Module 7 — Client Monthly Report:** AI-generated narrative with data sections (keyword rankings, work completed, PPC performance, GMB activity, site health, next month priorities). Dual-mode: Editor (David reviews/edits) and Client (narrative-first, visual, branded). Three templates: Full, SEO Only, Maintenance.

**Module 8 — Cluster/Satellite Site Manager:** T1/T2/T3 product tier system. Cluster registry for T3 clients with satellite site tracking. Stage progression per site: wireframe → built → submitted → approved → live → tracking. Approval workflow (Gavin must approve before sites go live).

**Data model additions required:** 16 new tables including Task, TaskChecklistItem, RecurringTaskRule, KeywordRanking, PpcSnapshot, GmbActivity, SiteHealthCheck, SiteHealthAlert, PageRecord, MonthlyReport, Cluster, ClusterSite, and others.

### Document 2: UX Design Spec (638 lines)

Defines the visual implementation of the operational modules. Key elements:

**Hub Layout (Zone A):** Daily Queue widget (most prominent), Client Health Strip (6 horizontal cards with health scores and alert badges), Alerts panel (right side, system-generated items needing attention), Quick Stats bar.

**Task Pipeline (Zone B):** Kanban with 5 columns. Task cards are compact by default (~72px), expand on hover (~120px) showing description preview, checklist progress, quick actions. Task Detail opens as right-side sliding panel (not full page). Filter bar with client, type, priority, search. Drag-and-drop with QC enforcement (checklist completion check on stage transition).

**Client Focus View (Zone C):** Full client context. Header with name, tier, health score, "Generate Report" button. Tabs: Overview, Tasks, SEO, PPC, GMB, Site Health, Content, Cluster (T3 only), Reports. Each tab shows relevant data with action buttons.

**Daily Queue design:** Max 7 items. Each row: client color dot, type icon, task title, client name + priority + due date, "Start →" button. Start moves to IN_PROGRESS and opens task detail. Satisfying animation on completion (item slides out, next slides up). Empty state: "All caught up" with green checkmark — achievement, not void.

**Competitive research findings:** AgencyAnalytics users complain about: integrations breaking silently, ugly report covers, inflexible reporting, no GMB grid tracking, crashes on the 1st of month, pricing that punishes growth, "automated reports aren't really automated."

### Document 3: UX Philosophy v2 (644 lines)

The most architecturally significant document. Declares that the v1 design approach was wrong — borrowed patterns from team-oriented tools (Linear, ClickUp, AgencyAnalytics) designed for 5-50 person teams. Introduces five foundational concepts:

**Three Mental Modes:**
- SURVEY MODE: "What needs me today?" (30-second scan, ambient awareness)
- SESSION MODE: "Working on [Client] for 90 minutes" (focused, context-locked)
- RESPONSE MODE: "Something needs attention now" (interrupt handling)

**Hub-and-Spoke with Progressive Disclosure:**
- Hub (command center): health-first hierarchy, no deep data
- Spokes (client sessions): full context shift, everything irrelevant becomes peripheral
- Interrupts (alerts): surface in any mode without destroying context

**Client Session Mode:** When entering a client session — sidebar collapses to that client's navigation, header shows "Working on: [Client]" with color bar, Daily Queue filters to that client only, alerts from other clients queue silently. Entry via click, keyboard shortcut, or command palette. Exit via logo, Escape, or X. Persistent across session: alert overlay, command palette, session timer.

**Alert vs Notification Distinction:**
- ALERTS = world changed, needs decision/action. Overlay interrupts. Red (critical now) or Amber (today). Action buttons: "Create Task" | "Fix Now" | "Dismiss."
- NOTIFICATIONS = FYI, no action needed. Bell icon, slide-out panel. Blue/gray. Never interrupt. Auto-clear 7 days.
- Separate data models required: AlertEvent vs NotificationEvent tables.

**AI as First-Class Citizen (not siloed):**
- Level 1 — Passive AI: runs without asking (executive summaries, anomaly detection, task suggestions)
- Level 2 — Contextual AI: one-click when relevant (task detail "AI Assist," keyword "Optimize," GMB "Draft Response")
- Level 3 — Conversational AI: command palette ("what should I work on today?" / "summarize cerrones this month")
- Visual treatment: AI content labeled "AI draft" badge. Accept | Edit | Regenerate. Nothing sent to clients without acceptance.

**Data-to-Action Pattern (every data display must follow):**
- Tier 1: The number (what is it)
- Tier 2: The context (good/bad? vs what?)
- Tier 3: The action (what do I do?)

**Client Vitals Strip:** Top of hub, full width. 6 blocks (~160px each). Client name, large circular health indicator (green/yellow/red), 3 mini-indicator dots (task pipeline, GMB status, site health), active alert badge. Persists on hub AND collapsed in client sessions.

**Gavin's View — Confidence Dashboard:** Designed for emotional outcome: "everything is being handled professionally." Shows evidence of professional execution: activity graph, health trends, report delivery checkmarks, response time visibility. "Requires Your Attention" section only appears when relevant (hidden otherwise to prevent cry-wolf).

**Report UX — Dual Mode:** Editor Mode (David): dense data, source attribution, "regenerate section" buttons. Client Mode (actual output): tables become visual summaries, AI narrative prominent, branded, professional. Cover page with one-sentence summary and three KPI chips. Most clients never read past page 2.

**Mobile:** Viewing surface, not working surface. Mobile-optimized: Daily Queue, Client Vitals Strip, Alert interrupts, task status changes, report Client Mode. NOT mobile: task editing, report editing, cluster kanban, site health deep dive, PPC management.

**Five Design Tests (every screen must pass):**
1. 3-Second Test: understand what screen is about and what to do
2. One Click Test: most common action in one click
3. Data-to-Action Test: every data point connects to a possible action
4. Solo Operator Test: does screen assume other humans involved?
5. Empty State Test: intentional empty state, not blank space

**Five Load-Bearing Architectural Decisions (must be defined before building):**
1. SessionContext Architecture — how system tracks client session state
2. Compact/Full Rendering Modes — every component needs both (semantic, not just responsive)
3. AI Entry Points as Sidecars — embedded throughout, unified AI service
4. Alert vs Notification Data Model — separate tables, display logic, lifecycle
5. Data-to-Action Registration — AlertRule table: condition → alert → action pathway

---

## CRITICAL DESIGN CONSTRAINTS (AGREED BEFORE COUNCIL)

The blueprints were written from the perspective of "David as permanent solo operator." This is incorrect. The following six guidelines correct the lens:

**Guideline 1: SessionContext is user-scoped, not system-scoped.** When David is the only operator, his session IS the system state. When three ops people exist, each has their own SessionContext. The Hub shows "my clients" (operator) or "all clients with who's-working-on-what" (manager). Same component, different data query based on role.

**Guideline 2: Assignment is a scaling feature that starts at one.** When solo, everything is assigned to the single user and the field is invisible. When a second person appears, the field shows. Ten-person agency gets assignment rules and load balancing. UI elements related to multi-user workflow are contextually visible based on team size, not permanently absent.

**Guideline 3: Alert vs Notification split is universal regardless of team size.** This is a cognitive load feature, not a team feature. Build it early.

**Guideline 4: AI ambient integration scales differently by role.** Solo: AI drafts, operator reviews. Team: AI drafts, operator or delegate reviews. Manager: AI summarizes team activity, flags what needs attention. Same AI service layer, different output routing based on role.

**Guideline 5: Gavin's view IS the template for the owner/agency-owner view in productized version.** "Confidence dashboard" = evidence of professional execution. Build as role-based view, not person-specific view.

**Guideline 6: Daily Queue scales to per-user queues.** Solo: one queue, all clients. Team: each person's queue scoped to their assigned clients. Manager: aggregated queue showing blockers across all team members. Same algorithm, different input set.

**Overarching constraint:** The system must feel like a solo command center when there's one person, and naturally expand into a team orchestration tool as people are added — without a mode switch, without a settings toggle, without rebuilding anything. The UI adapts based on how many humans are in the system and what roles they hold.

---

## EXISTING INFRASTRUCTURE TO PRESERVE

The following are built, deployed, and serving real clients. The operational layer builds ON TOP of these — it does not replace or restructure them:

- Payments/Wave integration (AR, AP, webhooks, financial overview)
- Commission engine (per-partner rules, residual calculations, territory system)
- Onboarding portal (token-based client intake)
- Sales pipeline and lead management
- Competitive scanning infrastructure
- Content Studio (AI content generation with brand voice)
- Client profiles and health scoring
- Role-based access control
- Audit logging
- Prisma schema and PostgreSQL database

---

## PRODUCTIZATION CONTEXT

GHM Dashboard will eventually be productized as "Covos" — a multi-tenant SaaS platform for SEO agencies. The Covos infrastructure (multi-tenant architecture, tenant isolation) already exists. Design decisions made now for the operational layer will carry directly into the productized version.

Target market for Covos: solopreneurs running their own SEO practice AND small-to-medium agencies (2-15 people). The operational layer must serve both without separate codepaths.

---

## THE QUESTION FOR THE COUNCIL

Given the three blueprint documents, the six design constraints, the existing infrastructure, and the productization trajectory:

**How should the GHM Dashboard operational layer be architected and implemented?**

Specifically:

1. **Sequencing:** What is the correct build order for the eight modules and five architectural primitives? What must exist before other things can be built? What can be parallelized?

2. **Architecture:** How should the five load-bearing decisions (SessionContext, Compact/Full rendering, AI sidecars, Alert/Notification model, Data-to-Action registration) be implemented to serve solo operators today and teams tomorrow?

3. **Scope management:** The blueprints describe ~16 new database tables and 8 full modules. Is this the right scope, or should it be decomposed differently? What's the MVP operational layer vs. the full vision?

4. **Risk:** What are the highest-risk architectural decisions? Where could we make a choice now that causes expensive refactoring later? What needs to be right from day one vs. what can be iterated?

5. **Integration patterns:** How do the new operational modules connect to the existing infrastructure (client profiles, health scoring, content studio, competitive scanning, payments) without creating tight coupling or requiring changes to working code?

6. **Solo-to-team scaling:** Concretely, how does each module behave differently with 1 user vs. 3 users vs. 10 users? Where are the scaling inflection points?

---

## DELIVERABLE

Provide a comprehensive architectural synthesis addressing the six questions above. Be specific about data models, component architecture, build sequencing, and risk. Identify trade-offs explicitly — where two good approaches exist, name both and state what each optimizes for.

This is a first-round synthesis. You will later receive all council members' first-round syntheses and produce a final synthesis that accounts for all perspectives.

---

*End of Universal Briefing*
