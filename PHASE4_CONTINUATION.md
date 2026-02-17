# GHM DASHBOARD - PHASE 4 CONTINUATION HANDOFF

**SESSION CONTEXT:** Phase 4 Dashboard Enhancements - Options E, D, C, F remaining

**CURRENT STATUS:**
- ✅ Phase 3: Earnings/profitability widgets COMPLETE
- ✅ Phase 4 Option A: Enhanced filtering (leads + clients) COMPLETE
- ✅ Phase 4 Option B: First-time user tutorial COMPLETE
- ⏳ Phase 4 Options E→D→C→F: PENDING

**LAST COMMIT:** `de98fed` - Add interactive first-time user tutorial with role-specific onboarding flows

**DEPLOYMENT:** All changes deployed to Vercel main branch

---

## 🎯 NEXT SESSION TASK: COMPLETE OPTIONS E → D → C → F

Execute in this **exact order**:

### **E. CONTENT GENERATION WORKFLOWS**

**Objective:** Build AI-powered content generation for SEO campaigns

**Required Components:**

1. **Blog Post Generator**
   - Input: Client industry, target keywords, tone
   - Output: SEO-optimized blog posts (800-1500 words)
   - Integration: Add to client detail page
   - API: Use Anthropic API with streaming response
   - Storage: Save to ClientContent table

2. **Social Media Content**
   - Input: Blog post or topic
   - Output: LinkedIn/Facebook/Twitter variants
   - Features: Auto-generate 3-5 social posts per blog
   - Storage: Link to parent content

3. **Meta Description Generator**
   - Input: Page content or URL
   - Output: SEO meta descriptions (150-160 chars)
   - Bulk mode: Generate for multiple pages

4. **Content Calendar**
   - Display: Monthly view of scheduled content
   - Actions: Drag-to-reschedule, bulk approve
   - Filters: By client, content type, status

**UI Location:** New "Content Studio" tab in Clients page

**Database Changes:**
```prisma
model ClientContent {
  id           Int       @id @default(autoincrement())
  clientId     Int
  client       ClientProfile @relation(fields: [clientId], references: [id])
  contentType  String    // "blog", "social", "meta"
  title        String?
  content      String    @db.Text
  keywords     String[]
  status       String    // "draft", "review", "approved", "published"
  scheduledFor DateTime?
  publishedAt  DateTime?
  createdAt    DateTime  @default(now())
  metadata     Json?
}
```

**Checkpoint Frequency:** After each component (4 checkpoints total)

---

### **D. TASK AUTOMATION**

**Objective:** Auto-generate SEO tasks based on client health and activity

**Required Components:**

1. **Automated Task Generation**
   - Trigger: New client onboarded
   - Generate: Month 1 onboarding checklist (10 tasks)
   - Schedule: Stagger tasks across 30 days

2. **Health-Based Task Creation**
   - Trigger: Health score drops below 60
   - Generate: Recovery tasks (competitor scan, content audit, backlink check)
   - Assign: To client's master manager

3. **Scan-Based Task Generation**
   - Trigger: Competitive scan completes
   - Analyze: Ranking changes
   - Generate: Tasks for keywords that dropped >3 positions

4. **Smart Reminders**
   - Email: Task due in 2 days (digest, not per-task)
   - In-app: Badge count on Clients page
   - Slack: Optional integration for high-priority tasks

5. **Task Templates**
   - UI: Template library (SEO audit, content plan, backlink campaign)
   - Action: One-click apply template to client
   - Storage: TaskTemplate table

**Database Changes:**
```prisma
model TaskTemplate {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  tasks       Json     // Array of {title, description, daysOffset}
  category    String   // "onboarding", "recovery", "campaign"
  createdAt   DateTime @default(now())
}

model TaskReminder {
  id         Int      @id @default(autoincrement())
  taskId     Int
  task       ClientTask @relation(fields: [taskId], references: [id])
  userId     Int
  sentAt     DateTime
  channel    String   // "email", "inapp", "slack"
}
```

**Checkpoint Frequency:** After each component (5 checkpoints total)

---

### **C. CLIENT PORTAL IMPROVEMENTS**

**Objective:** Enhance client-facing portal for better self-service

**Required Components:**

1. **Dashboard Enhancements**
   - Add: Monthly traffic graph (trend visualization)
   - Add: Top 10 keywords ranking tracker
   - Add: Recent content published
   - Improve: Mobile responsiveness

2. **Report Download**
   - Action: "Download PDF" button for monthly reports
   - Format: Branded PDF with charts
   - Storage: Cache PDFs for 90 days

3. **Content Approval Workflow**
   - UI: Client can approve/reject drafted content
   - Action: Approve → moves to "approved" status
   - Notification: Email to master manager on action

