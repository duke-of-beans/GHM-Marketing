# GHM DASHBOARD - MASTER BUILD PLAN
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
