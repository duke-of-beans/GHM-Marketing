# GHM Dashboard — Client Operations Suite Handoff
**Created:** Feb 22, 2026  
**Branch:** main @ ceec0e5  
**Environment:** BUSINESS — load `D:\Work\CLAUDE_INSTRUCTIONS.md` first

---

## Context

GHM Digital Marketing has real clients now. The PAYMENTS sprint is complete and committed.
The next sprint is the **Client Operations Suite** — a set of features that give David operational
visibility and delivery capability across all active clients without clicking into each record.

David's philosophy: Option B perfection. No MVPs, no stubs, no placeholders. Foundation out.

---

## What Was Just Completed (Do Not Rebuild)

- `PAYMENTS-001` — Wave webhook handler (dormant, Option C active)
- `PAYMENTS-002` — Payment approval UI + `/api/payments/approve` + `/api/payments/pending`
- `PAYMENTS-003` — Contractor fields on User model
- `PAYMENTS-006` — Cron moved to 5th of month
- **Option C polling** — `/api/cron/invoice-status-poll` (hourly, replaces webhook)

---

## Sprint: Client Operations Suite

David identified these priorities:

1. **ITEM-001** — Surface Google Ads everywhere (contracts, onboarding, dashboard, reports) — HIGH
2. **FEAT-013** — GoDaddy parked domain search in competitive scans
3. **BUG-009** — Widget layout theme sync issue
4. **Client health overview** — `/clients` list view showing per-client: last scan, open tasks,
   payment status, last report sent, Ads connected Y/N, red/amber/green health indicator
5. **Google Ads Campaigns tab** — new tab on client detail showing spend/clicks/CTR/ROAS from
   connected Ads account; data also surfaces in monthly report PDF

---

## MANDATORY: Audit Before Building

**Do not start building any of the above until you have audited for foundational dependencies.**

Read the following files in order before writing a single line of code:

```
D:\Work\SEO-Services\ghm-dashboard\STATUS.md
D:\Work\SEO-Services\ghm-dashboard\prisma\schema.prisma
D:\Work\SEO-Services\ghm-dashboard\src\components\clients\profile.tsx
D:\Work\SEO-Services\ghm-dashboard\src\components\clients\integrations\ClientIntegrationsTab.tsx
D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard)\clients\page.tsx
```

Then answer these questions explicitly before proposing any design:

**A. Google Ads data pipeline** — Does a working `/api/google-ads/[clientId]/campaigns` endpoint
exist that actually fetches live data from the connected Ads account? Or does `GoogleAdsConnection`
exist in the schema but have no read pipeline behind it? If the data pipeline doesn't exist, that
is the foundation and must be built first before any UI.

**B. Clients list page** — What does `/app/(dashboard)/clients/page.tsx` currently render?
Does it already fetch health scores, task counts, payment status per client, or does it just
list names? The health overview feature depends on what's already there.

**C. BUG-009** — Find the actual bug before touching anything. Search for widget layout /
theme sync code. Understand the root cause (likely a CSS variable or localStorage key that
doesn't update on theme switch) before writing a fix.

**D. FEAT-013 GoDaddy** — Find where competitive scan domain research currently happens.
Is there an existing domain lookup utility? Does GoDaddy have a public availability API or
are we scraping? Establish what's available before designing the feature.

**E. Reports PDF** — For ITEM-001, find the report generation code to understand how sections
are added. Adding Ads data to the PDF report is only possible if the PDF pipeline is templated
and extensible — if it's hardcoded, that needs to be addressed first.

**F. CONTRACT_AGREEMENT.md** — For ITEM-001, the contract at
`D:\Work\SEO-Services\CLIENT_AGREEMENT.md` needs a one-line addition to Section 1.1 and
the "What You're Getting" table to explicitly mention PPC / Google Ads campaign support.
This is a docs change and can be done at any time — no dependencies.

---

## Dependency-First Build Order (Provisional — Confirm After Audit)

Based on what is already known, the likely correct order is:

1. **Google Ads data read pipeline** (if missing) — fetch campaigns/spend from connected account
2. **CLIENT_AGREEMENT.md** — add Ads language (no code dependency, do this first)
3. **BUG-009** — fix the theme sync bug (isolated, unblock UX)
4. **Client health list view** — upgrade `/clients` page with per-client status columns
5. **Google Ads Campaigns tab** — new tab on client detail (depends on #1)
6. **Ads data in monthly report PDF** (depends on #1 + understanding of report pipeline)
7. **FEAT-013** — GoDaddy parked domain check (isolated, fits anywhere)

If the audit reveals the Ads pipeline does not exist, items 5 and 6 cannot start until it does.
Do not stub or mock the Ads data — build the real pipeline first.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `D:\Work\SEO-Services\ghm-dashboard\STATUS.md` | Full backlog + completed items |
| `D:\Work\SEO-Services\ghm-dashboard\prisma\schema.prisma` | DB schema — 1680 lines |
| `D:\Work\SEO-Services\ghm-dashboard\src\components\clients\profile.tsx` | Client detail tab orchestrator |
| `D:\Work\SEO-Services\ghm-dashboard\src\components\clients\integrations\ClientIntegrationsTab.tsx` | GBP + Ads connection UI |
| `D:\Work\SEO-Services\ghm-dashboard\START_NEXT_SESSION.txt` | Session context from payments sprint |
| `D:\Work\SEO-Services\CLIENT_AGREEMENT.md` | Client contract — needs Ads language added |

---

## Schema Quick Reference — Ads Connection

```prisma
model GoogleAdsConnection {
  // exists in schema — check what fields are present
  // and whether any API read routes exist
}
```

Run: `grep -n "GoogleAdsConnection" prisma/schema.prisma` to see full model definition.

---

## David's Operating Principles (Non-Negotiable)

- **Option B perfection** — 10x improvement, not 10%. No temporary solutions.
- **Foundation out** — backend before surface. Never build UI on a missing data layer.
- **Zero technical debt** — no mocks, stubs, or TODOs in committed code.
- **Zero assumptions** — read the actual code before designing anything.

---

## Last Commit

```
ceec0e5  feat(payments): PAYMENTS sprint complete — webhook handler, approval UI, invoice polling, cron schedule
```

Clean. TypeScript passes. Ready for next sprint.
