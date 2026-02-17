# GHM DASHBOARD - MISSING FEATURES & TODO LIST
**Generated:** February 17, 2026  
**Status:** Comprehensive audit of incomplete work

---

## 🔴 **CRITICAL - BLOCKING DEPLOYMENT**

### 1. Client Portal Migration
**Status:** Built but disabled  
**Blocker:** Database schema missing `portalToken` field  
**Files Disabled:**
- `src/app/(portal)/portal/page.tsx.disabled`
- `src/app/api/email/send-portal-invite/route.ts.disabled`
- `src/app/api/clients/[id]/generate-portal-token/route.ts.disabled`

**Action Required:**
```sql
ALTER TABLE client_profiles 
ADD COLUMN portal_token VARCHAR(255) UNIQUE;
```

**Deployment Steps:**
1. Run migration on Vercel Postgres
2. Rename `.disabled` files back to `.ts`/`.tsx`
3. Test portal access flow
4. Commit and deploy

**Priority:** HIGH - Feature complete, just needs migration

---

## 🟡 **BUILT BUT NOT VERIFIED IN PRODUCTION**

### 2. Competitive Scan Engine
**Status:** Code complete, deployment uncertain  
**Built Components:**
- ✅ Data fetcher
- ✅ Delta calculator
- ✅ Alert generator
- ✅ Task creator
- ✅ Health score calculator
- ✅ Scan executor
- ✅ Cron job (`/api/cron/daily-scans`)

**Verification Needed:**
- [ ] Is CRON_SECRET configured in Vercel?
- [ ] Are daily scans running automatically?
- [ ] Does scan history UI show data?
- [ ] Are tasks being auto-created from alerts?
- [ ] Is health score updating correctly?

**Files to Check:**
- `src/lib/competitive-scan/*` (7 files)
- `src/app/api/cron/daily-scans/route.ts`
- `src/components/clients/scan-history.tsx`

**Priority:** MEDIUM - Likely deployed but needs verification

---

### 3. Keyword Tracking Integration
**Status:** Placeholder implementation  
**Current:** Rankings are hardcoded placeholders  
**Needed:** Real keyword ranking data from Ahrefs/SE Ranking

**Gap:**
```typescript
// Current (placeholder):
rankings: [
  { keyword: "auto repair dallas", position: 7, change: 0 }
]

// Needed (real):
rankings: await fetchActualRankings(domain, keywords)
```

**Action Required:**
1. Add keywords to `Lead.competitiveIntel` JSON field
2. Integrate ranking API (Ahrefs or SE Ranking)
3. Update data-fetcher to pull real ranking data
4. Update delta-calculator to track ranking changes

**Priority:** MEDIUM - System works without it, but critical for competitive intel value

---

## 🟠 **PARTIALLY COMPLETE - NEEDS FINISHING**

### 4. Work Order PDF Generation
**Status:** Mentioned in blueprints, not implemented  
**Original Plan:** Competitive intel PDF that sales sends to prospects

**What's Missing:**
- PDF template design (layout, branding, sections)
- PDF generation library integration (react-pdf or puppeteer)
- Work order data aggregation
- Email attachment integration
- Download/preview UI

**Where It Should Live:**
- `src/lib/work-orders/generator.ts`
- `src/lib/work-orders/template.ts`
- `src/app/api/work-orders/generate/route.ts`
- Component in lead detail sheet

**Priority:** LOW - Not needed for current client operations

---

### 5. Lead Enrichment Pipeline
**Status:** API integrations exist, batch processing incomplete  
**Current:**
- ✅ Individual enrichment works (Outscraper, Ahrefs, PageSpeed)
- ✅ Manual trigger per lead
- ❌ Batch enrichment UI missing
- ❌ Auto-enrich on import not implemented

**What's Missing:**
- "Enrich All" button on leads page
- Auto-enrich checkbox on CSV import
- Progress indicator for batch operations
- Cost tracking per enrichment

**Files:**
- `src/app/api/leads/enrich-batch/route.ts` (exists but no UI)

**Priority:** LOW - Manual enrichment works fine

---

## 🟢 **ENHANCEMENT OPPORTUNITIES**

### 6. Voice Profile System
**Status:** Mentioned in blueprints, not started  
**Purpose:** Store client's brand voice for AI-generated content

**What It Would Include:**
- Voice profile editor (tone, style, keywords to use/avoid)
- Storage in `ClientProfile.settings` JSON field
- Integration with AI brief generator
- Template library per client

