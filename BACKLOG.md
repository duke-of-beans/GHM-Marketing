# GHM DASHBOARD — PRODUCT BACKLOG
**Consolidated from: past chat sessions, STATUS.md, VISION.md, and live session decisions.**
**Last Updated:** February 23, 2026 — Commission validation closed (was done Feb 22, BACKLOG was stale). Vendor Flexibility Architecture closed. Task→Invoice auto-generation added and closed.
**Owner:** David Kirsch

This file is the single source of truth for everything we want to build that isn't yet started.
STATUS.md owns what's done and what's in-sprint. This file owns what comes next.

---

## 🧭 HOW TO USE THIS FILE

Each item has a **tier**, **size estimate**, and **dependency note**.
Pick the top item in your current tier that unblocks the next thing, not the most interesting one.

**Tiers:**
- 🔴 MUST — Blocking client or rep operations right now
- 🟠 SHOULD — Blocking the productization / investor pitch / next client tier
- 🟡 WOULD — High value, no current blocker, but visible to users
- ⚪ FUTURE — Vision items, research needed, or deferred until scale

---

## 🔴 MUST — Active Blockers

### ✅ Commission Validation — COMPLETE (February 22, 2026)
**Commits:** f5fcb3f (validation run + Apex North test client deleted), f9e8bcf (Sprint B — historical Wave invoice import, commission validation cleanup in STATUS.md)
**Result:** Cron triggered, PaymentTransactions verified, Wave bill generated. End-to-end confirmed working.

### W7 — Kill Gusto (after parallel validation)
**Context:** Wave AP/payroll is fully built. Gavin is confident in the architecture but wants to prove it before cutting services — same protocol as BrightLocal. Run both in parallel, validate Wave covers everything Gusto does, then cancel.
**Action:** Run Wave + Gusto in parallel for 1-2 pay cycles → confirm Wave covers: payroll, contractor 1099, benefits tracking → once validated, cancel Gusto → update SALARY_ONLY_USER_IDS if anything changes.
**Gate:** Do not cancel Gusto until at least one successful payroll cycle through Wave is confirmed.
**Size:** Ops decision (no code). ~30 min to cancel once gate is cleared.

### I4 — Google Business Profile OAuth
**Context:** GBP integration is fully built (OAuth flow, reviews, insights, posts, Local Presence tab). Blocked on Google API Console approval for external app status.
**Action:** Monitor Google API Console approval status → flip from test to production → verify OAuth flow with a real client listing.
**Size:** ~1 hr once approved. Unblocks Local Presence tab for all clients.

---

## 🟠 SHOULD — Productization & Growth

### ✅ VENDOR FLEXIBILITY ARCHITECTURE — COMPLETE (February 23, 2026)
**Commit:** a6d8108 (Item 1 session)
**Delivered:** `src/lib/providers/` — types.ts, registry.ts, wave/accounting.ts, wave/payroll.ts, godaddy/domain.ts, resend/email.ts. TenantConfig extended with `providers` block. GHM registry entry wired. Zero new TypeScript errors.

**What needs to happen:**

**1. Payment / Accounting Provider Interface**
Build a `PaymentProvider` interface that Wave, Stripe, QuickBooks, and Xero all implement:
- `createInvoice(clientId, items)` → provider-specific
- `getInvoiceStatus(invoiceId)` → normalized
- `createBill(vendorId, amount)` → provider-specific
- `syncPaymentReceived(event)` → normalized webhook handler
Current Wave code moves to `src/lib/providers/wave/` implementing the interface.
Add `paymentProvider: "wave" | "stripe" | "quickbooks" | "xero"` to tenant config.

**2. Domain / Hosting Provider Interface**
Build a `DomainProvider` interface that GoDaddy, Namecheap, Cloudflare implement:
- `checkAvailability(domain)` → normalized
- `purchaseDomain(domain)` → provider-specific
- `setDNS(domain, records)` → normalized
- `deployToHosting(siteId, buildUrl)` → provider-specific
Current GoDaddy code moves to `src/lib/providers/godaddy/`.

**3. Payroll / Contractor Provider Interface**
Build a `PayrollProvider` interface that Wave Payroll, Gusto, ADP, Rippling implement:
- `syncContractor(vendor)` → provider-specific
- `createPayment(vendorId, amount, memo)` → provider-specific
- `getPaymentStatus(paymentId)` → normalized

