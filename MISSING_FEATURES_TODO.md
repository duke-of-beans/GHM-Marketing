# GHM DASHBOARD - MISSING FEATURES & TODO LIST
**Generated:** February 17, 2026  
**Status:** Comprehensive audit of incomplete work

---

## 🔴 **CRITICAL - ARCHITECTURAL FOUNDATION**

### 0. Granular Permission System
**Status:** Designed, not implemented  
**Priority:** CRITICAL - Needed for team scaling and role flexibility  
**Use Case:** Allow sales reps (e.g., Arian) to access advanced features like client management and content studio WITHOUT full master promotion

**Current Problem:**
- Hard-coded roles: `sales`, `master`, `owner`
- All-or-nothing permissions
- Can't give partial access (e.g., Arian manages clients post-sale but not compensation)

**Proposed Solution: Feature-Flag Permission System**

#### Database Schema Addition:
```prisma
model User {
  // ... existing fields
  
  // New permissions field (JSON) - stores feature flags
  permissions Json @default("{}")
  
  // Permission preset for easy management
  permissionPreset String @default("sales_basic") 
  // Options: sales_basic, sales_advanced, master_lite, master_full, custom
}
```

#### Permission Interface (TypeScript):
```typescript
interface UserPermissions {
  // Client Management
  canViewAllClients: boolean;      // See all clients (not just own deals)
  canEditClients: boolean;          // Edit client profiles
  canManageTasks: boolean;          // Create/assign tasks for clients
  canAccessContentStudio: boolean;  // Generate content for clients
  
  // Sales & Discovery
  canAccessDiscovery: boolean;      // Use lead discovery tools
  canClaimAnyLead: boolean;         // Claim leads outside assigned territory
  canReassignLeads: boolean;        // Move leads between reps
  
  // Intelligence & Scanning
  canViewCompetitiveScans: boolean; // See competitive intel data
  canTriggerScans: boolean;         // Manually trigger competitive scans
  canAccessVoiceCapture: boolean;   // Use SCRVNR voice capture system
  
  // Analytics & Reporting
  canViewTeamAnalytics: boolean;    // See company-wide metrics
  canViewOthersEarnings: boolean;   // See other reps' commissions
  canGenerateReports: boolean;      // Create client reports
  
  // System Features (Global - Not Togglable)
  canReportBugs: boolean;           // Bug reporting (controlled by global settings)
  canAccessOwnDashboard: boolean;   // Personal metrics (always true for all users)
  
  // Master-Only Features (NEVER Togglable - Hard-Coded)
  // These remain restricted to role="master" or role="owner":
  // - Settings panel access
  // - Compensation management
  // - User permission management
  // - API key configuration
  // - Global system configuration
}
```

#### Permission Presets (Quick Templates):

**1. Sales Basic** (Default for new reps)
```json
{
  "canViewAllClients": false,
  "canEditClients": false,
  "canManageTasks": false,
  "canAccessContentStudio": false,
  "canAccessDiscovery": true,
  "canClaimAnyLead": false,
  "canReassignLeads": false,
  "canViewCompetitiveScans": false,
  "canTriggerScans": false,
  "canAccessVoiceCapture": false,
  "canViewTeamAnalytics": false,
  "canViewOthersEarnings": false,
  "canGenerateReports": false,
  "canReportBugs": true,
  "canAccessOwnDashboard": true
}
```

**2. Sales Advanced** (High performers)
```json
{
  "canViewAllClients": false,
  "canEditClients": false,
  "canManageTasks": false,
  "canAccessContentStudio": true,  // Can create content for OWN clients
  "canAccessDiscovery": true,
  "canClaimAnyLead": false,
  "canReassignLeads": false,
  "canViewCompetitiveScans": true,  // View only
  "canTriggerScans": false,
  "canAccessVoiceCapture": true,
  "canViewTeamAnalytics": false,
  "canViewOthersEarnings": false,
  "canGenerateReports": true,
  "canReportBugs": true,
  "canAccessOwnDashboard": true
}
```