**Priority:** FUTURE - Nice to have, not essential

---

### 7. Advanced Discovery Features
**Status:** Basic discovery works, advanced features not built

**Current:**
- ✅ Google Maps search
- ✅ Qualification scoring
- ✅ Bulk import

**Missing:**
- ❌ Automated lead sourcing (scheduled searches)
- ❌ Lead scoring ML model
- ❌ Duplicate detection across multiple sources
- ❌ Lead nurture sequences
- ❌ Integration with other lead sources (Yelp, Facebook, Yellow Pages)

**Priority:** FUTURE - Current discovery sufficient

---

### 8. Mobile App
**Status:** Not started, web responsive only

**Gap:**
- Native iOS app
- Native Android app
- Push notifications
- Offline mode
- Camera integration for site visits

**Priority:** FUTURE - Web app is mobile-optimized

---

### 9. Advanced Analytics Enhancements
**Status:** Basic analytics deployed, advanced features not built

**Current:**
- ✅ Revenue forecasting
- ✅ Conversion funnel
- ✅ Lead source breakdown

**Missing:**
- ❌ Cohort analysis
- ❌ Churn prediction
- ❌ Customer journey mapping
- ❌ A/B test tracking
- ❌ Rep performance trends over time
- ❌ Territory performance heatmaps

**Priority:** FUTURE - Current analytics sufficient

---

### 10. White-Label Platform
**Status:** Not started

**What It Would Include:**
- Multi-tenant architecture
- Custom branding per agency
- Agency-level admin panel
- Sub-accounts for each agency
- Usage-based billing

**Priority:** FUTURE - Scale consideration

---

## 🔧 **INFRASTRUCTURE & TECHNICAL DEBT**

### 11. Error Monitoring
**Status:** Not implemented  
**Needed:**
- Sentry integration
- Error tracking
- Performance monitoring
- Uptime monitoring
- Alert notifications

**Priority:** MEDIUM - Important for production stability

---

### 12. Logging & Auditing
**Status:** Basic console.log only  
**Needed:**
- Structured logging (Winston/Pino)
- User action audit trail
- Data change history
- API request logging
- Cost tracking per API call

**Priority:** MEDIUM - Important for debugging

---

### 13. Backup & Recovery
**Status:** Vercel handles backups, no restore process defined  
**Needed:**
- Automated database backups
- Point-in-time recovery testing
- Disaster recovery plan
- Data export tools
- Migration runbooks

**Priority:** MEDIUM - Important for safety

---

### 14. Performance Optimization
**Status:** No optimization yet  
**Opportunities:**
- Database query optimization
- Response caching (Redis)
- Image optimization
- Bundle size reduction
- API rate limiting
- Connection pooling

**Priority:** LOW - Performance acceptable currently

---

### 15. Security Hardening
**Status:** Basic auth only  
**Enhancements:**
- 2FA for master accounts
- IP whitelisting
- Rate limiting per user
- CSRF protection enhancement
- Security headers audit
- Penetration testing

**Priority:** MEDIUM - Important before scale

---

### 16. Testing Infrastructure
**Status:** No automated tests  
**Needed:**
- Unit tests (Jest)
- Integration tests (Playwright)
- E2E tests (Cypress/Playwright)
- API contract tests
- Load testing (k6/Artillery)
- CI/CD pipeline with test gates
- End-to-end automated testing suite
- User acceptance testing framework
- Performance profiling and optimization
- Analytics tracking integration

**Priority:** MEDIUM - Important for scale and reliability

---

### 17. Production Deployment Configuration
**Status:** Vercel deployment active but not fully configured  
**Needed:**
- Production deployment configuration checklist
- Environment variable verification
- Build optimization settings
- Cache configuration
- CDN setup and optimization
- Database connection pooling
- API rate limiting configuration
- Health check endpoints
- Deployment rollback procedures

**Priority:** HIGH - Required for stable production

---

### 18. Advanced Reporting
**Status:** Basic reports implemented  
**Enhancements:**
- Custom report builder
- Scheduled report delivery
- Report templates library
- Interactive dashboards
- Export to Google Sheets
- PowerBI/Tableau integration

**Priority:** FUTURE - Current reports sufficient

---

### 18. Data Import/Export
**Status:** CSV import works, export missing  
**Missing:**
- Lead export to CSV/XLSX
- Client data export
- Bulk data operations
- Data migration tools
- API for external integrations

