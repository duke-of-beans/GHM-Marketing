# COMMISSION & RESIDUAL TRACKING SYSTEM - SPECIFICATION
**Project:** GHM Dashboard  
**Date:** February 17, 2026  
**Priority:** HIGH (Critical for sales team + financial tracking)

---

## 🎯 BUSINESS REQUIREMENTS

### Core Problem
Need to track and display commission/residual payments for sales reps and master managers, with flexible configurations and accurate financial forecasting for Gavin.

### Stakeholders
1. **Gavin (Owner)** - Needs profit tracking, sees all payments going out
2. **David (Master Manager)** - Gets $240/mo for clients he manages
3. **Sales Reps** - Get $1000 at close + $200/mo starting month 2
4. **Future Sales Team** - Need flexible compensation structures

---

## 📊 PAYMENT STRUCTURE

### Sales Rep Payments (Standard)
```yaml
commission:
  amount: $1000
  trigger: "Client signed & onboarded"
  timing: "One-time at close"
  
residual:
  amount: $200/month
  trigger: "Client paying monthly retainer"
  timing: "Starting Month 2, ongoing"
  conditions:
    - Client status = "active"
    - Client paid current month
```

### Master Manager Payments (David)
```yaml
management_fee:
  amount: $240/month
  trigger: "Assigned as master manager"
  timing: "Starting Month 1, ongoing"
  conditions:
    - Master manager assigned to client
    - Client status = "active"
    - Master manager is NOT Gavin
  
note: |
  If Gavin is master manager, no payment goes out (owner profit).
  If master is also sales rep, they get BOTH payments.
```

### Gavin's Profit View
```yaml
monthly_costs_per_client:
  month_1:
    - Sales commission: $1000 (one-time)
    - Master fee: $240 (if David)
    - Total: $1240 (if David is master)
    
  month_2_onwards:
    - Sales residual: $200/month
    - Master fee: $240/month
    - Total: $440/month (if David is master)
    
profit_formula: |
  Monthly Profit = (Client Retainer × Active Clients) - (Sales Residuals + Master Fees)
  
  Example with 10 clients @ $2400/mo:
  Revenue: $24,000
  Costs: (10 × $200) + (8 × $240) = $2000 + $1920 = $3920
  Profit: $20,080/month
```

---

## 🗄️ DATABASE SCHEMA ADDITIONS

### New Table: `user_compensation_config`
```prisma
model UserCompensationConfig {
  id                 Int      @id @default(autoincrement())
  userId             Int      @unique @map("user_id")
  
  // Commission settings
  commissionEnabled  Boolean  @default(true) @map("commission_enabled")
  commissionAmount   Decimal  @default(1000) @db.Decimal(10, 2)
  
  // Residual settings
  residualEnabled    Boolean  @default(true) @map("residual_enabled")
  residualAmount     Decimal  @default(200) @db.Decimal(10, 2)
  residualStartMonth Int      @default(2) @map("residual_start_month") // 1 or 2
  
  // Master manager settings (for masters only)
  masterFeeEnabled   Boolean  @default(false) @map("master_fee_enabled")
  masterFeeAmount    Decimal  @default(240) @db.Decimal(10, 2)
  
  notes              String?
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")
  
  user               User     @relation(fields: [userId], references: [id])
  
  @@map("user_compensation_config")
}
```

### New Table: `client_compensation_override`
```prisma
model ClientCompensationOverride {
  id                Int      @id @default(autoincrement())
  clientId          Int      @map("client_id")
  userId            Int      @map("user_id")
  
  // Override settings (null = use user default)
  commissionAmount  Decimal? @db.Decimal(10, 2)
  residualAmount    Decimal? @db.Decimal(10, 2)
  
  reason            String?  // Why this client is different
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  client            ClientProfile @relation(fields: [clientId], references: [id])
  user              User          @relation(fields: [userId], references: [id])
  
  @@unique([clientId, userId])
  @@map("client_compensation_overrides")
}
```

### New Table: `payment_transactions`
```prisma
model PaymentTransaction {
  id              Int      @id @default(autoincrement())
  clientId        Int      @map("client_id")
  userId          Int      @map("user_id")
  
  type            String   // "commission" | "residual" | "master_fee"
  amount          Decimal  @db.Decimal(10, 2)
  month           DateTime @db.Date
  
  status          String   @default("pending") // "pending" | "paid" | "held" | "cancelled"
  paidAt          DateTime? @map("paid_at")
  notes           String?
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  client          ClientProfile @relation(fields: [clientId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  
  @@index([userId, month])
  @@index([clientId, month])
  @@index([status])
  @@map("payment_transactions")
}
```

