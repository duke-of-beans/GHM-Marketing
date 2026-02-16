# Competitive Scan Engine - Usage Guide

> How to run competitive scans and integrate into workflows

## Quick Start

### Manual Scan (Single Client)

```typescript
import { executeScan } from '@/lib/competitive-scan';

const result = await executeScan({ clientId: 123 });

console.log(result);
// {
//   success: true,
//   scanId: 456,
//   healthScore: 72,
//   alertsGenerated: 5,
//   tasksCreated: 3,
//   errors: []
// }
```

### Batch Scan (Multiple Clients)

```typescript
import { executeBatchScan } from '@/lib/competitive-scan';

// Scan specific clients
const result = await executeBatchScan({ 
  clientIds: [123, 124, 125] 
});

// Or scan all clients due for a scan
const result = await executeBatchScan({ 
  includeDue: true 
});

console.log(result);
// {
//   totalProcessed: 3,
//   successful: 3,
//   failed: 0,
//   results: [...]
// }
```

---

## API Endpoint

**POST** `/api/scans/execute`

**Auth:** Master role required

**Body:**
```json
{
  "clientId": 123          // Single client
}
```

Or:
```json
{
  "clientIds": [123, 124]  // Multiple clients
}
```

Or:
```json
{
  "scanDue": true          // All clients due for scan
}
```

**Response:**
```json
{
  "success": true,
  "scanId": 456,
  "healthScore": 72,
  "alertsGenerated": 5,
  "tasksCreated": 3,
  "errors": []
}
```

---

## Scan Frequency

Set on `ClientProfile.scanFrequency`:
- `"weekly"` - Scan every 7 days
- `"biweekly"` - Scan every 14 days (default)
- `"monthly"` - Scan every 30 days

After each scan, `ClientProfile.nextScanAt` is automatically updated.

---

## What Gets Scanned

### Client Metrics
- Domain Rating (Ahrefs)
- Backlinks count (Ahrefs)
- Review count + average (Outscraper)
- Site speed mobile/desktop (PageSpeed)
- Organic traffic estimate (Ahrefs)
- Rankings (TODO: keyword tracking integration)

### Competitor Metrics
Same metrics for all active competitors in `ClientCompetitor` table.

---

## Generated Outputs

### 1. CompetitiveScan Record
Stored in `competitive_scans` table with:
- `clientData` - Current client metrics
- `competitors` - Current competitor metrics
- `deltas` - Historical changes + competitive gaps
- `alerts` - Significant changes requiring attention
- `healthScore` - Calculated 0-100 score
- `apiCosts` - API usage tracking

### 2. Alerts
Generated for significant changes:
- **Critical** - >20% decline, lost top 3 ranking
- **Warning** - 10-20% decline, dropped 5+ positions
- **Info** - Positive changes, minor fluctuations

### 3. Tasks
Auto-created from actionable alerts in `client_tasks` with:
- `source: "competitive-scan"`
- `scanId` - Links back to scan
- `category` - link-building, review-mgmt, content, technical-seo, competitive-response
- `priority` - P1, P2, P3
- `status: "queued"`

### 4. Health Score
0-100 score based on:
- Domain authority (20%)
- Reviews (20%)
- Site speed (15%)
- Momentum (25%) - historical trends
- Competitive position (20%)

Updates `ClientProfile.healthScore`.

---

## Workflow Integration

### Automated Scanning (Recommended)

Set up a cron job or background worker:

```typescript
// Example: Daily cron at 2 AM
import { executeBatchScan } from '@/lib/competitive-scan';

export async function dailyScanJob() {
  console.log('[Cron] Running daily competitive scans...');
  
  const result = await executeBatchScan({ includeDue: true });
  
  console.log(`[Cron] Complete: ${result.successful} scanned, ${result.failed} failed`);
  
  return result;
}
```

### Manual Trigger (Dashboard UI)

Add a "Run Scan" button on client profile:

```typescript
async function runScanNow(clientId: number) {
  const res = await fetch('/api/scans/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  });
  
  const result = await res.json();
  
  if (result.success) {
    toast.success(`Scan complete! Health: ${result.healthScore}, ${result.tasksCreated} tasks created`);
  }
}
```

---

## API Cost Tracking

Each scan records API costs in `CompetitiveScan.apiCosts`:

```json
{
  "outscraper": 0.50,     // ~$0.10 per GMB lookup
  "ahrefs": 0.03,         // ~$0.01 per domain lookup
  "pagespeed": 0.00,      // Free API
  "total": 0.53,
  "calls": {
    "outscraper": 5,
    "ahrefs": 3,
    "pagespeed": 2
  }
}
```

**Estimated costs per scan:**
- Client + 3 competitors = ~$0.40-0.60
- Weekly scans (52/year) = ~$20-30/year per client
- Monthly scans (12/year) = ~$5-7/year per client

---

## Viewing Scan Results

### Get Latest Scan
```typescript
const scan = await prisma.competitiveScan.findFirst({
  where: { clientId: 123 },
  orderBy: { scanDate: 'desc' },
});

const alerts = scan.alerts as Alert[];
const deltas = scan.deltas as Deltas;
```

### Get Scan History
```typescript
const history = await prisma.competitiveScan.findMany({
  where: { clientId: 123 },
  orderBy: { scanDate: 'desc' },
  take: 10,
});
```

### Get Tasks Created by Scans
```typescript
const tasks = await prisma.clientTask.findMany({
  where: {
    clientId: 123,
    source: 'competitive-scan',
  },
  orderBy: { createdAt: 'desc' },
});
```

---

## Troubleshooting

### Scan Failed
Check `errors` array in result:
```typescript
const result = await executeScan({ clientId: 123 });
if (!result.success) {
  console.error('Scan errors:', result.errors);
}
```

### No Alerts Generated
- This is normal if no significant changes occurred
- First scan has no `vs_previous` data, only `vs_competitors`

### No Tasks Created
- Only actionable alerts with `taskSuggestion` generate tasks
- Check alert severity thresholds in `alert-generator.ts`

### API Rate Limits
- Batch scans include 2-second pauses between clients
- Adjust `timeout` in API calls if needed

---

## Next Features

**TODO:**
- [ ] Keyword tracking integration
- [ ] Email notifications for critical alerts
- [ ] Scan history visualization UI
- [ ] Competitive intelligence dashboard
- [ ] Automated cron job setup
- [ ] Scan comparison view (month-over-month)

---

**Version:** 1.0.0  
**Created:** 2026-02-15  
**Status:** Production Ready