**Priority:** LOW - Not requested yet

---

## 🎨 **UX IMPROVEMENTS**

### 19. Onboarding Flow
**Status:** No guided onboarding  
**Needed:**
- Welcome wizard for new users
- Product tours
- Tutorial videos
- Sample data setup
- Getting started checklist

**Priority:** FUTURE - Power users don't need it

---

### 20. Keyboard Shortcuts
**Status:** None implemented  
**Opportunities:**
- Quick actions (Cmd+K command palette)
- Navigation shortcuts
- Bulk operations
- Search hotkeys

**Priority:** FUTURE - Nice to have

---

### 21. Accessibility (a11y)
**Status:** Basic accessibility only  
**Improvements:**
- WCAG 2.1 AA compliance
- Screen reader optimization
- Keyboard navigation
- High contrast mode
- Focus indicators

**Priority:** FUTURE - Not required yet

---

## 🔌 **INTEGRATIONS**

### 22. Calendar Integration
**Status:** Not implemented  
**Use Cases:**
- Sync tasks to Google Calendar
- Meeting scheduling
- Deadline reminders
- Client appointment booking

**Priority:** FUTURE - Not requested

---

### 23. Slack Integration
**Status:** Not implemented  
**Use Cases:**
- Task notifications
- Report delivery
- Alert notifications
- Team collaboration

**Priority:** FUTURE - Email works fine

---

### 24. Zapier/Make Integration
**Status:** Not implemented  
**Use Cases:**
- Connect to 1000+ apps
- Automated workflows
- Custom integrations
- No-code automation

**Priority:** FUTURE - Current integrations sufficient

---

## 📋 **CONFIGURATION & SETUP**

### 25. Environment Configuration
**Status:** Partial - some API keys missing

**Required Setup:**
- [ ] Resend API key + domain verification
- [ ] Anthropic API key for AI briefs
- [ ] Verify CRON_SECRET is configured
- [ ] Verify all Outscraper/Ahrefs keys active
- [ ] Set up error notification emails

**Priority:** HIGH - Needed for full functionality

---

### 26. Product Catalog Population
**Status:** Empty catalog  
**Action:** Load actual GHM products with pricing

**Priority:** HIGH - Needed for upsell detection

---

### 27. Territory Setup
**Status:** Database supports territories, none configured  
**Action:** Define and assign territories to reps

**Priority:** MEDIUM - Needed for rep filtering

---

## 🧪 **TESTING & VALIDATION**

### 28. Production Testing Checklist
**Status:** Not completed

**Tests Needed:**
- [ ] All 8 deployed features work end-to-end
- [ ] Client Portal access (after migration)
- [ ] Email delivery (after Resend setup)
- [ ] AI brief generation (after Anthropic key)
- [ ] Cron jobs running
- [ ] Discovery search & import
- [ ] Report generation & download
- [ ] Upsell detection & presentation
- [ ] Analytics charts rendering
- [ ] Mobile responsiveness

**Priority:** HIGH - Validate before client use

---

## 📈 **SUMMARY**

### By Priority:

**🔴 CRITICAL (3):**
1. Client Portal migration
2. Environment configuration
3. Production testing

**🟡 HIGH (2):**
4. Product catalog population
5. Competitive scan verification

**🟠 MEDIUM (6):**
6. Keyword tracking integration
7. Territory setup
8. Error monitoring
9. Logging & auditing
10. Backup & recovery
11. Security hardening

**🟢 LOW/FUTURE (19):**
12-30. Enhancements, integrations, advanced features

---

## 🎯 **RECOMMENDED ACTION PLAN**

### **Week 1 (Critical):**
1. Run portal migration
2. Configure all API keys
3. Test all 9 features end-to-end
4. Load product catalog
5. Verify cron jobs running

### **Week 2 (High Priority):**
6. Configure territories
7. Test competitive scan flow
8. Implement keyword tracking
9. Add error monitoring (Sentry)
10. Document backup process

### **Month 1+ (Enhancements):**
- Work order PDFs
- Advanced analytics
- Voice profiles
- Mobile app planning
- White-label architecture

---

**Total Missing/Incomplete Items:** 30  
**Critical:** 3  
**High:** 2  
**Medium:** 6  
**Low/Future:** 19  

**Estimated Work:**
- Critical items: 1-2 days
- High priority: 3-5 days
- Medium priority: 1-2 weeks
- Future enhancements: Months
