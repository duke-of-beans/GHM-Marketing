# CLIENT DETAIL EDITING & TASK MANAGEMENT - SPECIFICATION
**Project:** GHM Dashboard  
**Date:** February 17, 2026  
**Priority:** MEDIUM (Quality of life improvements)

---

## 🎯 FEATURE 1: EDIT CLIENT DETAILS

### Current Problem
Once a client is added to the system, there's no way to edit their information (business name, phone, address, retainer amount, etc.). This forces workarounds like deleting and re-creating clients.

### Solution
Add edit functionality to client detail page with inline editing or edit modal.

---

### UI/UX Design

#### Option A: Inline Editing (Recommended)
```
┌─────────────────────────────────────────────────┐
│ The German Auto Doctor               [✏️ Edit] │
├─────────────────────────────────────────────────┤
│ Simi Valley, CA · (805) 555-1234               │
│ www.germanautodoctor.com                        │
│                                                 │
│ Monthly Retainer: $2,400                        │
│ Health Score: 50 (Competitive)                  │
│ Scan Frequency: Weekly ▼                        │
│                                                 │
│ Client since Jan 15, 2026                       │
│ Last scan: 2 days ago                           │
└─────────────────────────────────────────────────┘

[Click ✏️ Edit]

┌─────────────────────────────────────────────────┐
│ Edit Client Information         [✓ Save] [✗ Cancel]│
├─────────────────────────────────────────────────┤
│ Business Name:                                  │
│ [The German Auto Doctor                    ]   │
│                                                 │
│ Contact Information:                            │
│ Phone: [(805) 555-1234     ]                   │
│ Email: [contact@germanautodoctor.com        ]  │
│ Website: [www.germanautodoctor.com          ]  │
│                                                 │
│ Address:                                        │
│ Street: [123 Main St                        ]  │
│ City: [Simi Valley         ] State: [CA ▼]    │
│ Zip: [93065   ]                                │
│                                                 │
│ Service Configuration:                          │
│ Monthly Retainer: [$2,400      ]               │
│ Scan Frequency: [Weekly ▼]                     │
│                                                 │
│ [Save Changes]  [Cancel]                        │
└─────────────────────────────────────────────────┘
```

#### Implementation Details

**Editable Fields:**
```yaml
lead_fields:
  - businessName (required)
  - phone (required)
  - email
  - website
  - address
  - city (required)
  - state (required)
  - zipCode

client_profile_fields:
  - retainerAmount (required, must be > 0)
  - scanFrequency (weekly | biweekly | monthly)
  - status (active | paused | at_risk | churned)
  - healthScore (0-100)
```

**Validation Rules:**
```typescript
validation = {
  businessName: { required: true, minLength: 2, maxLength: 100 },
  phone: { required: true, pattern: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/ },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  website: { pattern: /^https?:\/\/.+/ },
  retainerAmount: { required: true, min: 0, type: 'number' },
  city: { required: true },
  state: { required: true, length: 2 },
  zipCode: { pattern: /^\d{5}(-\d{4})?$/ },
}
```

**API Endpoint:**
```typescript
// PATCH /api/clients/[id]
{
  lead: {
    businessName?: string,
    phone?: string,
    email?: string,
    website?: string,
    address?: string,
    city?: string,
    state?: string,
    zipCode?: string,
  },
  clientProfile: {
    retainerAmount?: number,
    scanFrequency?: string,
    status?: string,
  }
}

// Response:
{
  success: true,
  data: { client, lead }
}
```

**Audit Trail:**
```typescript
// Log all changes in ClientNote table
{
  type: "system",
  content: "Updated client details: retainerAmount ($2400 → $2600), email (null → contact@example.com)",
  authorId: currentUser.id,
  isPinned: false,
}
```

---

## 🎯 FEATURE 2: TASK MANAGEMENT FOR EXISTING CLIENTS

### Current Problem
Need to track ongoing work (WIP) for established clients:
- Content pieces in progress
- Technical SEO fixes needed
- Link building campaigns
- Review management tasks
- Site builds/updates

Currently tasks are auto-generated from scans, but need ability to manually add tasks for existing projects.

### Solution
Enhance task management with:
1. Bulk task import (from list or CSV)
2. Task templates for common workflows
3. Better task organization and filtering

---

### UI/UX Design

#### Location: Client Detail Page → Tasks Tab

**Current State:**
```
Tasks (3 open)
  [+ Add Task]
  
  □ Optimize homepage for "auto repair simi valley"
  □ Build 3 quality backlinks
  □ Request review from last 5 customers
```

**Enhanced State:**
```
┌─────────────────────────────────────────────────┐
│ Tasks (12 open · 45 completed)                  │
│                                                 │
│ [+ Add Task] [+ Bulk Import] [+ From Template] │
│                                                 │
│ Filter: [All ▼] [Category ▼] [Status ▼] [🔍]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SITE BUILD (In Progress)                        │
├─────────────────────────────────────────────────┤
│ □ Homepage design approved                      │
│ □ Services page content written                 │
│ ☑ About page content written                   │
│ □ Contact form implemented                      │
│ □ SSL certificate installed                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CONTENT (Queued)                                │
├─────────────────────────────────────────────────┤
│ □ Blog post: "5 Signs You Need Transmission..." │
│ □ Service page: "Brake Repair"                  │
│ □ Service page: "Oil Change"                    │
└─────────────────────────────────────────────────┘
```