**3. Master Lite** (Post-sale manager - Arian's use case)
```json
{
  "canViewAllClients": true,        // See all clients
  "canEditClients": true,            // Edit all client profiles
  "canManageTasks": true,            // Manage tasks for all clients
  "canAccessContentStudio": true,    // Create content for ALL clients
  "canAccessDiscovery": true,
  "canClaimAnyLead": false,
  "canReassignLeads": false,
  "canViewCompetitiveScans": true,
  "canTriggerScans": false,          // View only, can't trigger
  "canAccessVoiceCapture": true,
  "canViewTeamAnalytics": false,     // No team analytics
  "canViewOthersEarnings": false,    // No earnings visibility
  "canGenerateReports": true,
  "canReportBugs": true,
  "canAccessOwnDashboard": true
}
```

**4. Master Full** (Full manager)
```json
{
  "canViewAllClients": true,
  "canEditClients": true,
  "canManageTasks": true,
  "canAccessContentStudio": true,
  "canAccessDiscovery": true,
  "canClaimAnyLead": true,
  "canReassignLeads": true,
  "canViewCompetitiveScans": true,
  "canTriggerScans": true,
  "canAccessVoiceCapture": true,
  "canViewTeamAnalytics": true,
  "canViewOthersEarnings": true,
  "canGenerateReports": true,
  "canReportBugs": true,
  "canAccessOwnDashboard": true
}
```

**5. Custom** - Manually toggle each permission individually

#### UI Design - User Management Page:

**Location:** `/settings` → "Team Members" tab (master-only)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Team Members                              [+ Add User] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📊 Arian Thompson (sales)                          │
│ └─ Email: arian@ghm.com                            │
│ └─ Territory: Dallas Metro                         │
│                                                     │
│    Permission Preset: [Master Lite ▼]              │
│    ├─ Sales Basic                                  │
│    ├─ Sales Advanced                               │
│    ├─ Master Lite          ✓ Selected              │
│    ├─ Master Full                                  │
│    └─ Custom...                                    │
│                                                     │
│    📋 Custom Permissions:                          │
│    (Shown when "Custom" preset selected)           │
│                                                     │
│    Client Management:                              │
│    ✅ View All Clients                             │
│    ✅ Edit Clients                                 │
│    ✅ Manage Tasks                                 │
│    ✅ Access Content Studio                        │
│                                                     │
│    Sales & Discovery:                              │
│    ✅ Access Discovery                             │
│    ⬜ Claim Any Lead                               │
│    ⬜ Reassign Leads                               │
│                                                     │
│    Intelligence:                                   │
│    ✅ View Competitive Scans                       │
│    ⬜ Trigger Scans                                │
│    ✅ Voice Capture (SCRVNR)                       │
│                                                     │
│    Analytics:                                      │
│    ⬜ View Team Analytics                          │
│    ⬜ View Others' Earnings                        │
│    ✅ Generate Reports                             │
│                                                     │
│    [Save Changes] [Reset to Preset]                │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📊 Mike Johnson (sales)                            │
│ └─ Permission Preset: [Sales Basic ▼]              │
│    (Collapsed view - click to expand)              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Implementation Files:

**Phase 1: Database & Utilities (30 minutes)**
1. `prisma/schema.prisma` - Add permissions field
2. `src/lib/permissions/types.ts` - Permission interface definitions
3. `src/lib/permissions/presets.ts` - Preset configurations
4. `src/lib/permissions/checker.ts` - Permission checking utilities
5. `src/lib/permissions/middleware.ts` - Server-side permission enforcement
6. Migration: `npx prisma db push`

**Phase 2: API Endpoints (30 minutes)**
7. `src/app/api/users/[id]/permissions/route.ts` - GET/PATCH permissions
8. Update existing API routes to check permissions (not just roles)

**Phase 3: UI Components (1 hour)**
9. `src/app/(dashboard)/settings/team/page.tsx` - Team management page
10. `src/components/settings/UserPermissionsEditor.tsx` - Permission toggle UI
11. `src/components/settings/PermissionPresetSelector.tsx` - Preset dropdown
12. `src/components/dashboard/nav.tsx` - Update nav to check permissions

**Phase 4: Integration (1 hour)**
13. Replace all `user.role === "master"` checks with feature checks
14. Update navigation visibility based on permissions
15. Update page access guards with permission checks
16. Add permission tooltips explaining restricted features

**Phase 5: Tutorial & Documentation (30 minutes)**
17. Update `onboarding-tutorial.tsx` for new permission features
18. Add permission system documentation
19. Create migration guide for existing users

#### Permission Checking Pattern:

**Old Way (Role-Based):**
```typescript
if (user.role === "master") {
  // Show feature
}
```

**New Way (Permission-Based):**
```typescript
import { hasPermission } from "@/lib/permissions/checker";

if (hasPermission(user, "canViewAllClients")) {
  // Show feature
}
```

**Server-Side API Protection:**
```typescript
import { requirePermission } from "@/lib/permissions/middleware";

export async function GET(req: Request) {
  const user = await getUser(req);
  requirePermission(user, "canViewTeamAnalytics");
  
  // Continue with logic...
}
```

#### Migration Strategy:

**Existing Users:**
```typescript
// Migration script to run once
async function migrateExistingUsers() {
  // Sales reps → Sales Basic preset
  await prisma.user.updateMany({
    where: { role: "sales" },
    data: { 
      permissions: SALES_BASIC_PRESET,
      permissionPreset: "sales_basic"
    }
  });
  
  // Masters → Master Full preset
  await prisma.user.updateMany({
    where: { role: "master" },
    data: { 
      permissions: MASTER_FULL_PRESET,
      permissionPreset: "master_full"
    }
  });
  
  // Owners → Master Full preset (keep role="owner" for system settings)
  await prisma.user.updateMany({
    where: { role: "owner" },
    data: { 
      permissions: MASTER_FULL_PRESET,
      permissionPreset: "master_full"
    }
  });
}
```

#### Testing Checklist:

**Permission Enforcement:**
- [ ] Sales Basic cannot access team analytics
- [ ] Sales Advanced can generate content for own clients only
- [ ] Master Lite can edit all clients
- [ ] Master Lite cannot access Settings panel
- [ ] Master Full can reassign leads
- [ ] Owners retain all system settings access

**UI Behavior:**
- [ ] Navigation hides restricted items
- [ ] Permission preset dropdown works
- [ ] Custom permission toggles save correctly
- [ ] Permission changes apply immediately (no re-login needed)
- [ ] Tooltip explains why feature is restricted

**API Security:**
- [ ] API routes reject unauthorized requests
- [ ] Permission checks happen server-side
- [ ] Client-side checks match server-side
- [ ] Permission bypass attempts fail gracefully

#### Benefits:

1. **Flexibility:** Promote Arian to client management without full master access
2. **Scalability:** Easy to add new permissions as features grow
3. **Security:** Granular control over sensitive features
4. **UX:** Clear preset system + custom overrides
5. **Audit Trail:** Track permission changes in database

#### Edge Cases to Handle:

- User downgrades from Master Full to Master Lite → Still has access to their own managed clients
- Permission conflicts → Preset always wins unless "Custom" selected
- Missing permissions in old users → Default to most restrictive (Sales Basic)
- API endpoints → Always check permissions server-side, never trust client

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