**4. Tenant Config Extension**
`TENANT_REGISTRY` in `src/lib/tenant/config.ts` gains a `providers` block:
```
providers: {
  accounting: "wave",        // "wave" | "stripe" | "quickbooks" | "xero"
  hosting: "godaddy",        // "godaddy" | "namecheap" | "cloudflare" | "vercel"
  payroll: "wave",           // "wave" | "gusto" | "adp"
  emailMarketing: "resend",  // "resend" | "sendgrid" | "mailchimp"
  seo: "dataforseo",         // "dataforseo" | "ahrefs" | "semrush"
}
```

**5. Settings UI — Integrations Tab**
Admins select their providers from a dropdown per category. Each selection shows auth status, last sync, and cost. Currently partially built as integration health dashboard — extend it.

**Size:** ~2 sessions. This is foundational; do before adding any new vendor.
**Files:** `src/lib/providers/` (new directory), `src/lib/tenant/config.ts`, `src/app/(dashboard)/settings/`

---

### ✅ PWA Manifest + Push Notifications — COMPLETE (prior session)
**Delivered:** manifest.json, sw.js, ServiceWorkerRegistration, lib/push.ts (sendPushToUser/sendPushToUsers), /api/push/subscribe + /api/push-subscription, PushPermissionPrompt component, DashboardLayoutClient fully wired. Push fires on: team messages, task assignments, payment alerts, onboarding submissions.

### ✅ TeamFeed — Collapsible Permanent Sidebar — COMPLETE (prior session)
**Delivered:** TeamFeedSidebar + TeamFeedToggle components, DashboardLayoutClient flex-row layout, localStorage open/closed persistence, 30s unread polling. Replaces the Sheet/overlay pattern entirely.

---

### PWA Manifest + Push Notifications ~~(moved above — already done)~~
**Context:** Fully designed and spec'd in chat sessions. Aligns with mobile-first usage by sales reps.
**Scope:**
- VAPID key pair (generated once, env vars)
- `public/sw.js` service worker (~30 lines)
- `PushSubscription` DB table (one row per browser/device per user)
- `web-push` npm package on server
- Permission prompt in TeamFeed (natural trigger, not cold popup on page load)
- Fire notification on: new TeamFeed direct message, new task assignment
- PWA manifest with app icon, name, display mode (standalone), theme color
- "Add to Home Screen" prompt for iOS (Safari workaround for push support)
**Android:** Full support. **iOS 16.4+:** Requires PWA install first.
**Size:** ~1 session.
**Files:** `public/manifest.json`, `public/sw.js`, `prisma/schema.prisma`, `src/app/api/push/`

---

### ✅ TeamFeed — Collapsible Permanent Sidebar — COMPLETE (see above)

---

### TeamFeed — Collapsible Permanent Sidebar ~~(moved above — already done)~~
**Context:** Designed in chat. Currently TeamFeed opens as a Sheet overlay. A persistent sidebar that squeezes the content area is more intuitive for daily-driver tools.
**Scope:**
- New `TeamFeedSidebar` component — `w-80` when open, `w-0 overflow-hidden` when closed, `transition-all duration-300`
- Master page layout: flex row with content + sidebar as siblings (not overlay)
- State lifted to master page (toggle button in TeamFeed widget + sidebar close button share state)
- Dashboard widget's "View all" becomes a toggle, not a Sheet trigger
- TeamFeed compose bar stays in sidebar; widget compose bar opens sidebar + focuses input
**Size:** ~2-3 hrs.
**Files:** `src/components/team-feed/TeamFeedSidebar.tsx` (new), `src/app/(dashboard)/master/page.tsx`

---

### TeamFeed — Multimedia (Image/File Upload, GIF, Emoji Reactions)
**Context:** Full blueprint exists at `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\TEAMFEED_MULTIMEDIA.md`.
**Scope summary:**
- DB: `TeamMessageAttachment` + `TeamMessageReaction` models
- Storage: Vercel Blob for images/files; Tenor CDN for GIFs (no upload)
- Components: `MediaUploadButton`, `GifPicker`, `EmojiPicker` (hand-rolled shortlist v1), `AttachmentPreview`, `AttachmentRenderer`, `ReactionBar`
- Compose toolbar: [ 📷 Image ] [ 📎 File ] [ GIF ] [ 😊 Emoji ] row
- Reaction bar: below each message, emoji groups with count + tooltip (who reacted), `+` button opens picker
- Env vars needed: `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_TENOR_API_KEY` (free)
**Size:** ~1 focused session.
**See:** Blueprint doc for full migration order.