#### Bulk Import Modal

**Button:** "+ Bulk Import"

```
┌──────────────────────────────────────────────────┐
│ Bulk Import Tasks                    [✗ Close]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Method: (•) Paste List  ( ) Upload CSV          │
│                                                  │
│ [Text Area]                                      │
│ Paste tasks here, one per line:                 │
│                                                  │
│ Homepage design approved                         │
│ Services page content written                    │
│ About page content written                       │
│ Contact form implemented                         │
│ ...                                              │
│                                                  │
│ Default Settings (applied to all):              │
│   Category: [Site Build ▼]                      │
│   Priority: [P3 ▼]                              │
│   Status: [Queued ▼]                            │
│                                                  │
│ [Preview (8 tasks)] [Import Tasks]              │
└──────────────────────────────────────────────────┘
```

#### Task Templates

**Button:** "+ From Template"

```
┌──────────────────────────────────────────────────┐
│ Add Tasks from Template              [✗ Close]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Select Template:                                 │
│                                                  │
│ • New Website Build (12 tasks)                   │
│   ├─ Site structure & pages                      │
│   ├─ Content creation                            │
│   ├─ Technical setup                             │
│   └─ Launch checklist                            │
│                                                  │
│ • Monthly SEO Maintenance (8 tasks)              │
│   ├─ Content updates                             │
│   ├─ Technical SEO checks                        │
│   └─ Link building                               │
│                                                  │
│ • Local SEO Optimization (6 tasks)               │
│   ├─ GMB optimization                            │
│   ├─ Citation building                           │
│   └─ Review management                           │
│                                                  │
│ [Select Template] [Customize Before Import]      │
└──────────────────────────────────────────────────┘
```

#### CSV Format for Import

```csv
title,category,priority,status,description,due_date
Homepage design approved,site-build,P2,in-progress,"Client needs to approve design mockups",2026-02-20
Services page written,content,P3,queued,"Write content for all service pages",2026-02-25
SSL certificate,technical-seo,P1,queued,"Install and configure SSL",2026-02-18
```

---

### Implementation Details

#### Database (Already Exists!)
The `ClientTask` table already supports everything needed:
```prisma
model ClientTask {
  id              Int      @id @default(autoincrement())
  clientId        Int
  title           String
  description     String?
  category        String
  priority        String   @default("P3")
  status          String   @default("queued")
  dueDate         DateTime?
  // ... other fields
}
```

#### API Endpoints

**Bulk Create:**
```typescript
// POST /api/clients/[id]/tasks/bulk
{
  tasks: [
    { title: "Task 1", category: "site-build", priority: "P2" },
    { title: "Task 2", category: "content", priority: "P3" },
    // ... up to 100 tasks
  ],
  defaults: {
    category: "site-build",
    priority: "P3",
    status: "queued"
  }
}

// Response:
{
  success: true,
  created: 8,
  data: [...] // Array of created tasks
}
```

**Template Library:**
```typescript
// GET /api/task-templates
{
  success: true,
  data: [
    {
      id: "website-build",
      name: "New Website Build",
      tasks: [...]
    },
    // ... other templates
  ]
}

// POST /api/clients/[id]/tasks/from-template
{
  templateId: "website-build",
  customize: {
    // Optional overrides
    priority: "P2",
    dueDate: "2026-03-01"
  }
}
```

#### Task Templates (Static Config)

**Location:** `/lib/task-templates.ts`

```typescript
export const TASK_TEMPLATES = {
  "website-build": {
    name: "New Website Build",
    description: "Complete website build workflow",
    tasks: [
      {
        title: "Client discovery call",
        category: "site-build",
        priority: "P1",
        description: "Understand client needs, goals, target audience"
      },
      {
        title: "Sitemap & wireframes",
        category: "site-build",
        priority: "P1",
        description: "Create site structure and page layouts"
      },
      {
        title: "Homepage design",
        category: "site-build",
        priority: "P1",
        description: "Design and get approval for homepage"
      },
      // ... 9 more tasks
    ]
  },
  
  "monthly-maintenance": {
    name: "Monthly SEO Maintenance",
    description: "Recurring monthly tasks",
    tasks: [
      {
        title: "Performance review",
        category: "technical-seo",
        priority: "P2",
        description: "Check site speed, uptime, errors"
      },
      // ... 7 more tasks
    ]
  },
  
  // ... more templates
};
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Edit Client Details (Week 1)
**Priority:** HIGH (blocking current workflow)

- [ ] Create PATCH endpoint for client updates
- [ ] Add edit button to client detail header
- [ ] Build edit form with validation
- [ ] Handle both Lead and ClientProfile updates
- [ ] Add audit trail (system note)
- [ ] Test with various field combinations

**Deliverable:** Can edit all client info from detail page

### Phase 2: Manual Task Management (Week 2)
**Priority:** MEDIUM (nice to have, not blocking)

- [ ] Enhance "Add Task" form
- [ ] Add bulk import modal (paste list)
- [ ] Create bulk create API endpoint
- [ ] Add task filtering (category, status, priority)
- [ ] CSV import functionality

**Deliverable:** Can quickly add multiple tasks

### Phase 3: Task Templates (Week 3)
**Priority:** LOW (optimization, not critical)

- [ ] Define standard templates (static config)
- [ ] Build template selection modal
- [ ] Create template application endpoint
- [ ] Add template customization options
- [ ] Document template creation process

**Deliverable:** One-click task list creation

---

## ⚠️ EDGE CASES & CONSIDERATIONS

### Edit Client Details

**Case:** User changes business name
```yaml
impact: "All references show new name"
considerations:
  - Update Lead.businessName
  - Update ClientProfile.businessName (redundant but keeps sync)
  - Add system note documenting change
  - Do NOT affect existing tasks/notes (historical record)
