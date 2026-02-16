# Keyword Tracking - Setup Guide

> How to configure keyword tracking for competitive scans

## Overview

The competitive scan engine now tracks keyword rankings for clients and their competitors. Keywords are stored in the Lead's `competitiveIntel` JSON field and rankings are fetched during each scan using the Ahrefs API.

---

## Configure Keywords for a Client

Keywords are stored in: `Lead.competitiveIntel.trackedKeywords`

### Method 1: Via Database (Prisma Studio)

1. Run `npm run db:studio`
2. Navigate to the `Lead` table
3. Find the client's lead record
4. Edit `competitiveIntel` field (JSON)
5. Add keywords array:

```json
{
  "trackedKeywords": [
    "personal injury lawyer",
    "car accident attorney",
    "wrongful death lawyer"
  ]
}
```

### Method 2: Via API (Future Enhancement)

Create an API endpoint to manage keywords:

```typescript
// POST /api/clients/[id]/keywords
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
```

---

## How Keyword Tracking Works

1. **During Scan:**
   - System reads `trackedKeywords` from `Lead.competitiveIntel`
   - Fetches current rankings for client + all competitors
   - Stores rankings in `CompetitiveScan.clientData.rankings` and `CompetitiveScan.competitors[].rankings`

2. **Ranking Data Structure:**
```json
{
  "rankings": {
    "personal injury lawyer": 3,
    "car accident attorney": 12,
    "wrongful death lawyer": null
  }
}
```
   - Key = keyword
   - Value = position (null if not ranking in top 100)

3. **Position Change Detection:**
   - Compares current scan vs previous scan
   - Identifies: improved, declined, new_rankings, lost_rankings
   - Stored in `CompetitiveScan.deltas.position_changes`

4. **Alerts Generated:**
   - Critical: Dropped 10+ positions
   - Warning: Dropped 5-9 positions
   - Info: Improved 5+ positions

---

## Best Practices

### Keyword Selection

**Target 5-15 keywords per client:**
- High-value commercial keywords (money keywords)
- Brand keywords (client business name)
- Competitor brand keywords (track their ranking)
- Local keywords (city + service)
- Long-tail conversions ("best X near me")

**Example for Personal Injury Law Firm:**
```json
{
  "trackedKeywords": [
    "personal injury lawyer los angeles",
    "car accident attorney LA",
    "wrongful death lawyer california",
    "slip and fall attorney",
    "workers comp lawyer near me",
    "[Client Name] law firm",
    "[Competitor Name] attorney",
    "best injury lawyer LA"
  ]
}
```

### API Cost Management

**Ahrefs Keyword Ranking API:**
- Cost: ~$0.01 per domain lookup
- 1 client + 3 competitors = 4 lookups = $0.04/scan
- Weekly scans = $2.08/year per client

**Optimization:**
- Limit to 15 keywords max per client
- Skip ranking checks for competitors without domains
- Use longer scan intervals for low-retainer clients

---

## Viewing Ranking Data

### Via Scan History UI

Rankings appear in the scan detail:
```
Keyword: personal injury lawyer
Position: #3 (↑2 from last scan)
```

### Via Database Query

```sql
SELECT 
  client_id,
  scan_date,
  client_data->'rankings' as client_rankings,
  deltas->'position_changes' as changes
FROM competitive_scans
WHERE client_id = 1
ORDER BY scan_date DESC
LIMIT 1;
```

### Via API

```typescript
GET /api/clients/[id]/scans

// Returns scan with rankings data
{
  "clientData": {
    "rankings": {
      "keyword1": 5,
      "keyword2": 12
    }
  },
  "deltas": {
    "position_changes": {
      "improved": [
        { "keyword": "keyword1", "from": 8, "to": 5 }
      ]
    }
  }
}
```

---

## Future Enhancements

### Keyword Management UI

Add keywords tab on client profile:
- Add/remove tracked keywords
- Set priority (P1, P2, P3)
- Track keyword difficulty + search volume
- Historical ranking chart per keyword

### Automated Keyword Discovery

Use Ahrefs to find:
- Keywords client already ranks for
- Keywords competitors rank for
- Suggested keywords by industry

### Rank Tracking Dashboards

- Keyword performance over time
- Competitive positioning matrix
- Win/loss tracking
- Velocity (how fast rankings are changing)

---

## Troubleshooting

### No Rankings Showing

**Check:**
1. Keywords configured in `Lead.competitiveIntel.trackedKeywords`?
2. Ahrefs API key valid in `.env`?
3. Client domain exists in `Lead.website`?
4. Scan completed successfully?

**Debug:**
```sql
-- Check if keywords are set
SELECT 
  l.business_name,
  l.competitive_intel->'trackedKeywords' as keywords
FROM leads l
JOIN client_profiles cp ON cp.lead_id = l.id
WHERE cp.id = 1;

-- Check scan data
SELECT 
  scan_date,
  client_data->'rankings' as rankings,
  status
FROM competitive_scans
WHERE client_id = 1
ORDER BY scan_date DESC
LIMIT 1;
```

### Rankings Always NULL

- Domain might not rank in top 100 for those keywords
- Try broader keywords or local modifiers
- Check Ahrefs directly to verify ranking data exists

### API Costs Too High

- Reduce tracked keywords to 5-10 core terms
- Increase scan frequency to monthly
- Skip competitor ranking checks (set `includeCompetitors: false`)

---

**Version:** 1.0.0  
**Updated:** 2026-02-16  
**Status:** Production Ready