---

### AI-Powered Universal Search (COVOS Intelligence Layer)
**Context:** Not in backlog previously. Distinct from the command palette (Cmd+K) — that's fast navigation. This is contextual intelligence. The difference: command palette finds "German Auto Doctor." AI search answers "which clients are at churn risk this month" or "find the task where we discussed satellite site for the restaurant client in Round Rock."
**Vision:** A single search bar, globally available, that understands the entire Covos data model AND the live state of this specific agency's data. When inside a client record, it automatically scopes to that client first. When at the master dashboard level, it searches across everything.

**Two knowledge layers it must hold simultaneously:**
- **Platform knowledge** — what every feature does, what every field means, how modules connect (leads → clients → tasks → content → invoices → reports). This is the "trained on everything Covos" layer. Essentially a RAG index over the codebase docs, schema, and VISION.md.
- **Live tenant data** — this agency's actual clients, leads, tasks, scan history, notes, invoice states, competitor data, voice profiles, domain records. Queried at search time, not pre-indexed (too volatile).

**Behaviors:**
- Streaming autocomplete as you type — suggestions appear before you finish the query
- Two result types surfaced simultaneously:
  - **Navigational** → "German Auto Doctor → Tasks tab" (deep link, instant)
  - **Natural language answers** → "3 tasks overdue, last scan 14 days ago, health score 61" (answered inline, no navigation required)
- Client-scoped mode: when search is triggered from inside a client record, results prioritize that client's data and preface answers with client context
- Cross-entity queries: "show me all leads with a health score under 40 that haven't been touched in 7 days" → returns a filtered result set, not just a link
- Action suggestions: "generate audit for [lead]" → surfaces as a one-click action from the search result
- Remembers recent queries per user (last 10, stored in localStorage)

**Technical approach:**
- Search input triggers a streaming API call to `/api/search` with the query + current page context (are we on a client? which client? which tab?)
- API route: builds a dynamic context payload (current tenant data summary, client record if scoped) + passes to `callAI()` with a search-specialist system prompt
- System prompt gives the model: full schema summary, feature glossary, current user role, scoped context if applicable
- Model returns structured JSON: `{ navigational: [...], answers: [...], actions: [...] }`
- Frontend renders the three sections in a popover/modal with keyboard navigation (↑↓ to move, Enter to execute)
- Navigational results use existing router; answer results render inline; action results trigger existing handlers
- For cross-entity DB queries: model emits a structured query intent (`{ entity: "leads", filters: { healthScore: { lt: 40 }, lastTouchedDaysAgo: { gt: 7 } } }`) which the API layer translates to a Prisma query — model never touches DB directly

**Autocomplete specifically:**
- Debounced 200ms after keystroke
- First pass: fast local match against client names, lead names, known nav routes (no AI call)
- Second pass (300ms): AI streaming for semantic + cross-entity results
- Results blend: local matches appear instantly, AI results stream in below them

**Covos productization angle:**
- Every Covos tenant gets the same search UI but it's scoped entirely to their data
- Platform knowledge layer is shared (same Covos docs/schema for all tenants)
- Tenant data layer is fully isolated — search on ghm.covos.app never touches another tenant's records
- This becomes a differentiating feature in the Covos product pitch: "natural language search across your entire agency"

**Size:** ~2 sessions (1 for API + system prompt + basic result rendering; 1 for autocomplete streaming + action layer + client-scoped mode).
**Files:** `src/app/api/search/route.ts` (new), `src/components/search/AISearchBar.tsx` (new), `src/components/search/SearchResult.tsx` (new), `src/lib/ai/search-prompt.ts` (new system prompt), global layout for search trigger.
**Prerequisite:** `callAI()` layer (complete). Vendor flexibility not required. Can build independently.

---

