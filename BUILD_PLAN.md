# GHM DASHBOARD - MASTER BUILD PLAN
> ⚠️ **Current status lives in `STATUS.md`** — This file contains confirmed decisions, specs, and architecture. For what's done vs what's next, read STATUS.md.

**Project:** GHM Dashboard - SEO Services Platform  
**Date:** February 17, 2026  
**Status:** Active Development

---

## 🎯 CONFIRMED DECISIONS (All Approved)

### 1. EDIT CLIENT DETAILS ✅ IN PROGRESS
**Status:** 95% complete, needs 3 lines of integration  
**Priority:** IMMEDIATE (build today)  
**Effort:** 1-2 days  

**What's Built:**
- ✅ API endpoint: `/api/clients/[id]` (PATCH method)
- ✅ Edit dialog component: `edit-client-dialog.tsx`
- ✅ Validation with Zod
- ✅ Audit trail via system notes

**What's Needed:**
- Add import to `profile.tsx`
- Add refresh handler
- Add Edit button to header

**Deliverable:** Can edit all client information from detail page

---

### 2. COMMISSION & RESIDUAL TRACKING ✅ APPROVED
**Status:** Spec complete, ready to build  
**Priority:** HIGH (build in parallel with edit)  
**Effort:** 4 weeks (phased rollout)  

**Commission Structure:**
- Sales Rep: $1,000 commission (one-time, first month after signing + payment)
- Sales Rep: $200/mo residual (starting month 2, ongoing)
- Master Manager (David): $240/mo (starting month 1, ongoing)
- Master Manager (Gavin): $0 (owner profit)

**Sales Rep:** Arian Germani (already in system)

**Implementation Phases:**
1. **Week 1:** Database schema + payment calculations
2. **Week 2:** Admin configuration UI
3. **Week 3:** Dashboard widgets (rep, master, owner views)
4. **Week 4:** Reporting & notifications

**Spec:** `COMMISSION_SYSTEM_SPEC.md` (637 lines)

---

### 3. LEAD ENRICHMENT ENHANCEMENT ✅ APPROVED
**Status:** Spec complete  
**Priority:** MEDIUM (after commission Phase 1)  
**Effort:** 3-5 days  

