# GHM DASHBOARD - QUICK REFERENCE
**Last Updated:** February 17, 2026

---

## ✅ WHAT'S DONE

- ✅ Client detail page crash fixed (commit c300dd2)
- ✅ Edit Client Details API endpoint built
- ✅ Edit Client Details UI component built
- ✅ Commission System fully specified (637 lines)
- ✅ Website Pipeline architecture decided
- ✅ SENTRY approach selected (Option B - simple)

---

## 🔄 WHAT'S IN PROGRESS

**Edit Client Details (95% complete)**
- Needs 3 lines added to `src/components/clients/profile.tsx`:
  1. Import: `import { EditClientDialog } from "./edit-client-dialog";`
  2. Handler: `const [refreshKey, setRefreshKey] = useState(0);`
  3. Button: `<EditClientDialog client={client} onUpdate={() => setRefreshKey(p => p + 1)} />`

---

## 🚀 WHAT'S NEXT

### Immediate (Today/Tomorrow)
1. Finish Edit Client Details (3 lines)
2. Test and deploy
3. Start Commission System Phase 1 (database)

### This Week
- Commission Phase 1: Database + payment calculations
- Lead Enrichment enhancements

### Weeks 2-4
- Commission Phases 2-4 (UI, dashboards, reporting)

### Weeks 5-10
- Website Build Automation Pipeline

### Week 11+
- SENTRY simple intelligence system
- Final polish

---

## 🎯 KEY DECISIONS

**Website Automation:**
- Satellite sites → Vercel + custom domains
- Main extensions → Subdomains (blog.clientdomain.com)
- Avoids WordPress credential nightmare
- 4 hours with automation vs 3-4 months manual

**SENTRY Intelligence:**
- Option B: Simple GHM-specific system (~250 lines)
- NOT porting Gregore SENTRY (~800 lines, overkill)
- Just: Ahrefs keywords + web scraping + RSS + task queue

**Commission Structure:**
- Sales Rep: $1,000 commission (month 1, after payment)
- Sales Rep: $200/mo residual (month 2+)
- Master (David): $240/mo (month 1+)
- Master (Gavin): $0 (owner profit)

---

## 📋 FULL DETAILS

See `BUILD_PLAN.md` for complete specification (470 lines)

---

## 🔗 KEY FILES

**Specifications:**
- `BUILD_PLAN.md` - Master plan (this session)
- `COMMISSION_SYSTEM_SPEC.md` - Commission details
- `EDIT_AND_TASKS_SPEC.md` - Edit features
- `FEATURE_ROADMAP.md` - Priorities
- `CLIENT_DETAIL_FIX.md` - Debug notes
- `API_KEYS_SETUP.md` - API configuration

**Implementation:**
- `src/app/api/clients/[id]/route.ts` - Edit API endpoint
- `src/components/clients/edit-client-dialog.tsx` - Edit UI

---

## 🎓 REMEMBER

1. **Reduce friction:** Automate what can be automated
2. **No assumptions:** System validates, humans approve
3. **Simple beats complex:** GHM doesn't need Gregore-level sophistication
4. **Subdomain approach:** Avoids client credential requests
5. **Phased rollouts:** Commission in 4 phases = manageable

---

**Next Session:** Finish Edit Client Details → Deploy → Start Commission Phase 1
