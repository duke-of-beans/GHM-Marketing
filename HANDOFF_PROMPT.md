# HANDOFF PROMPT - GHM DASHBOARD CONTINUATION
**Session Date:** February 17, 2026  
**Git Commit:** 69a470c  
**Project:** GHM Dashboard - SEO Services Platform  
**Status:** Edit Feature 95% Complete, Commission System Ready to Build

---

## 🎯 IMMEDIATE NEXT ACTION (15 Minutes)

**FINISH EDIT CLIENT DETAILS FEATURE**

You need to add **exactly 3 lines** to integrate the Edit button:

**File:** `D:\Work\SEO-Services\ghm-dashboard\src\components\clients\profile.tsx`

**Line ~28 (in imports section):**
```typescript
import { EditClientDialog } from "./edit-client-dialog";
```

**Line ~210 (after other state declarations in ClientProfile component):**
```typescript
const [refreshKey, setRefreshKey] = useState(0);
const handleUpdate = () => setRefreshKey(prev => prev + 1);
```

**Line ~268 (in the header div, after the Badge component):**
```typescript
<EditClientDialog 
  client={client} 
  onUpdate={handleUpdate}
/>
```

**Then:**
1. Test locally: `npm run dev`
2. Navigate to client detail page (German Auto Doctor)
3. Click Edit button, verify form works
4. Make a change, save, verify it persists
5. Check system notes for audit trail
6. Commit: `git add -A && git commit -m "Complete: Edit Client Details Feature"`
7. Push: `git push origin main`
8. Deploy to Vercel (auto-deploy or manual trigger)

**That's it for Edit feature! Then move to Commission System Phase 1.**

---

## 📊 CURRENT STATE

### What's Completed ✅
- Client detail page crash fixed (disabled upsellOpportunities temporarily)
- Edit Client Details API endpoint (`/api/clients/[id]` PATCH)
- Edit Client Details UI component (`edit-client-dialog.tsx`)
- Comprehensive specifications written (2,448 lines)
- All architectural decisions documented
- Git committed and pushed

### What's 95% Done 🔄
- **Edit Client Details** - Just needs 3 lines of integration (above)

### What's Ready to Build 📋
1. **Commission System** - Full spec in `COMMISSION_SYSTEM_SPEC.md`
2. **Lead Enrichment** - Spec in `EDIT_AND_TASKS_SPEC.md`
3. **Website Pipeline** - Architecture decided, ready to spec fully
4. **SENTRY Simple** - Option B confirmed, ready to build

---

## 🗂️ CRITICAL CONTEXT

### Commission System (Start After Edit Feature)