### Updates to Existing Tables
```prisma
// Add to ClientProfile
model ClientProfile {
  // ... existing fields
  
  salesRepId      Int?     @map("sales_rep_id") // Who closed the deal
  masterManagerId Int?     @map("master_manager_id") // David or Gavin
  onboardedMonth  DateTime @map("onboarded_month") @db.Date // For residual timing
  
  salesRep        User?    @relation("SalesRep", fields: [salesRepId], references: [id])
  masterManager   User?    @relation("MasterManager", fields: [masterManagerId], references: [id])
  
  compensationOverrides ClientCompensationOverride[]
  paymentTransactions   PaymentTransaction[]
}

// Add to User
model User {
  // ... existing fields
  
  compensationConfig    UserCompensationConfig?
  compensationOverrides ClientCompensationOverride[]
  paymentTransactions   PaymentTransaction[]
  salesRepClients       ClientProfile[] @relation("SalesRep")
  masterClients         ClientProfile[] @relation("MasterManager")
}
```

---

## 🎨 UI/UX DESIGN

### 1. Team Management Page (Master Only)
**Location:** `/team` (already exists, enhance)

**New Section: "Compensation Configuration"**
```
┌─────────────────────────────────────────────────┐
│ Sales Rep Compensation                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Rep Name] ▼                                    │
│                                                 │
│ Commission                                      │
│   [✓] Enabled    Amount: [$1000        ] /close│
│                                                 │
│ Residual                                        │
│   [✓] Enabled    Amount: [$200         ] /month│
│   Starting: [Month 2 ▼]                        │
│                                                 │
│ Master Manager Fee (if master role)            │
│   [ ] Enabled    Amount: [$240         ] /month│
│                                                 │
│ Notes: [One-off deal structure for legacy...  ]│
│                                                 │
│ [Save Changes]  [Reset to Defaults]            │
└─────────────────────────────────────────────────┘
```

### 2. Client Detail Page Enhancement
**Location:** `/clients/[id]` (already exists, enhance)

**New Section: "Sales & Management"**
```
┌─────────────────────────────────────────────────┐
│ Sales & Management                              │
├─────────────────────────────────────────────────┤
│ Sales Rep: [Gavin Kirsch ▼]                    │
│ Master Manager: [Gavin Kirsch ▼]               │
│                                                 │
│ 💰 Compensation (this client)                   │
│                                                 │
│ Gavin (Sales):                                  │
│   Commission: $1000 (paid 01/15/2026)           │
│   Residual: $200/mo starting 02/01/2026         │
│   [Override Amounts]                            │
│                                                 │
│ Gavin (Master):                                 │
│   No payment (owner)                            │
│                                                 │
│ Override Reason: [Leave empty for defaults...  ]│
│                                                 │
│ [Save Changes]                                  │
└─────────────────────────────────────────────────┘
```

### 3. Sales Rep Dashboard
**Location:** `/dashboard` (sales rep view)

**New Widget: "My Earnings"**
```
┌─────────────────────────────────────────────────┐
│ 💰 My Earnings                                  │
├─────────────────────────────────────────────────┤
│ This Month (February 2026)                      │
│   Residuals: $1,400 (7 active clients)         │
│   Status: Pending payment                       │
│                                                 │
│ Next Month (March 2026)                         │
│   Projected: $1,600 (8 active clients)         │
│                                                 │
│ Year to Date                                    │
│   Commissions: $3,000 (3 closes)               │
│   Residuals: $8,400                            │
│   Total: $11,400                               │
│                                                 │
│ [View Payment History]                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Active Clients (generating residuals)           │
├─────────────────────────────────────────────────┤
│ • The German Auto Doctor      $200/mo           │
│ • Precision Plumbing SF       $200/mo           │
│ • Elite Dental Austin         $200/mo           │
│ ... 4 more                                      │
│                                                 │
│ [View All Clients]                              │
└─────────────────────────────────────────────────┘
```

### 4. Master Dashboard (David's View)
**Location:** `/dashboard` (master role, not Gavin)

**New Widget: "Master Manager Earnings"**
```
┌─────────────────────────────────────────────────┐
│ 🎯 Master Manager Earnings                      │
├─────────────────────────────────────────────────┤
│ This Month (February 2026)                      │
│   Management Fees: $1,920 (8 clients)          │
│   Status: Pending payment                       │
│                                                 │
│ Clients I Manage                                │
│   Total: 8 active clients                       │
│   Revenue: $19,200/mo (client retainers)       │
│   My Fee: $1,920/mo (10% of revenue)           │
│                                                 │
│ [View Managed Clients]                          │
└─────────────────────────────────────────────────┘
```

