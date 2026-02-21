# GHM DASHBOARD — PRODUCT VISION
**The new gospel. Supersedes all prior vision documents.**
**Last Updated:** February 21, 2026

---

## What We Are Building

GHM Dashboard is not an SEO tool, a CRM, a billing system, or a project management app.
It is a **unified agency intelligence platform** — the single operating environment
for a digital marketing agency that eliminates context switching entirely.

The individual modules (Lead Gen, Tasks, Billing, Content Studio, Website Studio) are
entry points into one connected data layer. The product's core value is not what any
single module does — it is what happens at the seams between them, where no competitor
currently operates.

**The one-sentence pitch when we productize:**
*"The first agency platform where a lead source, a signed client, an invoice, a task,
a piece of content, and a ranking position are all the same record — connected, live,
and visible in one screen."*

---

## Why Every Competitor Fails

The competitive research across 25+ products reveals a universal pattern:

- **Pipedrive** is the best pipeline tool. It knows nothing about the work you do after close.
- **FreshBooks** is the best invoicing tool. It has no idea what tasks you completed to earn that invoice.
- **ClickUp** is the best task tool. It cannot tell you which tasks generated revenue.
- **Surfer SEO** is the best content optimizer. It cannot publish your content or track leads from it.
- **Webflow** is the best builder. It has no concept of client health, lead conversion, or content performance.
- **GoHighLevel** attempts all five. It does each at 60% quality. Users describe it as "jack of all trades, master of none" and run ClickUp alongside it for real task management.

The gap is not missing features. The gap is **broken seams between tools.** Every agency
is running 4-6 separate SaaS products, manually reconciling data between them, losing
context at every transition, and paying $400-600/month for the privilege.

GHM closes those seams by being API-native from the start. Wave, Ahrefs, Semrush, Google
Search Console, Google Business Profile, Twilio, and Vercel are infrastructure — not
integrations. The data flows between modules automatically because it was designed to.

---

## The Design Law: Context Never Breaks

Every UI decision must be evaluated against one test:

> **Does this require the user to open another tab to complete the thought?**

If yes, it is a context break. Context breaks destroy the native feeling. We eliminate them.

**Examples of context breaks competitors accept that we do not:**
- Checking if a client saw your invoice → requires leaving the task board to open FreshBooks
- Knowing a client's ranking trend while editing their website → requires opening Ahrefs separately
- Creating a task from a completed piece of content → requires switching from Surfer to ClickUp
- Seeing which marketing channel generated a paying client → requires a spreadsheet

**Examples of what zero context breaks looks like in GHM:**
- Ranking trend is in the website editor's persistent header strip — always visible
- An invoice is auto-generated when a task is marked deployed — same workflow, no switch
- The lead source that created a client is visible on the billing tab — same record
- A content piece's lead conversion count is visible in the content calendar — no analytics tab needed

---

## The Unified Data Layer

Every entity in GHM is connected. This is the architectural truth that makes everything else possible.

```
Lead Source (Google Ads, referral, cold outreach)
    ↓
Lead Record (business, location, DR, reviews, competitors)
    ↓
Client Record (same data, now active — no re-entry)
    ↓
Task Board (deliverables, milestones, content items)
    ↓
Content Studio (written, optimized, published)
    ↓
Website Studio (built, deployed, monitored)
    ↓
Invoice (auto-generated from tasks/milestones via Wave API)
    ↓
Revenue Attribution (which lead source → which work → which payment)
```

Every object at every layer knows about every other layer. The Client Health Score
(described below) is the most visible expression of this — one number that aggregates
data from all five modules into a single daily answer to "how is this client doing?"

---

## The Client Health Score

This is GHM's most important cross-module feature and the primary retention mechanic
when we productize. No competitor offers it.