**Payment Structure:**
- **Sales Rep:** $1,000 commission (month 1, after signing + payment received)
- **Sales Rep:** $200/mo residual (starting month 2, ongoing)
- **Master Manager (David):** $240/mo (starting month 1, ongoing)
- **Master Manager (Gavin):** $0 (owner, doesn't pay himself)
- **Current Sales Rep:** Arian Germani (already in system)

**Database Schema Additions:**
```prisma
// Add these tables to schema.prisma:

model UserCompensationConfig {
  id                 Int      @id @default(autoincrement())
  userId             Int      @unique
  commissionEnabled  Boolean  @default(true)
  commissionAmount   Decimal  @default(1000) @db.Decimal(10, 2)
  residualEnabled    Boolean  @default(true)
  residualAmount     Decimal  @default(200) @db.Decimal(10, 2)
  residualStartMonth Int      @default(2)
  masterFeeEnabled   Boolean  @default(false)
  masterFeeAmount    Decimal  @default(240) @db.Decimal(10, 2)
  // ... see COMMISSION_SYSTEM_SPEC.md for complete schema
}

model ClientCompensationOverride {
  // Per-client overrides
}

model PaymentTransaction {
  // Track all payments
}

// Add to ClientProfile:
  salesRepId      Int?
  masterManagerId Int?
  onboardedMonth  DateTime @db.Date
```

**Implementation Phases:**
1. **Phase 1 (Week 1):** Database + payment calculation functions
2. **Phase 2 (Week 2):** Admin configuration UI
3. **Phase 3 (Week 3):** Dashboard widgets
4. **Phase 4 (Week 4):** Reporting & notifications

**Read:** `COMMISSION_SYSTEM_SPEC.md` (637 lines) for complete details

---

### Website Build Pipeline

**Critical Decisions Made:**

**Satellite Sites:**
- Deploy to **Vercel** with custom domains (e.g., `audi-repair-simivalley.com`)
- NOT static HTML to GoDaddy FTP
- GHM owns satellites

**Main Site Extensions:**
- Deploy to **subdomain** (e.g., `blog.germanautodoctor.com`)
- NOT WordPress plugins or pages
- Avoids credential requests from clients
- GHM owns extensions

**Why Subdomains:**
- No "What's your WordPress login?" nightmare
- No waiting weeks for credentials
- No touching client's fragile WordPress setup
- Full control, modern stack, easy deployment

**Workflow:**
1. Sales rep marks client needs website (product selected)
2. Rep clicks "Start Build" in dashboard
3. System asks template-driven questions (auto-pull data from client record)
4. System scans client's main site for style/architecture
5. System auto-generates: GitHub repo, Vercel project, style guide, tasks
6. System flags custom requirements
7. David handles custom development (4 hours vs 20 hours manual)

**Integration Points:**
- **SENTRY** scouts keywords/topics
- **SCRVNR** writes content in client voice
- Rep initiates, system generates, David customizes

---

### SENTRY Intelligence (Simple System)

**CRITICAL: Build Option B - Simple GHM-Specific System**

**NOT porting Gregore SENTRY** because:
- Gregore = 800+ lines, complex pattern detection, learning loops, narrative construction
- GHM needs = 250 lines, simple task automation
- Gregore = research intelligence (unknown unknowns)
- GHM = known objectives (keyword monitoring, competitor tracking)

**What GHM SENTRY Does:**
1. **Competitor Keywords** (Ahrefs API)
   - Find keywords: volume > 100, difficulty < 30
   - Client doesn't rank for them yet
   - Queue top 20 for SCRVNR to write about

2. **Website Change Detection** (basic scraping)
   - Check if competitor added pages
   - Alert when changes detected

3. **Industry News** (basic RSS)
   - Auto repair industry feeds
   - SEO blog feeds
   - Display in dashboard

4. **Content Topic Queue** (for SCRVNR)
   - Send topics to SCRVNR
   - Create tasks for content writing

**Total Complexity:** ~250 lines  
**Dependencies:** Ahrefs SDK, web scraper, RSS parser  
**UI:** Simple table/list (no graphs or timelines)

---

### SCRVNR Integration

**Location:** `D:\SCRVNR`  
**Status:** v1.0.0, production ready, fully operational

**What SCRVNR Is:**
- Voice synthesis system that captures David's authentic voice
- 5 environments: DEV, RESEARCH, CAREER, WORK, PERSONAL
- SQLite voice pattern database
- Auto-learning from every output
- 7 automated quality checks

**GHM Integration Needed:**
1. Create 6th environment: "CLIENT" for client-specific content
2. Voice profiling per client (scrape main site for voice/tone)
3. Topic-to-content workflow (SENTRY → SCRVNR → Content)
4. Quality validation before publish
5. Deploy button (human approval required)

**Components:**
```
D:\SCRVNR\
├── core/protocols/          # 8 protocol files
├── environments/            # 5 calibrations (need +1 for CLIENT)
├── learning/voice.db        # Pattern database
├── tools/orchestrator.py    # Python automation
└── README.md                # Complete documentation
```

---

## 📁 FILE LOCATIONS

### GHM Dashboard
**Root:** `D:\Work\SEO-Services\ghm-dashboard`

**Key Documentation:**
- `BUILD_PLAN.md` (470 lines) - Master plan, all decisions
- `QUICK_REFERENCE.md` (104 lines) - Quick status summary
- `COMMISSION_SYSTEM_SPEC.md` (637 lines) - Commission full spec
- `EDIT_AND_TASKS_SPEC.md` (598 lines) - Edit + tasks specs
- `FEATURE_ROADMAP.md` (339 lines) - Priorities and ROI
- `CLIENT_DETAIL_FIX.md` (291 lines) - Debug session notes
- `API_KEYS_SETUP.md` (262 lines) - API key configuration

**Key Code:**
- `src/app/api/clients/[id]/route.ts` - Edit API endpoint ✅
- `src/components/clients/edit-client-dialog.tsx` - Edit UI ✅
- `src/components/clients/profile.tsx` - Needs 3 lines added ⏳
- `prisma/schema.prisma` - Database schema (will add commission tables)

### SCRVNR
**Root:** `D:\SCRVNR`

**Key Files:**
- `README.md` - Complete documentation
- `SCRVNR_INSTRUCTIONS.md` - Entry point
- `core/protocols/MASTER_PROTOCOL.md` - Workflow guide
- `environments/*.yaml` - 5 environment calibrations
- `learning/voice.db` - Voice pattern database
- `tools/orchestrator.py` - CLI automation

### Gregore (Reference Only)
**Root:** `D:\Projects\Gregore`

**SENTRY Location (DO NOT PORT):**
- `app/src/lib/sentry/` - Gregore SENTRY (~800 lines)
- **Use for reference only** - Build simple GHM version instead

---

## 🔧 TECHNICAL SETUP

### Environment Variables (Vercel)
```env
DATABASE_URL="postgresql://..."          # Neon PostgreSQL
DIRECT_URL="postgresql://..."            # Neon direct connection
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://ghm-dashboard.vercel.app"
OUTSCRAPER_API_KEY="[REDACTED]"
ANTHROPIC_API_KEY="[REDACTED]"
```

**Note:** API keys are in `API_KEYS_SETUP.md` (redacted for GitHub)

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Generate Prisma Client
npx prisma generate

# Deploy to production
npx prisma migrate deploy
```

### Local Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build

# Start production
npm start
```

### Git Workflow
```bash
# Stage changes
git add -A

# Commit
git commit -m "Descriptive message"

# Push
git push origin main

# Auto-deploys to Vercel
```

---

## 🎯 BUILD SEQUENCE (Priority Order)

### 1. Edit Client Details (NOW - 15 min)
- Add 3 lines to `profile.tsx`
- Test, commit, push, deploy
- **Deliverable:** Can edit all client info from detail page

### 2. Commission System Phase 1 (Week 1)
- Add database tables to `schema.prisma`
- Run migration: `npx prisma migrate dev --name add_commission_tables`
- Create payment calculation functions in `src/lib/payments/`
- Build API endpoints for compensation config
- Test payment calculations with German Auto Doctor (Gavin scenario)
- **Deliverable:** Backend ready, calculations working

### 3. Commission System Phase 2 (Week 2)
- Team page: compensation config per user
- Client detail: sales rep + master assignment
- Client detail: compensation overrides
- Test with Arian Germani (sales rep)
- **Deliverable:** Admins can configure everything

### 4. Lead Enrichment (Week 2)
- Single lead enrich button (client detail)
- Batch enrich with multi-select (lead list)
- Duplicate detection (don't pay twice)
- Cost tracking
- **Deliverable:** Efficient enrichment without waste

### 5. Commission System Phase 3 (Week 3)
- Sales rep earnings dashboard widget
- Master manager earnings widget
- Owner profit dashboard (Gavin's view)
- **Deliverable:** Everyone sees their financials

### 6. Commission System Phase 4 (Week 4)
- Payment history page
- CSV/PDF exports
- Email notifications
- Rep performance analytics
- **Deliverable:** Complete financial system

### 7. Website Pipeline Phase 1 (Weeks 5-6)
- Intelligence gathering (scrape client site)
- Style guide generation
- Template architecture
- Source of Truth documentation
- **Deliverable:** Foundation for automation

### 8. Website Pipeline Phase 2 (Weeks 7-8)
- Repo automation (GitHub)
- Deployment automation (Vercel)
- Domain management
- **Deliverable:** Auto-generate sites

### 9. Website Pipeline Phase 3 (Weeks 9-10)
- SCRVNR integration (content generation)
- SENTRY integration (topic scouting)
- Rep-facing UI (build initiation)
- **Deliverable:** End-to-end automation

### 10. SENTRY + Polish (Week 11+)
- Build simple SENTRY system (~250 lines)
- Ahrefs keyword monitoring
- Competitor change detection
- Task management enhancements
- **Deliverable:** Complete platform

---

## 🚨 CRITICAL PRINCIPLES

### 1. Reduce Human Friction
- Automate everything possible
- Don't ask clients for WordPress credentials
- Don't request style guides they don't have
- Scrape what you need from their site
- Deploy to subdomains to avoid complexity

### 2. No Assumptions or Interpretations
- System validates, humans approve
- Clear yes/no decisions, no ambiguity
- Sales reps don't need technical knowledge
- System generates, David customizes

### 3. Option B Perfection
- 10x improvement, not 10%
- Don't over-engineer (SENTRY example)
- Build exactly what's needed, nothing more

### 4. Automation > Manual
- If done 3x manually → automate it
- Website builds: 4 hours vs 3-4 months
- Content: SCRVNR vs manual writing
- Keywords: SENTRY vs manual Ahrefs

---

## ⚠️ KNOWN ISSUES & NOTES

### Database
- **upsellOpportunities table** doesn't exist in production yet
- Temporarily disabled in `getClient()` query (commit c300dd2)
- Need to run full migration later to enable all features
- This is NOT blocking - client detail page works fine without it

### API Keys
- Outscraper and Anthropic keys configured in local `.env.local`
- **Must add to Vercel** manually for production features
- See `API_KEYS_SETUP.md` for details

### Deployment
- Auto-deploys to Vercel on git push
- Takes ~2 minutes
- Check build logs if issues

---

## 📖 READING ORDER FOR CONTEXT

1. **QUICK_REFERENCE.md** (2 min) - Current status
2. **This file** (5 min) - Handoff details
3. **BUILD_PLAN.md** (10 min) - Complete master plan
4. **COMMISSION_SYSTEM_SPEC.md** (20 min) - When starting commission work
5. **EDIT_AND_TASKS_SPEC.md** (15 min) - When building edit/tasks
6. Other files as needed

---

## 🎯 SUCCESS CRITERIA

**Edit Feature Complete When:**
- ✅ 3 lines added to `profile.tsx`
- ✅ Edit button visible on client detail page
- ✅ Form opens, validates, saves successfully
- ✅ Changes persist in database
- ✅ System note created for audit trail
- ✅ Committed and pushed to GitHub
- ✅ Deployed to Vercel

**Commission Phase 1 Complete When:**
- ✅ Database tables created and migrated
- ✅ Payment calculation functions work correctly
- ✅ Can calculate commission for Arian Germani
- ✅ Can calculate residuals for ongoing clients
- ✅ Can calculate master fees for David
- ✅ Gavin scenario works (owner, no payments)

---

## 💬 CONTEXT FOR CLAUDE

**David's Background:**
- Operations executive, entrepreneur
- VP of Operations at Good Day Farm (cannabis)
- Advanced coder, AI-native development
- Runs multiple businesses: THICCLES, Clutch Plug, GHM Dashboard
- Philosophy: "Option B perfection" - build it right, 10x improvement

**GHM Dashboard Purpose:**
- SEO services platform for small businesses
- Currently focused on auto repair shops
- Sales team: Arian Germani (sales rep)
- Masters: David, Gavin
- Will scale to multiple industries

**Development Approach:**
- Foundation first (backend before UI)
- Zero technical debt tolerance
- Phased rollouts (commission in 4 phases)
- Simple beats complex (SENTRY Option B)
- Automate repetitive work

---

## 🚀 YOU'RE READY!

**Next Command:**
```typescript
// Open the file and add 3 lines:
// D:\Work\SEO-Services\ghm-dashboard\src\components\clients\profile.tsx

// Line ~28:
import { EditClientDialog } from "./edit-client-dialog";

// Line ~210:
const [refreshKey, setRefreshKey] = useState(0);
const handleUpdate = () => setRefreshKey(prev => prev + 1);

// Line ~268:
<EditClientDialog client={client} onUpdate={handleUpdate} />

// Then test, commit, push, deploy
```

**All specs are complete. All decisions are made. No blockers. Just execute.**

Good luck! 🎯