### Static Empty-State Help + Contextual Guides
**Context:** Every widget, page, and feature that hasn't been populated yet shows dead negative space. That space should work for the user — not with animations or toasts, but with static, in-place copy that tells them exactly what to do and why the thing in front of them matters.
**Philosophy:** This isn't onboarding. It's not a tooltip. It's the text that lives where data would be. If the lead pipeline is empty, the kanban should explain what it is and how to fill it. If the payments page has no transactions, it should explain how transactions get created and what approving one does. The copy must carry the sardonic COVOS voice — deadpan, fourth-wall-aware, never peppy.
**Scope:**
- Leads pipeline empty state: explain the kanban, how leads get into Available, what claiming means
- Payments page empty state: explain how PaymentTransactions are generated (cron + client activation), what "approve" does, what happens after approval
- Content Studio empty state: explain the approval queue, how content gets into it, what each status means
- Client roster empty state: explain that clients come from Won leads, and how to mark a lead Won
- Task queue empty state: explain how tasks get assigned, what categories mean, what the Generate button does
- Analytics empty state: explain what populates it (scan history, client health) and when it'll have data
- Team Feed empty state: already has voice copy — audit for consistency
- Reports section per-client: explain that reports require at least one scan + active status
- Dashboard widgets (earnings, goals, pipeline count): each zero state should explain what feeds that number
**Voice rules (same as tutorials and notifications):**
- Deadpan, sardonic, fourth-wall-aware
- Never say "Looks like..." or "It seems..." or "Welcome!"
- Never use exclamation points
- Acknowledge the emptiness without apologizing for it
- Tell them what to do, not how they feel about it
- Short. Two to four sentences max per empty state.
**Examples of the right tone:**
- Pipeline empty: "Nothing here. Leads show up in Available when you run a Discovery scan or import manually. Claim one to start moving it through the pipeline."
- Payments empty: "No transactions yet. The engine runs on the 1st of each month for active clients, and fires immediately when a client goes active. Once transactions exist, they'll appear here for approval."
- Analytics empty: "Data populates as clients get scanned. You need at least one active client with a completed scan before any of these charts mean anything."
**Implementation notes:**
- These are not components with logic — they're just the text that renders when `data.length === 0` or equivalent
- Some already exist (Team Feed) — audit those for voice consistency
- No animations, no icons required (though a subtle muted icon is fine if it helps orientation)
- Each empty state should answer: what is this section, what populates it, what should I do right now
**Size:** ~1 session (mostly copy + small conditional renders). High polish value, low complexity.

---

### Keyboard Shortcuts + Command Palette (Cmd+K)
**Context:** Mentioned in multiple past sessions, listed in MISSING_FEATURES_TODO.md, confirmed desired in VISION.md as power-user feature.
**Scope:**
- Global `Cmd+K` (Mac) / `Ctrl+K` (Win) opens command palette
- Fuzzy-search across: all clients, all leads, all nav pages, all quick actions (Create Lead, Generate Audit, New Task, etc.)
- Keyboard shortcuts for common actions: `G L` → go to leads, `G C` → go to clients, `N L` → new lead, `N T` → new task
- Shortcut hint overlay (e.g., `?` shows all shortcuts)
- Use `cmdk` library (shadcn already wraps it: `npx shadcn add command`)
**Size:** ~1 session for command palette; shortcuts are additive.

---

### Client Portal — Full Activation
**Context:** Portal was built but `.disabled` file extension was blocking it. Token-based auth, client-facing read-only view. Contract claims this exists.
**Check first:** Verify current state — the onboarding portal (OnboardingToken) may have fully superseded the old portal spec. Confirm which portal is live, which is disabled, and whether the old portal still needs activation.
**If still needed:** 
- `ALTER TABLE client_profiles ADD COLUMN portal_token VARCHAR(255) UNIQUE;`
- Rename 3 disabled files (remove `.disabled` extension)
- Test client access with a real token
**Size:** ~30 min if it's just the migration. Larger if portal UX needs updates post-onboarding-portal refactor.

---