**Features:**
- Single lead enrich button (client detail page)
- Batch enrich with multi-select (lead list)
- Duplicate detection (don't pay twice)
- Cost tracking per enrichment
- Warning when lead already enriched

**Deliverable:** Efficient lead enrichment without wasted API costs

---

### 4. WEBSITE BUILD AUTOMATION PIPELINE ✅ APPROVED
**Status:** Architecture confirmed, spec in progress  
**Priority:** HIGH (start after commission phases 1-2)  
**Effort:** 6-7 weeks  

#### CRITICAL TECHNICAL DECISIONS:

**Satellite Site Deployment:** Option B (Vercel + Custom Domains)
- System generates Next.js site
- Auto-deploy to Vercel
- Purchase domain from GoDaddy/similar
- Point DNS to Vercel
- Free SSL, automatic deployments, blazing fast
- GHM owns satellites

**Main Site Extensions:** Option B (Subdomain Approach)
- Extensions deployed to subdomain (e.g., `blog.germanautodoctor.com`)
- Avoids client friction (no WordPress credentials needed)
- Full control over quality
- Modern tech stack
- Client's main site stays untouched
- GHM owns extensions

**Why Subdomains:**
- Avoids "What's your WordPress login?" nightmare
- No waiting weeks for client credentials
- No dealing with forgotten passwords
- No touching their fragile setup
- Just deploy and move on

**Integration Points:**
- SENTRY scouts keywords/topics
- SCRVNR writes content in client voice
- System generates site structure
- Rep initiates builds (fills form)
- David handles custom development

**Workflow:**
1. Rep marks client needs website (product selected)
2. Rep clicks "Start Build" in dashboard
3. System asks template-driven questions:
   - Which template? (Extension vs Satellite)
   - Business details (auto-pulled from client record)
   - Website URL (to analyze main site)
4. System auto-generates:
   - GitHub repo (from template)
   - Vercel project (auto-deploy)
   - Style guide (scraped from main site)
   - Source of Truth documentation
   - Task list for David
5. System flags custom requirements
6. David takes over (4 hours instead of 20 hours)

**Spec:** `COMMISSION_SYSTEM_SPEC.md` contains website pipeline notes

---

### 5. SENTRY INTELLIGENCE SYSTEM ✅ OPTION B CONFIRMED
**Status:** Architecture decided  
**Priority:** MEDIUM (after website pipeline foundations)  
**Effort:** 1 day (simple system)  

**CRITICAL DECISION: Build Simple GHM-Specific System**

**NOT using Gregore SENTRY because:**
- Gregore = 800+ lines, complex pattern detection, learning loops
- GHM needs = 250 lines, simple keyword monitoring
- Gregore = research intelligence (unknown unknowns)
- GHM = task automation (known objectives)

**What GHM SENTRY Does (Simple):**
1. Monitor competitor keywords (Ahrefs API)
   - Find keywords: volume > 100, difficulty < 30
   - Client doesn't rank for them yet
   - Queue top 20 for content

2. Website change detection (basic scraping)
   - Check if competitor added pages
   - Alert when changes detected

3. Industry news (basic RSS)
   - Auto repair industry feeds
   - SEO blog feeds
   - Show in dashboard

4. Content topic queue (for SCRVNR)
   - Send topics to SCRVNR
   - Create tasks for content writing

**Total Complexity:** ~250 lines  
**Dependencies:** Ahrefs SDK, web scraper, RSS parser  
**UI:** Simple table/list, no graphs or timelines

---

### 6. SCRVNR INTEGRATION ✅ EXISTS & READY
**Status:** SCRVNR fully operational at `D:\SCRVNR`  
**Priority:** Integration needed for website pipeline  

**What SCRVNR Is:**
- Voice synthesis system (v1.0.0, production ready)
- Captures David's authentic voice
- 5 environments: DEV, RESEARCH, CAREER, WORK, PERSONAL
- SQLite voice pattern database
- Auto-learning from every output
- Quality gates (7 automated checks)

**GHM Integration Needs:**
1. Create "CLIENT" environment (6th environment)
2. Voice profiling per client (scrape main site for voice)
3. Topic-to-content workflow
4. Quality validation before publish
5. Deploy button (human approval)

**Components:**
```
D:\SCRVNR\
├── core/protocols/          # 8 protocol files
├── environments/            # 5 calibrations (need +1 for clients)
├── learning/voice.db        # Pattern database
├── tools/orchestrator.py    # Python automation
```

---

## 📊 BUILD PRIORITY MATRIX

```
High Impact │ 2. Commission    │ 1. Edit Client
            │    System        │    Details ✅
            │ 4. Website       │
            │    Pipeline      │
            ├──────────────────┼──────────────
Medium      │ 5. SENTRY        │ 3. Lead
Impact      │    Intelligence  │    Enrichment
            │                  │
Low Impact  │                  │
            └──────────────────┴──────────────
              High Effort    →    Low Effort
```

**Legend:**
- ✅ Quick win (Edit Client - doing now)
- 🔴 Strategic investment (Commission, Website - high value)
- ⚪ Nice to have (SENTRY, Enrichment - optimize later)

---

---

## Phase 12: Commission System — Transaction Engine ✅

**Session:** Feb 2026
**Status:** Complete — TypeScript clean, zero new errors

### What Was Missing

The commission system had complete schema, calculation engine, 3 payment read APIs, and all dashboard widgets — but no mechanism to actually *create* transactions. Every widget was reading from a table that could never have rows in it.

Three pieces were missing in dependency order:

**1. Monthly cron job** (`src/app/api/cron/generate-payments/route.ts`)
- Runs 1st of every month at 12:01 AM UTC (vercel.json updated)
- Fetches all active clients + compensation configs in two queries
- Idempotency check via Set: skips `clientId-userId-type` combos already created this month
- Generates residuals (salesRepId + config + month eligibility check)
- Generates master fees (masterManagerId + config + non-owner check)
- Batch insert via `createMany` — atomic, safe to re-run
- Returns `{ created, skipped, clientsProcessed, duration }` for observability

**2. CompensationConfigSection wired into TeamManagementTab**
- Component existed but was never mounted
- Added import + `Separator` import to `TeamManagementTab.tsx`
- Mounted below user list, master-role-only, passes active users filtered from existing state
- Admins can now set per-user commission/residual/master-fee config before the cron fires

**3. Commission trigger on client onboard** (clients `[id]/route.ts`)
- Detects `status → "active"` transition in the existing PATCH handler
- Fires a one-time commission transaction for the salesRep immediately
- Idempotency check: skips if a commission already exists for that client (handles re-activation)
- Auto-stamps `onboardedMonth` on ClientProfile if not already set (residual eligibility depends on it)
- Non-fatal: commission failure logs and continues — the client update already succeeded

### Files Changed

| File | Change |
|---|---|
| `src/app/api/cron/generate-payments/route.ts` | NEW — monthly payment generation cron |
| `vercel.json` | Added `generate-payments` cron schedule (`1 0 1 * *`) |
| `src/components/settings/TeamManagementTab.tsx` | Mounted `CompensationConfigSection` below user list |
| `src/app/api/clients/[id]/route.ts` | Added commission trigger on status → active transition |

---

## 🚀 IMPLEMENTATION TIMELINE

### Phase 1: Foundation (This Week)
**Days 1-2:**
- ✅ Fix client detail page crash (DONE)
- 🔄 Edit Client Details (95% complete)
- 🔄 Commission System database schema

**Days 3-5:**
- Commission Phase 1: Payment calculations
- Lead enrichment enhancements

### Phase 2: Commission System (Weeks 2-4)
**Week 2:**
- Commission Phase 2: Admin configuration
- Team page compensation controls
- Client detail sales rep assignment

**Week 3:**
- Commission Phase 3: Dashboard widgets
- Sales rep earnings view
- Master manager earnings view
- Owner profit dashboard

**Week 4:**
- Commission Phase 4: Reporting
- Payment history
- CSV/PDF exports
- Email notifications

### Phase 3: Website Automation (Weeks 5-10)
**Weeks 5-6:**
- Website intelligence gathering
- Style guide generation
- Template architecture
- Source of Truth documentation

**Weeks 7-8:**
- Repo automation (GitHub)
- Deployment automation (Vercel)
- Domain management integration

**Weeks 9-10:**
- SCRVNR integration (content generation)
- SENTRY integration (topic scouting)
- Rep-facing UI (build initiation)

### Phase 4: Intelligence & Polish (Weeks 11+)
**Week 11:**
- SENTRY simple system
- Ahrefs keyword monitoring
- Competitor change detection

**Week 12:**
- Task management enhancements
- Bulk import
- Templates

---

## 🗂️ DOCUMENTATION INDEX

All specifications are located in: `D:\Work\SEO-Services\ghm-dashboard\`

### Core Specifications
1. **COMMISSION_SYSTEM_SPEC.md** (637 lines)
   - Payment structure
   - Database schema
   - UI/UX designs
   - Implementation phases
   - Edge cases

2. **EDIT_AND_TASKS_SPEC.md** (598 lines)
   - Edit client details
   - Bulk task management
   - Task templates
   - Implementation phases

3. **FEATURE_ROADMAP.md** (339 lines)
   - Prioritized plan
   - ROI analysis
   - Decision framework
   - Timeline options

4. **CLIENT_DETAIL_FIX.md** (291 lines)
   - Debugging session notes
   - Decimal serialization fix
   - Database migration issues

5. **API_KEYS_SETUP.md** (262 lines)
   - Outscraper API key
   - Anthropic API key
   - Vercel configuration

### Current Session
6. **THIS FILE** - Master build plan
   - All confirmed decisions
   - Technical architecture
   - Implementation timeline

---

## 🎯 CRITICAL PRINCIPLES

### 1. Reduce Human Friction
**Website builds:** Automate everything possible, minimize client touchpoints
- Don't ask for WordPress credentials
- Don't request style guides they don't have
- Scrape what we need from their site
- Deploy to subdomains to avoid main site complexity

### 2. No Assumptions or Interpretations
**System design:** Remove guessing from humans (sales reps AND Claude)
- System scans client site for style/architecture
- System generates style guide automatically
- System validates choices before human approval
- Clear yes/no decisions, no ambiguity

### 3. Option B Perfection
**Quality:** 10x improvement, not 10%
- Don't port complex systems when simple ones work
- Gregore SENTRY = overkill for GHM
- Build exactly what's needed, nothing more

### 4. Automation > Manual Work
**Scalability:** If done 3x manually → automate
- Website builds: 4 hours with automation vs 3-4 months manual
- Content creation: SCRVNR vs manual writing
- Keyword research: SENTRY vs manual Ahrefs checking

---

## 🔐 CRITICAL TECHNICAL CONSTRAINTS

### Database Schema Changes
**Always run migration before deploying:**
```bash
npx prisma migrate dev --name descriptive_name
npx prisma generate
```

### Vercel Deployment
**Environment variables needed:**
- DATABASE_URL (Neon PostgreSQL)
- DIRECT_URL (Neon direct connection)
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- OUTSCRAPER_API_KEY
- ANTHROPIC_API_KEY

### File Paths (Immutable)
- SCRVNR: `D:\SCRVNR`
- Gregore: `D:\Projects\Gregore`
- GHM Dashboard: `D:\Work\SEO-Services\ghm-dashboard`
- Ideas: `D:\Projects\Ideas`

---

## 🚨 BLOCKERS & DEPENDENCIES

### Current Blockers
- None! All decisions made, ready to build

### External Dependencies
- Ahrefs API (for keyword research)
- Outscraper API (for lead enrichment)
- Anthropic API (for SCRVNR content generation)
- Vercel (for deployments)
- GitHub (for repo management)

### Internal Dependencies
- Commission System → Lead Enrichment (wait for Phase 1)
- Website Pipeline → SENTRY (need foundations first)
- Website Pipeline → SCRVNR (need client voice profiling)

---

## ✅ QUALITY GATES

### Before Deploying to Production
- [ ] All TypeScript errors resolved
- [ ] Database migrations run successfully
- [ ] Environment variables configured in Vercel
- [ ] Manual testing of new features
- [ ] No console errors in browser
- [ ] Mobile responsive (if UI changes)

### Before Marking Feature Complete
- [ ] Spec acceptance criteria met
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] User feedback collected (if possible)
- [ ] Documentation updated

---

## 📞 STAKEHOLDERS

### Decision Makers
- **David Kirsch** - Owner, primary developer
- **Gavin Kirsch** - Owner (business operations, no dev work)

### Users
- **Sales Reps** (Arian Germani, future hires)
- **Master Managers** (David, Gavin)
- **Clients** (indirect - website builds, content)

---

## 🎓 LESSONS LEARNED

### From Previous Sessions
1. **Don't over-engineer** - Gregore SENTRY is overkill for GHM
2. **Reduce client friction** - Subdomains avoid credential requests
3. **Automate scraping** - Don't ask for style guides, scrape them
4. **Phased rollouts work** - Commission system in 4 phases = manageable
5. **Specs before code** - Writing comprehensive specs saves time

### Future Sessions Should Know
- Edit Client Details is 95% done (just needs integration)
- Commission system approved with Arian Germani as first rep
- Website automation uses subdomains (NOT WordPress plugins)
- SENTRY for GHM is simple (~250 lines, NOT Gregore port)
- SCRVNR exists and works, just needs client environment

---

## 🔄 VERSION HISTORY

**v1.0** - February 17, 2026
- Initial master build plan
- All decisions from current session documented
- Commission system fully specified
- Website pipeline architecture confirmed
- SENTRY Option B selected
- Edit client details 95% complete

---

## 📝 NEXT SESSION CHECKLIST

When resuming work, check:
1. Is Edit Client Details finished? (should be deployed)
2. What commission phase are we on?
3. Any deployment issues from last session?
4. Any new client requirements?
5. Read this file to get context

---

**Status:** All decisions made, ready to execute  
**Last Updated:** February 17, 2026  
**Next Action:** Finish Edit Client Details integration (3 lines of code)


---

## 🏗️ WEBSITE STUDIO — BUILD STATUS (Added Feb 18, 2026)

### Foundation Complete ✅
All layers built and build passing (exit code 0, zero new TS errors).

**Types:** `src/types/website-studio.ts` — all entities typed (WebProperty, DnaCapture, DnaTokenOverride, BuildJob, ComposerPage, ScrvnrGateResult, matrix types, adapter contract)

**Schema:** 6 Prisma models added, `db push` applied, client regenerated
- WebProperty, DnaCapture, DnaTokenOverride, BuildJob, ComposerPage, ScrvnrGateResult
- `webProperties` relation added to ClientProfile

**DB lib:** `src/lib/db/website-studio.ts`
- getWebPropertyMatrix, getWebProperty, createWebProperty
- getActiveDnaCapture, createDnaCapture, addDnaTokenOverride
- getActiveBuildJob, getAllBuildJobs, createBuildJob, updateBuildJobStage, updateBuildJobPageCounts
- getComposerPages, getComposerPage, createComposerPages, updatePageSections, updatePageScrvnrStatus, updatePageReviewStatus
- recordScrvnrResult, getScrvnrHistory

**API routes:**
- `GET/POST /api/website-studio/[clientId]` — matrix + build queue, scaffold new property
- `POST /api/website-studio/[clientId]/scrvnr` — run SCRVNR gate (Python subprocess)
- `GET/PATCH /api/website-studio/[clientId]/pages/[pageId]` — sections + review status
- `GET/POST/PATCH /api/website-studio/[clientId]/dna` — DNA captures + token overrides

**Python:** `scrvnr/ws_gate_runner.py` — stdin/stdout subprocess bridge to SCRVNR adapter

**UI components** (`src/components/clients/website-studio/`):
- `WebsiteStudioTab.tsx` — orchestrator, matrix/composer view switcher
- `PropertyMatrix.tsx` — tier-colored grid, gap cells, status dots, progress bars
- `BuildQueue.tsx` — active jobs with stage indicators
- `NewPropertyModal.tsx` — 2-step tier selector → config form
- `PageComposer.tsx` — section editor, debounced autosave, inline SCRVNR feedback, gate badge, override prompt

**Profile integration:** "Website Studio" tab added to client profile between Content Studio and Reports.

---

### Website Studio — Remaining Build Items ⏳

**Priority 1 — Deploy Button**
- UI: Button in PageComposer toolbar (enabled when all pages approved)
- Calls Vercel API via existing Vercel MCP or direct REST
- Updates `deployStatus`, `lastDeployedAt`, `vercelProjectId` on WebProperty
- Shows deploy error if Vercel fails

**Priority 2 — Verify `check_section` on adapter**
- `website_studio_adapter.py` needs a `check_section(property_slug, section_name, text, override, override_note)` method
- SCRVNR API route calls it for live single-section debounce checks
- Confirm signature matches or add the method

**Priority 3 — DNA Lab UI**
- API routes exist (`/api/website-studio/[clientId]/dna`)
- DB functions exist
- Need: URL input → scrape → extract → token review panel → save capture
- Override panel: per-token Accept/Override/Recapture/Lock with required note
- Token confidence badges (high/medium/low)

**Priority 4 — Live Sites Panel**
- Status board: all live WebProperties across all clients
- Staleness alerts (lastDeployedAt > threshold)
- SSL expiry warnings
- Basic traffic data column (Vercel analytics or placeholder)

**Priority 5 — PageComposer data fetch efficiency**
- Currently re-fetches the main studio endpoint to find job+pages
- Should have a dedicated `GET /api/website-studio/[clientId]/jobs/[jobId]` route
- Prevents fragile dependency on buildJobs array population

---

## 🐛 BUG BACKLOG & FEATURE REQUESTS (Added Feb 18, 2026)

### Bugs — Fix Priority

**BUG-001: Account type badge doesn't update in My Profile after role change**
- Changing user from sales → master updates DB but badge in profile tab still shows "Sales Rep"
- Needs: global role refresh (likely re-fetch session or invalidate auth cache after role update)
- Affects: all role-based badging, not just profile tab
- Priority: HIGH

**BUG-002: Login page renders incorrectly in dark mode after logout**
- Login page should always be light mode regardless of system preference
- Fix: Force `light` class on login page layout, clear any dark mode cache on auth logout
- Priority: MEDIUM

**BUG-003: Help button misaligned in left nav panel**
- Slightly off-axis vs other nav items (text + icon baseline misalignment)
- Priority: LOW (polish)

**BUG-004: Sales pipeline status badge colors broken in dark mode**
- Available, Scheduled, Contacted, Follow Up, Paperwork colors are unreadable in dark
- Need dark-mode-specific color overrides in LEAD_STATUS_CONFIG or via Tailwind dark: variants
- Priority: MEDIUM

### Features — Build Priority

**FEAT-001: Admin account tier (above Master/Manager)**
- New role: `admin` — sits above current "master" role
- Current "master" → rename to `manager`
- Hierarchy: admin > manager > sales
- Admin = David only (initially), sees everything, all clients, all financials
- Needs: schema enum update, all role checks updated globally, nav + badge coherence

**FEAT-002: Bug report + feature request visibility for Admin**
- Bug reports and feature request submissions currently go nowhere visible
- Build: Admin-only ticket queue (separate from bug tracking used internally)
- Show: ticket type, submitter, date, description, status
- Allow Admin to update ticket status (open → in progress → resolved → closed)
- Notify submitting user of status change (in-app notification or email)
- Priority: HIGH — currently David can't see user-submitted issues

**FEAT-003: My Tasks widget on dashboard, personalized by account type**
- Widget shows tasks relevant to logged-in user's role
- Sales: their assigned leads + follow-up reminders
- Manager: team task overview + overdue items
- Admin: platform-wide queue + any flagged items
- Should respect existing dashboard layout personalization system



---

## Phase 11: AI Client Layer ✅

**Session:** Feb 2026
**Status:** Complete — TypeScript clean, schema migrated, zero new errors

### Architecture

Extracted and reshaped from GREGORE's orchestration engine. GHM AI layer lives at `src/lib/ai/`.

**Files:**

| File | Origin | Change |
|---|---|---|
| `router/types.ts` | GREGORE types.ts | Extended: GHM domains (seo, copywriting, competitive), GHM intents (website_copy, brief_generation, scrvnr_eval), FeatureContext + CostRecord |
| `router/model-benchmarks.ts` | GREGORE model-benchmarks.ts | Updated model IDs + pricing to current Anthropic API (Feb 2026) |
| `router/complexity-analyzer.ts` | GREGORE complexity-analyzer.ts | GHM domains + intents added to detection; core 4-factor weighted scoring preserved |
| `router/model-router.ts` | GREGORE model-router.ts | Free Energy = Uncertainty × Cost preserved; Tribunal/Parallel strategies removed; returns flat RouterOutput (no Result<T> wrapper) |
| `cost-tracker.ts` | GREGORE metabolism-engine.ts | "Cognitive tokens" abstraction removed; stateless DB writes via Prisma; per-client/per-feature USD analytics |
| `context/system-prompt-builder.ts` | NEW | Feature-specific protocol scaffolding for all 5 AI features |
| `client.ts` | NEW | Unified entry point: routing → prompt assembly → API call → cascade retry → cost logging |
| `index.ts` | NEW | Clean public exports |

**Left behind from GREGORE:** `WorkingSet` (stateful in-memory attention model), `homeostasis/`, `self-model/`, `world/` — GREGORE identity layer, wrong shape for stateless API routes.

### How It Works

Every AI call in the dashboard goes through `callAI()`:
1. Query is classified (complexity + intent + domain via ComplexityAnalyzer)
2. Model router picks optimal model using Free Energy minimization
3. System prompt is assembled for the specific feature + client context
4. Anthropic API is called
5. If `cascade` strategy and response is malformed JSON → auto-escalate to Opus
6. Cost recorded to `AICostLog` table (non-blocking, fire-and-forget)

### Usage Pattern

```typescript
import { callAI } from "@/lib/ai";

const result = await callAI({
  feature: "content_brief",
  prompt: userInstruction,
  context: {
    feature: "content_brief",
    clientId: client.id,
    clientName: client.businessName,
    industry: client.industry,
    taskContext: { title, category, targetKeywords },
  },
});

if (result.ok) {
  const brief = JSON.parse(result.content);
}
```

### Database

New table: `ai_cost_logs` — append-only log of all AI calls.
Fields: feature, clientId, modelId, inputTokens, outputTokens, costUSD, estimatedCostUSD, latencyMs, qualityScore.
Indexed on clientId, feature, timestamp.

### Next Steps for AI Layer

- **Migrate existing content brief API** — replace direct Anthropic call with `callAI()` (10-minute job)
- **Wire Website Studio PageComposer SCRVNR** — already calls `/api/website-studio/[clientId]/scrvnr`; that route needs to use `callAI({ feature: "scrvnr_gate" })`
- **Voice profile injection** — `buildSystemPrompt()` accepts `voiceProfileSlug` but doesn't yet fetch/inject the actual profile tokens; wire to DnaCapture when DNA Lab UI is built
- **Performance history** — `ModelRouter` accepts `ModelPerformance[]` but nothing feeds it yet; once cost logs accumulate, query them and pass in for better routing
- **Admin cost analytics view** — `getCostByClient()` and `getCostByFeature()` are ready; just needs a UI panel