### 5. Gavin's Profit Dashboard
**Location:** `/dashboard` (owner view)

**New Widget: "Company Profitability"**
```
┌─────────────────────────────────────────────────┐
│ 📊 Company Profitability                        │
├─────────────────────────────────────────────────┤
│ February 2026                                   │
│                                                 │
│ Revenue                                         │
│   10 active clients @ avg $2,400/mo            │
│   Total: $24,000                               │
│                                                 │
│ Sales Costs                                     │
│   Residuals (10 clients): $2,000               │
│   Master Fees (8 clients): $1,920              │
│   Total: $3,920                                │
│                                                 │
│ Net Profit: $20,080 (83.7% margin)             │
│                                                 │
│ Month 1 Clients (commissions due)               │
│   2 new clients × $1,000 = $2,000              │
│   ⚠️ Cash impact: -$2,000 this month           │
│                                                 │
│ [View Detailed Breakdown]                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Payment Obligations (Next 30 Days)              │
├─────────────────────────────────────────────────┤
│ Sales Commissions Due                           │
│   • Bob Smith (2 closes): $2,000               │
│                                                 │
│ Sales Residuals Due                             │
│   • Bob Smith: $400                            │
│   • Sarah Johnson: $600                        │
│   • Gavin (self): $1,000                       │
│   Subtotal: $2,000                             │
│                                                 │
│ Master Fees Due                                 │
│   • David Kirsch: $1,920                       │
│                                                 │
│ Total Due: $5,920                              │
│                                                 │
│ [Mark as Paid] [Download Payment Report]       │
└─────────────────────────────────────────────────┘
```

---

## 🔄 AUTOMATED WORKFLOWS

### 1. Monthly Payment Calculation (Cron Job)
**Runs:** 1st of every month at 12:00 AM

**Process:**
```typescript
async function calculateMonthlyPayments() {
  const currentMonth = new Date();
  const activeClients = await getActiveClients();
  
  for (const client of activeClients) {
    // Sales residuals (month 2+)
    if (isEligibleForResidual(client)) {
      await createPaymentTransaction({
        clientId: client.id,
        userId: client.salesRepId,
        type: "residual",
        amount: getResidualAmount(client),
        month: currentMonth,
        status: "pending"
      });
    }
    
    // Master manager fees (month 1+)
    if (client.masterManagerId && !isOwner(client.masterManagerId)) {
      await createPaymentTransaction({
        clientId: client.id,
        userId: client.masterManagerId,
        type: "master_fee",
        amount: getMasterFeeAmount(client),
        month: currentMonth,
        status: "pending"
      });
    }
  }
  
  // Send notifications
  await notifyUsersOfPendingPayments();
  await notifyOwnerOfPaymentObligations();
}
```

### 2. Commission Trigger (On Client Onboard)
**Runs:** When client status changes to "active"

**Process:**
```typescript
async function onClientOnboarded(clientId: number) {
  const client = await getClient(clientId);
  
  // Create commission transaction
  await createPaymentTransaction({
    clientId: client.id,
    userId: client.salesRepId,
    type: "commission",
    amount: getCommissionAmount(client),
    month: new Date(),
    status: "pending"
  });
  
  // Notify sales rep
  await notifyCommissionDue(client.salesRepId, client);
  
  // Notify owner
  await notifyOwnerOfNewCommission(client);
}
```

---

## 📈 REPORTING

### Payment History Report
**Location:** `/reports/payments`

**Filters:**
- Date range
- User (sales rep, master)
- Payment type (commission, residual, master fee)
- Status (pending, paid, held, cancelled)

**Export:**
- CSV for accounting
- PDF for records

**Columns:**
```
Date | Client | User | Type | Amount | Status | Notes
```

### Rep Performance Report
**Location:** `/reports/rep-performance`

**Shows:**
- Closes per month
- Total commissions earned
- Active residual income
- Client retention rate
- Average deal size

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Database & Core Logic (Week 1)
- [ ] Create new tables (migration)
- [ ] Add fields to existing tables
- [ ] Build compensation calculation functions
- [ ] Create payment transaction service
- [ ] Write automated monthly payment job

**Deliverable:** Backend ready, no UI