### Security Hardening
**Context:** Flagged in MISSING_FEATURES_TODO.md as medium priority.
**Scope:**
- 2FA for admin + master accounts (TOTP via `otplib` or use NextAuth's built-in MFA hooks)
- Rate limiting per user on auth endpoints (next-rate-limit or Vercel's built-in Edge middleware)
- CSRF token verification on sensitive mutation routes (currently relying on same-origin)
- Security headers audit (`Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`) via `next.config.js` headers
**Size:** ~1 session.

---

## 🟡 WOULD — High Value, No Current Blocker

### Advanced Filter Persistence + Save Searches
**Context:** Pipeline filter bar has localStorage persistence (added Feb 22). The next tier is saved named searches.
**Scope:**
- "Save this filter" button in filter bar → names the current filter combo
- Saved searches appear as chips above the filter bar (e.g., "Hot leads - Austin" | "Stale pipeline")
- Per-user, persisted to DB (not just localStorage)
- Max 5 saved searches per user
**Size:** ~2 hrs.

### Pipeline Filter — Remaining UX Debt
**Context:** Major UX pass done Feb 22. Remaining items from original spec:
- Add "Lead Source" filter (organic, referral, discovery, import — exists in DB, not surfaced in UI)
- Add "Deal Value" range slider filter
- Add "Days in Stage" filter (surface leads stale in current stage > N days)
**Size:** ~2 hrs total.

### Reporting — Custom Report Builder
**Context:** Reports currently auto-generated from scan data. Power users want to pick and choose sections.
**Scope:**
- Section toggle UI before generation: [ ✓ Health Score ] [ ✓ Keyword Rankings ] [ ✓ Citations ] [ ✓ Competitor Gap ] [ ✓ Google Ads ] [ ✓ Recommendations ]
- Per-client report template (save their preferred sections so each month's report generates consistently)
- "Executive Summary" section — AI-written 3-sentence paragraph at top using scan delta data
**Size:** ~1 session.

### Reporting — Scheduled Delivery
**Context:** Reports manually generated. Clients expect monthly delivery without action from ops team.
**Scope:**
- Per-client: report schedule (1st, 5th, or 15th of month), delivery email, cc list
- Monthly cron generates + emails reports for all clients with schedule set
- Delivery log on client record (sent at, to whom, open tracking if Resend supports it)
**Size:** ~1 session.

### Data Export (Leads + Clients → CSV/XLSX)
**Context:** Requested in MISSING_FEATURES_TODO.md. Zero export capability currently.
**Scope:**
- "Export" button on Leads table → downloads CSV of current filtered view
- "Export" button on Clients table → downloads CSV
- Column picker: choose which fields to include
- Admin only: full DB exports for backup / external reporting
**Size:** ~3 hrs.

### Sentry Error Monitoring
**Context:** No runtime error visibility. Users report bugs that should be auto-surfaced.
**Scope:**
- `@sentry/nextjs` install + wizard config
- Source maps uploaded on deploy (Vercel plugin)
- Alerts configured: error rate threshold, new error types
- User context attached to events (role, email) for triage
**Size:** ~1 hr setup.

### Structured Logging (Replace console.log)
**Context:** Crons and API routes use `console.log` extensively — no severity, no trace IDs.
**Scope:**
- Replace with a minimal structured logger: `log.info()`, `log.warn()`, `log.error()` with JSON output
- Add correlation IDs to API routes (attach to request context)
- Consider `pino` (lightweight, JSON, Vercel-compatible)
**Size:** ~2 hrs.

### Bulk Content Operations
**Context:** In MISSING_FEATURES_TODO.md. Content Studio manages items one at a time.
**Scope:**
- Checkbox multi-select on Content Studio list
- Bulk approve (master+ only)
- Bulk archive
- Bulk assign (change responsible user)
**Size:** ~2 hrs.

### Competitor Tracking — Manual Add + Refresh
**Context:** Competitors are seeded at client creation and updated by scans. No manual refresh.
**Scope:**
- "Add Competitor" button on Scorecard tab → name + domain, saves to `ClientCompetitor`
- "Remove Competitor" button
- "Refresh Competitor Data" button → re-runs enrichment for a single competitor on demand
**Size:** ~2 hrs.

### Audit PDF — "Paid Search Opportunity" Section
**Context:** Listed in ITEM-001 scope but not yet built.
**Scope:** Add a section to the audit PDF template that shows: current estimated monthly search volume for the prospect's target keywords, competitor ad spend indicators (DataForSEO data), and a "you're leaving X/mo in paid visibility on the table" call-to-action framing.
**Size:** ~1 hr (audit PDF is template-driven).

### Digital Brochure — PPC/Ads Highlight
**Context:** ITEM-001 scope. Brochure currently focuses on SEO. Should highlight Ads management as included.
**Scope:** Add a section/card to `src/app/(onboarding)/brochure/page.tsx` covering Google Ads management + PPC as part of the $2,400/mo package. Include mock campaign metrics.
**Size:** ~1 hr.

---

## ⚪ FUTURE — Vision & Scale

### Accessibility (WCAG 2.1 AA)
**Context:** Basic accessibility only. Not blocking current users but required before enterprise sales.
**Scope:** Screen reader optimization, keyboard navigation throughout, focus indicators, high contrast mode, proper ARIA labels on all interactive elements.
**Size:** ~1-2 weeks for full audit + fix pass. Start with keyboard navigation (highest ROI).

### Mobile-Optimized UX (Beyond Responsive)
**Context:** Current responsive design handles mobile passably. Sales reps use phones in the field.
**Scope:** 
- Full-screen mobile kanban (currently a horizontal scroll on small viewports — was flagged as a known UX issue)
- Touch-optimized lead cards with swipe actions (swipe right = claim, swipe left = dismiss)
- Mobile-specific quick actions (one-tap audit, one-tap call)
- Consider Progressive Web App (builds on PWA manifest item above)
**Size:** ~2-3 sessions.

### Native Mobile Apps (iOS + Android)
**Context:** In FUTURE ROADMAP in STATUS.md. Long-range item.
**Approach:** React Native with shared business logic from dashboard. Use Expo for faster iteration.
**Prerequisite:** API layer must be clean and fully documented. Push notifications (above) must be live first.

### White-Label / Multi-Agency Productization (Covos)
**Context:** Multi-tenant infrastructure (covos.app, `*.covos.app`, `TENANT_REGISTRY`) is live as of Feb 22. This is the next tier of work to make it a real product.
**Scope:**
- Onboarding flow for a new agency on Covos (self-serve subdomain + tenant setup)
- Per-tenant branding: logo, primary color, company name in all UI and emails
- Per-tenant billing (GHM pays Covos; other agencies pay per seat or per client)
- Tenant admin panel: user management, billing, integration config, branding
- Data isolation audit: verify no cross-tenant data leakage in any API route
- Provider config UI (see Vendor Flexibility Architecture above — prerequisite)
**Prerequisite:** Vendor Flexibility Architecture must be complete.
**Size:** 2-3 sessions for the core self-serve flow; ongoing for billing and admin.

### Zapier / Webhook Outbound Integration
**Context:** External teams want to trigger actions from GHM events (new client, new task, status change).
**Scope:** 
- Outbound webhook system: admin configures URLs + event types
- Events: `client.created`, `lead.closed`, `task.approved`, `invoice.paid`, `report.sent`
- Payload standardized (same schema regardless of provider)
- Zapier app submission (longer-term — requires Zapier partner account)
**Size:** ~1 session for webhook system; Zapier app is a separate project.

### Slack Integration (Outbound Notifications)
**Context:** TeamFeed covers internal comms. Slack is for external / cross-tool visibility.
**Scope:** 
- Slack bot: post to a configured channel on `lead.closed`, `invoice.paid`, `report.sent`
- Slash commands: `/ghm client [name]` → returns client health card in Slack
- Per-channel config in Settings → Integrations tab
**Prerequisite:** Webhook system (above) makes this a thin wrapper.

### Calendar Integration
**Context:** Tasks have due dates, scans have schedules, reports have send dates. None sync to calendar.
**Scope:**
- Google Calendar OAuth → sync tasks with due dates to user's calendar
- GCal → GHM: import meetings with clients as Notes on the client record
- "Schedule a call" button on lead detail → creates calendar invite + logs as activity
**Size:** ~1 session.

### Advanced Analytics — Cohort + Churn Prediction
**Context:** Current analytics shows revenue, funnel, and lead source. Next tier is predictive.
**Scope:**
- Cohort analysis: group clients by close month, track MRR retention by cohort
- Churn risk score: ML-simple scoring based on health score trend + task completion rate + last contact date
- Churn risk dashboard: clients flagged as at-risk with suggested interventions
- Territory heatmap: visual map overlay showing density of leads vs. clients vs. available market
**Prerequisite:** 6+ months of scan data + 20+ active clients for model training.

### Lead Nurture Sequences
**Context:** Currently leads are either active in pipeline or dormant. No automated follow-up.
**Scope:**
- Nurture sequence builder: define a series of touchpoints (email at day 3, task at day 7, etc.)
- Auto-assign leads to sequences based on stage + inactivity threshold
- Sequence activity logged to lead history
- Sequence pause/resume/remove per lead
**Prerequisite:** Resend email integration (already live). Needs sequence UI + cron runner.

### AI-Powered Discovery (Automated Lead Sourcing)
**Context:** Discovery currently requires manual search + import. Future: runs on a schedule.
**Scope:**
- Scheduled territory sweeps: cron scans Google Maps for businesses in each territory
- Lead scoring: AI ranks discovered businesses by opportunity score (DR, review count, current SEO visibility)
- Auto-import: high-score leads land in Available column automatically
- Budget management: cost cap per territory per month for API calls
**Prerequisite:** DataForSEO SERP integration (I2, complete) + GBP integration (I4, pending Google approval).

### Review Enhancement Engine
**Context:** Listed in FUTURE ROADMAP in STATUS.md.
**Scope:** Monitor client Google review counts + ratings daily. Auto-flag when new review drops below 4 stars. Generate AI-drafted response suggestion using client's voice profile. Surfaces in client detail → Reviews section.

### PPC Keyword Automation
**Context:** Listed in FUTURE ROADMAP in STATUS.md.
**Scope:** DataForSEO keyword suggestions → auto-populate Google Ads campaign keywords for new clients. Keyword performance data from Ads API feeds back into keyword strategy adjustments.

---

## 📋 ITEMS RECOVERED FROM PAST SESSIONS (Not Yet in STATUS.md)

These were discussed and designed but never formally tracked. Assigning tiers now.

| Item | Source | Tier | Notes |
|------|---------|------|-------|
| TeamFeed permanent sidebar | Chat Feb 18 | 🟡 | See full scope above |
| Push notifications / PWA | Chat Feb 18 | 🟠 | See full scope above |
| TeamFeed multimedia | Blueprint Feb 18 | 🟡 | Full blueprint exists |
| Save search templates (Discovery) | Copy audit chat | 🟡 | Discovery page only |
| Batch approve in review queue | Copy audit chat | 🟡 | See Bulk Content Operations above |
| Welcome checklist for new users | Copy audit chat | 🟡 | Separate from per-page tutorials |
| Mobile kanban dropdown solution | Copy audit chat | 🟡 | Specific pain: horizontal scroll on mobile |
| Lead → client transition feedback toast | Copy audit chat | 🟡 | 30-min fix |
| Chart title improvements (benefit-focused) | Copy audit chat | 🟡 | Low effort, nice polish |
| Tooltip on health score, qualification score | Copy audit chat | 🟡 | Most are done; audit remaining metrics |
| Google Calendar sync | Chat Feb 18 | ⚪ | See Calendar Integration above |
| Zapier outbound | Multiple chats | ⚪ | See Webhook system above |
| Slack integration | Multiple chats | ⚪ | See Slack above |
| Custom report builder | MISSING_FEATURES_TODO | 🟡 | See above |
| Advanced analytics (cohorts, churn) | MISSING_FEATURES_TODO | ⚪ | See above |
| Data export (CSV/XLSX) | MISSING_FEATURES_TODO | 🟡 | See above |
| 2FA for admin | MISSING_FEATURES_TODO | 🟠 | See Security above |
| Rate limiting | MISSING_FEATURES_TODO | 🟠 | See Security above |
| Sentry | MISSING_FEATURES_TODO | 🟡 | See above |
| Accessibility (WCAG AA) | MISSING_FEATURES_TODO | ⚪ | See above |
| Mobile native apps | STATUS.md FUTURE | ⚪ | See above |

---

## 🔒 ARCHITECTURAL DECISIONS LOCKED (Do Not Revisit Without New Evidence)

- `prisma db push` only — never `prisma migrate dev` (Neon constraint)
- `master` stays as DB enum value — display as "Manager" via `ROLE_LABELS`
- `SALARY_ONLY_USER_IDS = [4]` (Gavin) — never engine-generated payments
- Test account (userId=6) — never assign to real clients
- All AI calls route through `callAI()` — no raw `anthropic.messages` outside `src/lib/ai/`
- Vendor integrations must go behind provider interfaces before adding new ones (see Vendor Flexibility above)
