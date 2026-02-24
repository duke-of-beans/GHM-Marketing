# INLINE HANDOFF - Copy/Paste This Into New Claude Session

```
CONTEXT: GHM Dashboard - SEO Services Platform (Feb 17, 2026)
PROJECT: D:\Work\SEO-Services\ghm-dashboard
GIT: Commit 69a470c (pushed to main)
STATUS: Edit Client Details 95% complete, Commission System ready to build

═══════════════════════════════════════════════════════════════════════

🎯 IMMEDIATE ACTION (15 MINUTES):

FINISH EDIT CLIENT DETAILS - Add exactly 3 lines to:
D:\Work\SEO-Services\ghm-dashboard\src\components\clients\profile.tsx

Line ~28 (imports):
import { EditClientDialog } from "./edit-client-dialog";

Line ~210 (state):
const [refreshKey, setRefreshKey] = useState(0);
const handleUpdate = () => setRefreshKey(prev => prev + 1);

Line ~268 (header, after Badge):
<EditClientDialog client={client} onUpdate={handleUpdate} />

TEST: npm run dev → navigate to client detail → verify Edit button works
COMMIT: git add -A && git commit -m "Complete: Edit Client Details"
PUSH: git push origin main
DONE: Edit feature complete! Move to Commission System Phase 1.

═══════════════════════════════════════════════════════════════════════

📊 WHAT'S DONE:
✅ Client crash fixed (c300dd2)
✅ Edit API endpoint built (src/app/api/clients/[id]/route.ts)
✅ Edit UI component built (src/components/clients/edit-client-dialog.tsx)
✅ All specs written (2,448 lines across 5 docs)
✅ All architectural decisions made
✅ Git committed and pushed

📋 WHAT'S NEXT (Priority Order):
1. Finish Edit (3 lines above) ← YOU ARE HERE
2. Commission System Phase 1: Database + payment calculations
3. Lead Enrichment: Batch enrich, cost tracking
4. Commission Phases 2-4: UI, dashboards, reporting
5. Website Pipeline: Auto-generate sites in 4 hours vs 3-4 months
6. SENTRY Simple: Keyword monitoring (~250 lines, NOT Gregore port)

═══════════════════════════════════════════════════════════════════════

🔑 CRITICAL DECISIONS (Already Made):

COMMISSION STRUCTURE:
- Sales Rep (Arian Germani): $1,000 commission (month 1) + $200/mo residual (month 2+)
- Master (David): $240/mo (month 1+)
- Master (Gavin): $0 (owner, no self-payment)
- 4-phase rollout over 4 weeks

WEBSITE AUTOMATION:
- Satellites: Vercel + custom domains (NOT static HTML)
- Extensions: Subdomains (blog.clientdomain.com) (NOT WordPress)
- WHY: Avoids "What's your WordPress login?" nightmare
- RESULT: 4 hours with automation vs 3-4 months manual

SENTRY INTELLIGENCE:
- Build SIMPLE GHM system (~250 lines)
- NOT port Gregore SENTRY (~800 lines = overkill)
- Features: Ahrefs keywords + scraper + RSS + task queue
- Feeds topics to SCRVNR for content generation

SCRVNR INTEGRATION:
- Exists at D:\SCRVNR (v1.0.0, production ready)
- Need 6th environment: CLIENT (for client-specific voice)
- Voice profiling per client (scrape main site)
- Topic → SCRVNR → Content → Human approval → Deploy

═══════════════════════════════════════════════════════════════════════

📁 READ THESE FILES FOR FULL CONTEXT:

QUICK START:
1. QUICK_REFERENCE.md (104 lines) - 2 min read
2. HANDOFF_PROMPT.md (521 lines) - 5 min read
3. BUILD_PLAN.md (470 lines) - 10 min read

DETAILED SPECS:
4. COMMISSION_SYSTEM_SPEC.md (637 lines) - When building commission
5. EDIT_AND_TASKS_SPEC.md (598 lines) - When building edit/tasks
6. FEATURE_ROADMAP.md (339 lines) - Priority analysis

All files in: D:\Work\SEO-Services\ghm-dashboard\

═══════════════════════════════════════════════════════════════════════

🔧 TECHNICAL QUICK REFERENCE:

DATABASE:
- PostgreSQL (Neon)
- Prisma ORM
- Migration: npx prisma migrate dev --name description

ENV VARS (add to Vercel manually):
- DATABASE_URL, DIRECT_URL (Neon)
- NEXTAUTH_SECRET, NEXTAUTH_URL
- OUTSCRAPER_API_KEY, ANTHROPIC_API_KEY
(Full keys in API_KEYS_SETUP.md - redacted from GitHub)

DEV WORKFLOW:
- npm run dev (local)
- git add -A && git commit -m "msg" && git push
- Auto-deploys to Vercel

═══════════════════════════════════════════════════════════════════════

⚠️ KNOWN ISSUES:
- upsellOpportunities table disabled (c300dd2) - not blocking
- Need to add API keys to Vercel for production features
- Edit feature just needs 3 lines (above)

═══════════════════════════════════════════════════════════════════════

🎯 YOUR FIRST TASK:

Add those 3 lines to profile.tsx, test, commit, push, deploy.
Then read COMMISSION_SYSTEM_SPEC.md and start Phase 1.

Everything is spec'd out. All decisions made. Just execute.

Good luck! 🚀
```

═══════════════════════════════════════════════════════════════════════

**USAGE INSTRUCTIONS:**

1. Copy everything between the triple backticks above
2. Paste into a new Claude conversation
3. New Claude instance will have all critical context
4. Can immediately start finishing Edit feature

**This inline prompt provides:**
- Immediate next action (3 lines to add)
- What's done vs what's next
- Critical architectural decisions
- File locations and reading order
- Technical quick reference
- Known issues

**Total reading time:** ~2 minutes to get oriented, then dive in

═══════════════════════════════════════════════════════════════════════
