# GHM DASHBOARD - OWNER CONFIGURATION

## Co-Owners (No Self-Payment)

The commission system treats the following users as owners who do NOT receive payment when assigned as master managers:

- **User ID 1**: Gavin Kirsch (original owner)
- **User ID 2**: David Kirsch (taking over operations)

When either is assigned as:
- **Sales Rep**: Receives commission + residuals (normal payments)
- **Master Manager**: Receives $0 (counts as owner profit instead)

## Payment Rules

### Sales Commissions & Residuals
- Gavin and David CAN receive these if they close deals
- Commission: $1,000 one-time
- Residual: $200/mo starting Month 2

### Master Manager Fees
- **Other users**: $240/mo per client managed
- **Gavin/David**: $0/mo (owner profit, not expense)

## Why This Matters

When David or Gavin manages a client:
1. NO payment transaction is created
2. Profit dashboard counts full retainer as profit
3. UI shows "Owner (no payment)" badge
4. System notes log "Owner profit, not expense"

## Code Locations

Payment logic: `src/lib/payments/calculations.ts` (line ~138)
UI badges: `src/components/clients/client-compensation.tsx` (line ~227)
Constant: `OWNER_USER_IDS = [1, 2]`

## Future: Database-Driven Ownership

Instead of hardcoded IDs, consider adding:
```prisma
model User {
  isOwner Boolean @default(false)
}
```

Then update calculations to check `user.isOwner` flag.

---

**Last Updated**: February 17, 2026  
**Status**: David = Full Owner Access (master role + no self-payment)