```

**Case:** User changes retainer amount
```yaml
impact: "Future billing and commission calculations"
considerations:
  - Update only ClientProfile.retainerAmount
  - Add system note with old → new values
  - Do NOT retroactively adjust past transactions
  - Future residuals use new amount
```

**Case:** User removes phone/email
```yaml
validation: "Cannot remove required fields"
behavior: "Form validation prevents saving"
```

### Bulk Task Import

**Case:** Import 100+ tasks
```yaml
limit: "Cap at 100 tasks per import"
reason: "Prevent accidental database bloat"
solution: "Show error, ask user to split into batches"
```

**Case:** Duplicate task titles
```yaml
behavior: "Allow duplicates (valid use case)"
example: "Multiple 'Review request' tasks for different customers"
```

**Case:** Import with missing category
```yaml
behavior: "Apply default category from form"
fallback: "Use 'content' if no default set"
```

---

## 📊 SUCCESS METRICS

### Edit Functionality
```yaml
adoption:
  - "Number of clients edited per week"
  - "Most frequently edited fields"
  - "Time saved vs delete-and-recreate"
  
quality:
  - "Edit errors (validation failures)"
  - "Edits that are immediately reverted"
  - "Support tickets about editing"
```

### Task Management
```yaml
usage:
  - "Tasks created manually vs auto-generated"
  - "Bulk imports per week"
  - "Template usage vs custom tasks"
  
efficiency:
  - "Time to add 10 tasks (before vs after)"
  - "Task completion rate"
  - "Task abandonment rate (never started)"
```

---

## ✅ ACCEPTANCE CRITERIA

### Edit Client Details
- [x] Can edit business name, phone, email, website
- [x] Can edit address fields (street, city, state, zip)
- [x] Can edit retainer amount and scan frequency
- [x] Can edit client status
- [x] All edits validated before save
- [x] Changes logged in system notes
- [x] Toast notification on save
- [x] Handles validation errors gracefully

### Bulk Task Import
- [x] Can paste task list (one per line)
- [x] Can upload CSV file
- [x] Can set default category, priority, status
- [x] Preview shows all tasks before import
- [x] Import creates all tasks in single transaction
- [x] Shows success message with count
- [x] Handles errors gracefully (partial imports)

### Task Templates
- [x] Can browse available templates
- [x] Can preview template tasks
- [x] Can apply template with defaults
- [x] Can customize before applying
- [x] Templates create tasks in correct order
- [x] Shows success message with count

---

## 💡 FUTURE ENHANCEMENTS

### Edit History
- Show full edit history per client
- Diff view (before/after)
- Revert to previous values

### Task Bulk Operations
- Bulk edit (change category/priority)
- Bulk delete
- Bulk status change
- Drag-and-drop reordering

### Advanced Templates
- Dynamic templates (based on client data)
- Conditional tasks (if/then logic)
- Template marketplace (share templates)
- Client-specific template customization

---

## 📝 NEXT STEPS

### Immediate (Edit Client Details)
1. **Build API endpoint** - PATCH /api/clients/[id]
2. **Create edit form** - Reusable component
3. **Add to client detail page** - Edit button + modal/inline
4. **Test thoroughly** - All field combinations
5. **Deploy to production**

**Timeline:** 1-2 days (high priority, simple feature)

### Follow-up (Task Management)
1. **Bulk import modal** - UI component
2. **Bulk create endpoint** - API
3. **CSV parser** - Import functionality
4. **Templates config** - Static data
5. **Template modal** - UI component

**Timeline:** 3-5 days (medium priority, nice to have)

---

**Status:** Specification complete, ready to implement  
**Priority:** Edit functionality = HIGH, Task features = MEDIUM  
**Recommendation:** Implement edit functionality immediately, task features next sprint

---

**Created:** February 17, 2026  
**Author:** Claude (with David's requirements)  
**Version:** 1.0.0