### Phase 2: Admin Configuration (Week 2)
- [ ] Team page: compensation config per user
- [ ] Client detail: sales rep + master assignment
- [ ] Client detail: compensation override UI
- [ ] API endpoints for all CRUD operations

**Deliverable:** Admins can configure everything

### Phase 3: Dashboard Widgets (Week 3)
- [ ] Sales rep: "My Earnings" widget
- [ ] Master: "Master Manager Earnings" widget
- [ ] Owner: "Company Profitability" widget
- [ ] Owner: "Payment Obligations" widget

**Deliverable:** Everyone sees their financial data

### Phase 4: Reporting & History (Week 4)
- [ ] Payment history page
- [ ] Rep performance report
- [ ] CSV/PDF export functionality
- [ ] Email notifications for pending payments

**Deliverable:** Complete audit trail + notifications

---

## ⚠️ EDGE CASES & RULES

### Client Status Changes
```yaml
active_to_paused:
  residuals: "Stop generating new transactions"
  master_fees: "Stop generating new transactions"
  
paused_to_active:
  residuals: "Resume generating transactions"
  master_fees: "Resume generating transactions"
  note: "No backfill for paused months"
  
active_to_cancelled:
  residuals: "Stop immediately"
  master_fees: "Stop immediately"
  final_payment: "Generate for current month if applicable"
```

### Sales Rep Changes
```yaml
if_sales_rep_changes:
  commissions: "Original rep keeps one-time commission"
  residuals: "New rep gets future residuals starting next month"
  note: "Document reason in client notes"
```

### Master Manager Changes
```yaml
if_master_changes:
  fees: "New master gets future fees starting next month"
  note: "Document reason in client notes"
```

### Gavin as Sales Rep AND Master
```yaml
payments:
  commission: "$1000 (to Gavin, owner profit)"
  residual: "$200/mo (to Gavin, owner profit)"
  master_fee: "$0 (owner doesn't pay self)"
  
profit_tracking:
  show_as: "Owner profit, not expense"
```

---

## 💰 ROI ANALYSIS

### Development Cost
```yaml
estimated_hours: 80-100 hours
hourly_rate: $0 (David building)
opportunity_cost: "Time not spent on other features"
```

### Business Value
```yaml
problems_solved:
  - "Manual commission tracking (saves 4 hours/month)"
  - "Payment disputes (clear audit trail)"
  - "Financial forecasting (real-time profit visibility)"
  - "Rep motivation (transparent earnings)"
  
financial_impact:
  savings: "$400/month (bookkeeping time)"
  revenue_impact: "Better rep retention = more sales"
  profit_visibility: "Priceless for cash flow management"
```

**Recommendation:** HIGH PRIORITY - Build this system

---

## 🔐 SECURITY CONSIDERATIONS

### Access Control
```yaml
compensation_config:
  view: "Master role only"
  edit: "Master role only"
  
payment_transactions:
  view_all: "Master role only"
  view_own: "Any user (their own payments)"
  edit: "Master role only"
  
profit_metrics:
  view: "Owner (Gavin) only"
  edit: "None (calculated)"
```

### Audit Trail
```yaml
log_all:
  - Compensation config changes
  - Override additions/modifications
  - Payment status changes
  - Sales rep/master reassignments
  
retain: "Forever (financial records)"
```

---

## ✅ ACCEPTANCE CRITERIA

### Must Have
- [x] Configure commission/residual per sales rep
- [x] Configure master fee per master manager
- [x] Override compensation for specific clients
- [x] Assign sales rep and master to each client
- [x] Auto-generate monthly payment transactions
- [x] Display earnings on sales rep dashboard
- [x] Display master earnings on master dashboard
- [x] Display profit on owner dashboard
- [x] Payment history report with export

### Nice to Have
- [ ] Payment approval workflow
- [ ] Integration with accounting software
- [ ] Rep performance analytics
- [ ] Commission splits (multiple reps)
- [ ] Retroactive payment adjustments

---

## 📝 NEXT STEPS

1. **Review this spec** - Confirm requirements accurate
2. **Approve Phase 1** - Get database schema approved
3. **Run migration** - Create tables in development
4. **Build Phase 1** - Core logic and calculations
5. **Test Phase 1** - Verify payment calculations
6. **Deploy Phase 1** - Push to production (backend only)
7. **Repeat for Phases 2-4**

---

**Status:** Specification complete, awaiting approval  
**Estimated Timeline:** 4 weeks (phased rollout)  
**Next Action:** Review and approve to proceed with Phase 1
