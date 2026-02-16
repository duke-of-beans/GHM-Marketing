# Competitive Scan Schema

> Data structures for `CompetitiveScan` model Json fields

## Database Model

```prisma
model CompetitiveScan {
  id          Int      @id @default(autoincrement())
  clientId    Int      @map("client_id")
  scanDate    DateTime @default(now()) @map("scan_date")
  clientData  Json     @map("client_data")
  competitors Json
  deltas      Json
  alerts      Json
  healthScore Int      @map("health_score")
  apiCosts    Json?    @map("api_costs")
  status      String   @default("complete")
}
```

---

## 1. clientData (Json)

Current state of the client's metrics at scan time.

```typescript
interface ClientData {
  domainRating: number;           // Ahrefs DR (0-100)
  reviewCount: number;            // Google Business reviews
  reviewAvg: number;              // Average rating (0-5)
  siteSpeedMobile: number;        // PageSpeed score (0-100)
  siteSpeedDesktop: number;       // PageSpeed score (0-100)
  backlinks: number;              // Total backlink count
  rankings: {
    [keyword: string]: number;    // Keyword -> rank position (1-100)
  };
  organicTraffic?: number;        // Estimated monthly organic traffic
  topPages?: Array<{
    url: string;
    traffic: number;
  }>;
}
```


**Example:**
```json
{
  "domainRating": 42,
  "reviewCount": 156,
  "reviewAvg": 4.7,
  "siteSpeedMobile": 78,
  "siteSpeedDesktop": 92,
  "backlinks": 1842,
  "rankings": {
    "plumber los angeles": 12,
    "emergency plumbing LA": 8,
    "water heater repair": 23
  }
}
```

---

## 2. competitors (Json)

Array of tracked competitor metrics at scan time.

```typescript
interface CompetitorData {
  businessName: string;
  domain: string;
  googlePlaceId?: string;
  domainRating: number;
  reviewCount: number;
  reviewAvg: number;
  siteSpeedMobile: number;
  siteSpeedDesktop: number;
  backlinks: number;
  rankings: {
    [keyword: string]: number;
  };
  organicTraffic?: number;
}

type Competitors = CompetitorData[];
```


**Example:**
```json
[
  {
    "businessName": "Ace Plumbing Co",
    "domain": "aceplumbing.com",
    "domainRating": 58,
    "reviewCount": 289,
    "reviewAvg": 4.9,
    "siteSpeedMobile": 85,
    "siteSpeedDesktop": 94,
    "backlinks": 3421,
    "rankings": {
      "plumber los angeles": 3,
      "emergency plumbing LA": 5,
      "water heater repair": 7
    }
  }
]
```

---

## 3. deltas (Json)

```typescript
interface MetricDelta {
  old: number;
  new: number;
  delta: number;
  percentChange: number;
}

interface CompetitorGap {
  client: number;
  competitor: number;
  gap: number;
}

interface Deltas {
  vs_previous: {
    domainRating?: MetricDelta;
    reviewCount?: MetricDelta;
    reviewAvg?: MetricDelta;
    rankings?: {
      [keyword: string]: MetricDelta;
    };
  } | null;
  vs_competitors: {
    [competitorName: string]: {
      domainRating: CompetitorGap;
      reviewCount: CompetitorGap;
      rankings?: {
        [keyword: string]: CompetitorGap;
      };
    };
  };
}
```


---

## 4. alerts (Json)

```typescript
interface Alert {
  type: 'ranking_drop' | 'ranking_gain' | 'competitor_gain' | 'review_decline' | 'speed_degradation' | 'gap_widening' | 'gap_closing';
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  keyword?: string;
  competitor?: string;
  message: string;
  oldValue: number;
  newValue: number;
  delta: number;
  actionable: boolean;
  taskSuggestion?: {
    title: string;
    category: string;
    description: string;
    priority: string;
  };
}

type Alerts = Alert[];
```

**Example:**
```json
[
  {
    "type": "competitor_gain",
    "severity": "warning",
    "metric": "reviewCount",
    "competitor": "Ace Plumbing Co",
    "message": "Ace Plumbing Co gained 45 reviews, widening gap to 133",
    "oldValue": 244,
    "newValue": 289,
    "delta": 45,
    "actionable": true,
    "taskSuggestion": {
      "title": "Launch review generation campaign",
      "category": "review-mgmt",
      "description": "Competitor gained reviews. Implement automated review requests.",
      "priority": "P2"
    }
  }
]
```

---

**Version:** 1.0.0  
**Purpose:** Schema documentation for Competitive Scan Engine Phase 2