**Inputs (updated on each competitive scan or daily for manual events):**
- Task completion rate (Tasks module)
- Payment timeliness (Billing module — Wave API)
- Ranking trend (Ahrefs API — up/flat/declining)
- Content output rate (Content Studio — scheduled vs. actual)
- Communication recency (Notes module — days since last contact)
- Website health (PageSpeed, crawl errors, uptime)

**Output:** A single score with a color dot (green/yellow/red) visible on every surface
where a client appears — the client list, billing tabs, task rows, content calendar,
sidebar navigation links. Same color, same position, same meaning everywhere.

**The business impact:** A rep opens GHM in the morning and scans a list of 12 clients.
Three dots are yellow. One is red. They know exactly who to call before they've clicked
anything. This replaces a 30-minute reconciliation across FreshBooks, ClickUp, Ahrefs,
and email every single morning.

---

## Module-by-Module Vision

### Lead Generation

**First screen:** Pipeline kanban, full width, no setup required. Columns match the
five sales stages. Above the kanban: a four-stat strip showing Leads This Week,
Pipeline Value, Avg. Time in Stage, and Win Rate.

**The interaction that matters most:** Clicking a lead card opens an expandable detail
drawer on the right (not a new page). The drawer shows the full lead timeline, contact
info, website with live DR and PageSpeed pulled from Ahrefs API, recent activity, and
quick actions. The user never navigates away from the pipeline.

**The moment that defines our advantage:** Clicking "Convert to Client" pre-populates
the full client record with everything already known — business name, location, website,
competitor list pulled from Google Business Profile API, and a suggested service package
based on gaps identified during the sales process. No re-entry. No copy-paste.
The lead becomes the client instantaneously.

**Per-client email domain isolation** using SendGrid/Postmark per client domain —
solving GoHighLevel's biggest technical weakness (shared Mailgun infrastructure causing
30% inbox drop rates). Each client's outbound communication goes through a dedicated
sending domain.

---

### Payments and Billing

**First screen:** Six KPI cards above the fold — MRR, ARR, Outstanding, Overdue,
Avg. Days to Pay, Collected MTD. Below: Accounts Aging visualization (0-30, 31-60,
61-90, 90+ day buckets in color-coded bars). Below that: filterable invoice list
with Stripe-style status tabs (Draft, Sent, Viewed, Overdue, Paid).

**The feature that changes behavior:** Invoice read receipts. Reps see exactly when
a client opened an invoice. FreshBooks proved this single feature changes rep behavior —
follow-up calls happen at the right moment instead of guessing.

**The thing no competitor offers:** Revenue by Lead Source. A bar or donut chart
showing which marketing channels generated the most invoiced revenue. When an agency
can see "Google Ads generated $67,000 in revenue at $3,100 spend → 21.6x ROI," that
is not a billing feature — it is a business intelligence feature that no billing tool,
no CRM, and no analytics platform currently provides because none of them have access
to all three data layers simultaneously.

**Task-to-invoice:** When a deliverable task is marked Deployed, a Wave invoice
line item is auto-created for the associated service. The account manager reviews
and sends with one click. The workflow that previously required switching apps
and manually copying task details into invoice line items is eliminated entirely.

---

### Task Management

**First screen (global `/tasks` route):** "My Day" — a personal aggregator showing
all assigned tasks across all clients, grouped by due date (Today, Overdue, Upcoming).
The critical column that does not exist in any competitor: **Client Context** — each
task row shows the client name with their health score dot. A rep can scan the list
and immediately identify "three overdue tasks all belong to a yellow-health client"
without clicking anything.

**Default view:** Board (Kanban), not List. Research across ClickUp, Monday, Asana
confirms that Board is faster to adopt and reduces cognitive load for non-technical
users. List view available via toggle. Board as default is non-negotiable.

**The interaction that matters most:** Inline status transitions. Dragging a card
or clicking a status button updates instantly with optimistic UI — no loading spinner,
no page reload. A loading spinner when moving a task from In Progress to In Review
is the single fastest way to destroy the native feeling.

