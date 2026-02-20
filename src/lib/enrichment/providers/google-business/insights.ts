import { GBPClient, PERF_BASE } from './client'

export interface DailyInsight {
  date:                string   // YYYY-MM-DD
  impressionsDesktop:  number
  impressionsMobile:   number
  websiteClicks:       number
  callClicks:          number
  directionRequests:   number
}

export interface GBPInsights {
  daily:    DailyInsight[]
  keywords: SearchKeyword[]
}

export interface SearchKeyword {
  keyword:           string
  monthlyImpressions: number
  month:             string   // YYYY-MM
}

const DAILY_METRICS = [
  'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
  'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
  'WEBSITE_CLICKS',
  'CALL_CLICKS',
  'BUSINESS_DIRECTION_REQUESTS',
]

function dateParams(daysBack = 90) {
  const end   = new Date()
  const start = new Date(Date.now() - daysBack * 86400 * 1000)
  const fmt   = (d: Date) => ({
    year:  d.getFullYear(),
    month: d.getMonth() + 1,
    day:   d.getDate(),
  })
  return { start: fmt(start), end: fmt(end) }
}

export async function fetchInsights(
  gbp: GBPClient,
  daysBack = 90
): Promise<GBPInsights> {
  const { start, end } = dateParams(daysBack)

  // Build query for multi-metric fetch (single request)
  const params = new URLSearchParams()
  for (const m of DAILY_METRICS) params.append('dailyMetrics', m)
  params.set('dailyRange.start_date.year',  String(start.year))
  params.set('dailyRange.start_date.month', String(start.month))
  params.set('dailyRange.start_date.day',   String(start.day))
  params.set('dailyRange.end_date.year',    String(end.year))
  params.set('dailyRange.end_date.month',   String(end.month))
  params.set('dailyRange.end_date.day',     String(end.day))

  const url = `${PERF_BASE}/${gbp.locationId}:fetchMultiDailyMetricsTimeSeries?${params}`
  const res  = await gbp.get(url)

  if (!res.ok) {
    console.error('[GBP insights]', res.status, await res.text())
    return { daily: [], keywords: [] }
  }

  const data = await res.json()
  const series: Record<string, Record<string, number>> = {}

  for (const item of data.multiDailyMetricTimeSeries ?? []) {
    const metric = item.dailyMetric as string
    for (const ts of item.dailyMetricTimeSeries?.timeSeries?.datedValues ?? []) {
      const dateKey = `${ts.date.year}-${String(ts.date.month).padStart(2,'0')}-${String(ts.date.day).padStart(2,'0')}`
      if (!series[dateKey]) series[dateKey] = {}
      series[dateKey][metric] = Number(ts.value ?? 0)
    }
  }

  const daily: DailyInsight[] = Object.entries(series)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, m]) => ({
      date,
      impressionsDesktop:
        (m['BUSINESS_IMPRESSIONS_DESKTOP_MAPS'] ?? 0) +
        (m['BUSINESS_IMPRESSIONS_DESKTOP_SEARCH'] ?? 0),
      impressionsMobile:
        (m['BUSINESS_IMPRESSIONS_MOBILE_MAPS'] ?? 0) +
        (m['BUSINESS_IMPRESSIONS_MOBILE_SEARCH'] ?? 0),
      websiteClicks:     m['WEBSITE_CLICKS'] ?? 0,
      callClicks:        m['CALL_CLICKS'] ?? 0,
      directionRequests: m['BUSINESS_DIRECTION_REQUESTS'] ?? 0,
    }))

  // Monthly search keywords
  const kwRes = await gbp.get(
    `${PERF_BASE}/${gbp.locationId}/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${start.year}&monthlyRange.start_month.month=${start.month}&monthlyRange.end_month.year=${end.year}&monthlyRange.end_month.month=${end.month}`
  )

  let keywords: SearchKeyword[] = []
  if (kwRes.ok) {
    const kwData = await kwRes.json()
    keywords = (kwData.searchKeywordsCounts ?? []).map((k: any) => ({
      keyword:            k.searchKeyword,
      monthlyImpressions: Number(k.insightsValue?.value ?? 0),
      month: `${k.insightsValue?.threshold ? 'threshold' : `${end.year}-${String(end.month).padStart(2,'0')}`}`,
    }))
  }

  return { daily, keywords }
}
