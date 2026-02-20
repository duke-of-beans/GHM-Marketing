/**
 * Google Ads campaign + keyword performance
 * Read-only — reporting only, no mutations.
 */

import { getAdsClient } from './client'

export interface DateRange {
  startDate: string  // YYYY-MM-DD
  endDate:   string  // YYYY-MM-DD
}

export interface CampaignData {
  id:           string
  name:         string
  status:       string   // ENABLED | PAUSED | REMOVED
  spend:        number   // USD
  impressions:  number
  clicks:       number
  ctr:          number   // 0–1
  avgCpc:       number   // USD
  conversions:  number
  cpa:          number   // cost per conversion, USD
}

export interface AdKeywordData {
  keyword:     string
  matchType:   string   // BROAD | PHRASE | EXACT
  impressions: number
  clicks:      number
  ctr:         number
  cpc:         number   // avg cost per click, USD
  conversions: number
}

export interface AdsPerformanceData {
  campaigns:    CampaignData[]
  topKeywords:  AdKeywordData[]
  totals: {
    spend:       number
    impressions: number
    clicks:      number
    conversions: number
  }
  dateRange: DateRange
  accountName: string
}

/** GAQL query helper — uses searchStream endpoint */
async function runQuery(client: Awaited<ReturnType<typeof getAdsClient>>, gaql: string) {
  if (!client) return []

  const res = await client.post(
    `/customers/${client.customerId}/googleAds:searchStream`,
    { query: gaql }
  )

  if (!res.ok) {
    console.error(`[google-ads] query failed: ${await res.text()}`)
    return []
  }

  // searchStream returns newline-delimited JSON objects
  const text = await res.text()
  const results: unknown[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === '[' || trimmed === ']') continue
    try {
      const parsed = JSON.parse(trimmed.replace(/,$/, ''))
      if (parsed.results) results.push(...parsed.results)
    } catch { /* skip malformed lines */ }
  }
  return results as Record<string, Record<string, unknown>>[]
}

export async function getCampaignPerformance(
  clientId: number,
  dateRange: DateRange
): Promise<AdsPerformanceData | null> {
  const client = await getAdsClient(clientId)
  if (!client) return null

  const { startDate, endDate } = dateRange

  // Campaign-level metrics
  const campaignRows = await runQuery(client, `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 20
  `)

  const campaigns: CampaignData[] = campaignRows.map((row) => {
    const c = row.campaign as Record<string, unknown>
    const m = row.metrics as Record<string, unknown>
    const spend = Number(m.costMicros ?? 0) / 1_000_000
    const conversions = Number(m.conversions ?? 0)
    return {
      id:          String(c.id),
      name:        String(c.name),
      status:      String(c.status),
      spend,
      impressions: Number(m.impressions ?? 0),
      clicks:      Number(m.clicks ?? 0),
      ctr:         Number(m.ctr ?? 0),
      avgCpc:      Number(m.averageCpc ?? 0) / 1_000_000,
      conversions,
      cpa:         conversions > 0 ? spend / conversions : 0,
    }
  })

  // Keyword-level metrics (top 10 by clicks)
  const kwRows = await runQuery(client, `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions
    FROM keyword_view
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND ad_group_criterion.status != 'REMOVED'
    ORDER BY metrics.clicks DESC
    LIMIT 10
  `)

  const topKeywords: AdKeywordData[] = kwRows.map((row) => {
    const kw = (row.adGroupCriterion as Record<string, unknown>)?.keyword as Record<string, unknown> ?? {}
    const m  = row.metrics as Record<string, unknown>
    return {
      keyword:     String(kw.text ?? ''),
      matchType:   String(kw.matchType ?? ''),
      impressions: Number(m.impressions ?? 0),
      clicks:      Number(m.clicks ?? 0),
      ctr:         Number(m.ctr ?? 0),
      cpc:         Number(m.averageCpc ?? 0) / 1_000_000,
      conversions: Number(m.conversions ?? 0),
    }
  })

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend:       acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks:      acc.clicks + c.clicks,
      conversions: acc.conversions + c.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  )

  return { campaigns, topKeywords, totals, dateRange, accountName: client.accountName }
}