**Smart automation from marketing events:** New lead → auto-create onboarding checklist.
Deal closes → generate project tasks from service package template. Website traffic
drops 20%+ → create SEO review task assigned to account manager. These automations
are what the task board becomes over time — not just a manual to-do list, but an
intelligent dispatch system fed by all the other modules.

---

### Content Studio

**First screen:** Two-pane layout. Left: editorial calendar showing scheduled content
across all channels (blog, Google Business Profile posts, social), color-coded by
content type, with drag-to-reschedule. Right: "Content Opportunities" panel pulling
from Google Search Console and Ahrefs APIs — declining pages, keywords ranking on
page 2, competitor content gaps. This right panel answers "what should I write next"
without requiring anyone to open Ahrefs in a separate tab.

**The editor:** Split-view. Writing canvas on the left. Persistent SEO panel on the
right — always visible while writing, never hidden behind a tab. The SEO panel shows:
Content Score gauge (0-100, color-coded, updates live as the user types), Keyword
checklist with current vs. target counts pulled from Ahrefs/Semrush API (terms turn
green when hit), word/heading/image count progress bars, and SERP preview.

The Content Score gamification is Surfer SEO's most-cited retention driver and the
thing their users call "addictive." Writers know exactly which words to use and how
many times. We implement this natively — not as a Surfer integration requiring a
separate $100+/month subscription.

**Publish targets:** Each content piece shows which platforms it's scheduled for.
Publishing sends the blog post to the GHM-built website, schedules the GBP post,
and queues the social variants — all from one action. No switching between tools.

**Content-to-revenue attribution:** The KPI that no content tool offers. "This blog
post generated 47 leads, 12 became clients, producing $34,000 in revenue." Visible
on every content card in the calendar. This is possible only because GHM has access
to the full lead → client → invoice data layer simultaneously.

---

### Website Studio

**Portfolio landing screen (the `/website-studio` route with client picker):**
Card tiles showing live thumbnail, domain, last deploy timestamp, PageSpeed score
(mobile/desktop), and a health dot. Empty state surfaces template suggestions
organized by the industry categories already in the client records — "You have
4 HVAC clients, here are the top-performing HVAC site structures." No blank canvas.

**The editor — site intelligence bar:** A persistent strip below the top navigation
(always visible while editing) showing PageSpeed score, GSC impressions last 28 days,
ranking keywords count, and crawl errors. Clicking any number expands a detail drawer.
The editor stays focused on editing — it does not become an analytics tool — but the
numbers are always in peripheral vision so context never breaks.

**Google Business Profile API integration:** Auto-sync business hours, reviews, and
posts between GBP and the website. Auto-generate location pages for multi-location
clients. Display live Google Reviews embedded natively. For local business clients —
which are GHM's primary customer — GBP integration is not a nice-to-have; it is the
service they are paying for. No website builder does this natively.

**Form submissions:** Every contact form on a GHM-built site creates a CRM lead with
full page attribution (which page, which campaign, which keyword) automatically. The
website is not a static publishing tool — it is a lead generation machine with a
design interface on top.

**Build order rationale:** Website Studio is the most expensive module to build well.
The gap between "functional" and "excellent" is more visible here than anywhere else —
clients see their website every day. Website Studio is built last, after all other
modules are stable and the cross-module data layer is proven. We do it once and do
it right.

---

## Cross-Module Data Flows (What No Competitor Can Replicate)

These five flows are GHM's structural moat. They require the unified data layer.
No bolt-on integration can replicate them because they depend on architectural
decisions made before the first line of code.

**1. Lead Source → Revenue Attribution**
Ad spend connects to invoiced revenue through a single data layer. Facebook Ads
→ lead → client → Wave invoice = true channel ROI. Currently requires spreadsheets
and 4 separate tools to calculate manually.