4. **Support Ticket System**
   - UI: "Contact Support" button
   - Form: Subject, description, priority
   - Storage: SupportTicket table
   - Notification: Email to assigned master manager

**Database Changes:**
```prisma
model SupportTicket {
  id          Int      @id @default(autoincrement())
  clientId    Int
  client      ClientProfile @relation(fields: [clientId], references: [id])
  subject     String
  description String   @db.Text
  priority    String   // "low", "medium", "high"
  status      String   @default("open") // "open", "in_progress", "resolved"
  assignedTo  Int?
  createdAt   DateTime @default(now())
  resolvedAt  DateTime?
}
```

**Checkpoint Frequency:** After each component (4 checkpoints total)

---

### **F. PERFORMANCE OPTIMIZATION**

**Objective:** Reduce build time, load time, and query performance

**Required Components:**

1. **Build Optimization**
   - Analyze: Current build time (check Vercel logs)
   - Fix: Unused imports (use ESLint auto-fix)
   - Fix: Large bundle sizes (check with `npm run build`)
   - Target: <60s build time

2. **Database Query Optimization**
   - Identify: Slow queries (N+1 problems)
   - Add: Missing indexes on foreign keys
   - Add: Prisma query logging in dev
   - Optimize: Dashboard metrics queries (combine where possible)

3. **Caching Strategy**
   - Implement: React cache() for dashboard metrics
   - Implement: Next.js revalidate for static pages
   - Implement: SWR for client-side data fetching

4. **Image Optimization**
   - Convert: All logos to WebP
   - Implement: next/image for all images
   - Add: Lazy loading for client cards

5. **Code Splitting**
   - Dynamic imports for heavy components
   - Lazy load: Analytics dashboard, report generator
   - Reduce: Initial JS bundle size

**Tools:**
- Lighthouse audit (target score: 90+)
- Next.js Bundle Analyzer
- Prisma query logging

**Checkpoint Frequency:** After each component (5 checkpoints total)

---

## 📋 EXECUTION CHECKLIST

For **EACH** option (E, D, C, F):

1. ✅ Review this handoff document
2. ✅ Read existing codebase for context
3. ✅ Create components incrementally (frequent checkpoints)
4. ✅ Test locally before committing
5. ✅ Commit with descriptive messages
6. ✅ Push to main (auto-deploys to Vercel)
7. ✅ Monitor build logs for errors
8. ✅ Fix ESLint errors immediately
9. ✅ Update this handoff doc when complete

---

## 🎯 SUCCESS CRITERIA

**Option E Complete When:**
- Content generation UI integrated
- AI workflows functional
- Content calendar operational
- All 4 checkpoints committed

**Option D Complete When:**
- Task auto-generation working
- Health triggers firing
- Reminder system active
- All 5 checkpoints committed

**Option C Complete When:**
- Portal UI enhanced
- PDF downloads working
- Approval workflow functional
- All 4 checkpoints committed

**Option F Complete When:**
- Build time <60s
- Lighthouse score 90+
- No N+1 queries
- All 5 checkpoints committed

---

## 🚨 CRITICAL REMINDERS

1. **Checkpoint frequency:** Every 3-5 tool calls (use SHIM/CONTINUITY)
2. **ESLint compliance:** Fix errors immediately (apostrophes, unused imports)
3. **Incremental commits:** Commit after each component, not at end
4. **Test before push:** Catch errors locally, not in Vercel
5. **Database migrations:** Run `npx prisma migrate dev` after schema changes

---

## 📦 CURRENT PROJECT STATE

**Repository:** `duke-of-beans/GHM-Marketing`
**Branch:** `main`
**Last Commit:** `de98fed`
**Vercel Deployment:** Auto-deploy on push to main

**Key Files:**
- Database: `D:\Work\SEO-Services\ghm-dashboard\prisma\schema.prisma`
- Components: `D:\Work\SEO-Services\ghm-dashboard\src\components\`
- API Routes: `D:\Work\SEO-Services\ghm-dashboard\src\app\api\`
- Pages: `D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard)\`

**Environment:**
- Node.js: v18+
- Next.js: 14.2.35
- Prisma: 6.19.2
- TypeScript: Strict mode

---

## 🎬 START NEXT SESSION WITH:

```
Continue Phase 4 Dashboard Enhancements. Complete options in this order: E (Content Generation) → D (Task Automation) → C (Client Portal) → F (Performance). Start with Option E - Content Generation Workflows. Use frequent checkpoints (every 3-5 tool calls). Fix ESLint errors immediately. Commit incrementally.
```

---

**Last Updated:** February 17, 2026
**Session Type:** Continuation handoff
**Priority:** HIGH - Customer-facing features
