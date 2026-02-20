/**
 * PPC Performance report section — Google Ads campaign data
 * Returns null if client has no Ads connection (report skips section gracefully).
 */

import { getCampaignPerformance, type AdsPerformanceData } from '@/lib/enrichment/providers/google-ads/campaigns'

export interface PPCSection {
  accountName:  string
  dateRange:    { startDate: string; endDate: string }
  totals: {
    spend:       number
    impressions: number
    clicks:      number
    conversions: number
    ctr:         number   // aggregate
    cpa:         number
  }
  campaigns: {
    name:        string
    status:      string
    spend:       number
    clicks:      number
    ctr:         number
    conversions: number
    cpa:         number
  }[]
  topKeywords: {
    keyword:     string
    matchType:   string
    clicks:      number
    ctr:         number
    cpc:         number
    conversions: number
  }[]
  hasData: boolean
}

export async function generatePPCSection(
  clientId: number,
  period: { startDate: string; endDate: string }
): Promise<PPCSection | null> {
  let data: AdsPerformanceData | null = null

  try {
    data = await getCampaignPerformance(clientId, period)
  } catch (err) {
    console.error(`[ppc-section] client ${clientId}:`, err)
    return null
  }

  if (!data) return null

  const { totals, campaigns, topKeywords, accountName, dateRange } = data

  const aggregateCtr =
    totals.impressions > 0 ? totals.clicks / totals.impressions : 0
  const aggregateCpa =
    totals.conversions > 0 ? totals.spend / totals.conversions : 0

  return {
    accountName,
    dateRange,
    totals: {
      spend:       totals.spend,
      impressions: totals.impressions,
      clicks:      totals.clicks,
      conversions: totals.conversions,
      ctr:         aggregateCtr,
      cpa:         aggregateCpa,
    },
    campaigns: campaigns.map((c) => ({
      name:        c.name,
      status:      c.status,
      spend:       c.spend,
      clicks:      c.clicks,
      ctr:         c.ctr,
      conversions: c.conversions,
      cpa:         c.cpa,
    })),
    topKeywords: topKeywords.map((k) => ({
      keyword:     k.keyword,
      matchType:   k.matchType,
      clicks:      k.clicks,
      ctr:         k.ctr,
      cpc:         k.cpc,
      conversions: k.conversions,
    })),
    hasData: campaigns.length > 0,
  }
}