**2. Task Completion → Invoice Generation**
When a deliverable is marked Deployed, a Wave invoice line item is auto-created.
FreshBooks offers time → invoice. GHM offers task → invoice and content-delivery
→ invoice. The workflow that currently requires switching apps is eliminated.

**3. Website Performance → Content Recommendations**
GSC and Ahrefs APIs identify declining pages and content gaps, then auto-create
prioritized content tasks with SEO briefs attached. The flow from site analytics
to content planning to task assignment exists nowhere else.

**4. Client Health Score**
Five-module composite score (tasks, payments, rankings, content, communication)
visible as a single dot everywhere a client appears. Answers "who needs attention
today" without opening a single module.

**5. Content → Lead Capture → Attribution**
Content published from Content Studio lands on GHM-built websites with embedded
forms that create CRM leads. The content that generated the lead is tracked through
to conversion and invoiced revenue. The content ROI loop is closed natively.

---

## Build Philosophy and Sequencing

### Current Reality (February 2026)
The product is built and in daily use. We are stress-testing before any SaaS
productization. The build sequence matters for perfecting what exists, not for
launching anything new.

### The Principle
We will not sell the SaaS product until every module works flawlessly. We use it
for GHM and break it until it is hard to break. Then we think about selling.

### Module Perfection Order
1. **Tasks + Billing (simultaneous)** — The cross-module connection (task → invoice)
   is GHM's most demonstrable differentiator. Perfecting these two together makes
   the connection real and proves the architecture.

2. **Client Health Score** — Launches at the same time as billing because that is
   when cross-module data starts to mean something. It is the connective tissue.

3. **Content Studio** — AI levels the playing field fastest here. The differentiator
   is Ahrefs/Semrush API integration in the editor and multi-channel publishing,
   not AI model quality.

4. **Lead Generation** — Pipeline kanban with the detail drawer. Convert-to-client
   flow with full data carry-through.

5. **Website Studio** — Last. Done once, done right. Most expensive to build
   excellently. Justified only after the rest is stable.

---

## Design Principles Derived From Competitive Research

**1. Lead with clarity, not breadth.**
Every module's default view answers "what needs my attention right now?" with zero
configuration. Pipedrive's pipeline-first and Asana's My Tasks win because they
prioritize action over information. GHM does the same.

**2. Make cross-module data visible and automatic.**
Revenue by Lead Source in billing. Client Health Score in task management.
Content Score with real SEO data in the editor. These widgets do not exist in
competitors because they require the unified data layer. GHM builds them as
first-class features, not afterthoughts.

**3. Solve the pricing trust crisis.**
HubSpot, Jasper, Surfer, Semrush, QuickBooks — all face user fury over billing
escalation, hidden fees, and cancellation friction. GoHighLevel built a nine-figure
business on flat transparent pricing. When GHM productizes, every feature that
competitors paywall should be evaluated for inclusion in the base plan. Paywalls
are decision points where a competitor's user thinks "I wish I could do this
without paying more." We eliminate as many as possible.

---

## Competitive Positioning When We Productize

We do not try to beat Pipedrive at pipeline management, FreshBooks at invoicing,
or Surfer at content scoring. Specialists always beat generalists on their own turf.

We wrap around them. We are the environment that makes using each of those tools
unnecessary — not by being better at their individual feature, but by being the
only product that connects all of them into one coherent operating reality.

The agencies who buy GHM are not choosing between us and Pipedrive. They are
choosing between managing five tools and managing one. The comparison is not
feature-by-feature — it is context-break-by-context-break.

**Target acquisition motion:** Agencies currently paying $400-600/month across
GoHighLevel + ClickUp + Ahrefs + FreshBooks + a website builder. GHM replaces
all five. The ROI calculation is not subtle.

---

*This document is the product vision. New instances should read this before making
any UI/UX or architectural decisions. The competitive analysis that produced this
vision is preserved in chat history (February 21, 2026 session) and should be
referenced when module-specific decisions require deeper competitive context.*
