/**
 * Competitive Scan Delta Calculator
 * 
 * Compares current scan data vs previous scan to identify changes.
 * Calculates gaps between client and competitors.
 */

import type {
  ClientData,
  CompetitorData,
  Competitors,
  Deltas,
  MetricDelta,
  CompetitorGap,
} from '@/types/competitive-scan';
import { prisma } from '@/lib/db';

// ============================================================================
// Helper Functions
// ============================================================================

function calculateDelta(oldValue: number, newValue: number): MetricDelta {
  const delta = newValue - oldValue;
  const percentChange = oldValue > 0 ? ((delta / oldValue) * 100) : 0;
  
  return {
    old: oldValue,
    new: newValue,
    delta,
    percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal
  };
}

function calculateGap(clientValue: number, competitorValue: number): CompetitorGap {
  return {
    client: clientValue,
    competitor: competitorValue,
    gap: competitorValue - clientValue, // Positive = we're behind
  };
}


// ============================================================================
// Core Delta Calculator
// ============================================================================

interface CalculateDeltasParams {
  clientId: number;
  currentClientData: ClientData;
  currentCompetitors: Competitors;
}

export async function calculateDeltas(params: CalculateDeltasParams): Promise<Deltas> {
  const { clientId, currentClientData, currentCompetitors } = params;
  
  // Fetch previous scan
  const previousScan = await prisma.competitiveScan.findFirst({
    where: { clientId },
    orderBy: { scanDate: 'desc' },
    select: {
      clientData: true,
      competitors: true,
    },
  });
  
  // Calculate vs_previous deltas
  const vs_previous = previousScan
    ? calculateHistoricalDeltas(previousScan.clientData as ClientData, currentClientData)
    : null;
  
  // Calculate vs_competitors gaps
  const vs_competitors = calculateCompetitiveGaps(currentClientData, currentCompetitors);
  
  // Calculate position changes (for rankings)
  const position_changes = previousScan
    ? calculatePositionChanges(
        (previousScan.clientData as ClientData).rankings,
        currentClientData.rankings
      )
    : undefined;
  
  return {
    vs_previous,
    vs_competitors,
    position_changes,
  };
}


// ============================================================================
// Historical Delta Calculation
// ============================================================================

function calculateHistoricalDeltas(
  previous: ClientData,
  current: ClientData
): Deltas['vs_previous'] {
  const result: Deltas['vs_previous'] = {
    domainRating: calculateDelta(previous.domainRating, current.domainRating),
    reviewCount: calculateDelta(previous.reviewCount, current.reviewCount),
    reviewAvg: calculateDelta(previous.reviewAvg, current.reviewAvg),
    siteSpeedMobile: calculateDelta(previous.siteSpeedMobile, current.siteSpeedMobile),
    siteSpeedDesktop: calculateDelta(previous.siteSpeedDesktop, current.siteSpeedDesktop),
    backlinks: calculateDelta(previous.backlinks, current.backlinks),
  };
  
  // Calculate ranking deltas for tracked keywords
  const rankingDeltas: Record<string, MetricDelta> = {};
  const allKeywords = new Set([
    ...Object.keys(previous.rankings),
    ...Object.keys(current.rankings),
  ]);
  
  allKeywords.forEach(keyword => {
    const oldRank = previous.rankings[keyword] || 0;
    const newRank = current.rankings[keyword] || 0;
    
    if (oldRank > 0 || newRank > 0) {
      rankingDeltas[keyword] = calculateDelta(oldRank, newRank);
    }
  });
  
  if (Object.keys(rankingDeltas).length > 0) {
    result.rankings = rankingDeltas;
  }
  
  return result;
}


// ============================================================================
// Competitive Gap Calculation
// ============================================================================

function calculateCompetitiveGaps(
  client: ClientData,
  competitors: Competitors
): Deltas['vs_competitors'] {
  const result: Deltas['vs_competitors'] = {};
  
  competitors.forEach(comp => {
    result[comp.businessName] = {
      domainRating: calculateGap(client.domainRating, comp.domainRating),
      reviewCount: calculateGap(client.reviewCount, comp.reviewCount),
      reviewAvg: calculateGap(client.reviewAvg, comp.reviewAvg),
      siteSpeedMobile: calculateGap(client.siteSpeedMobile, comp.siteSpeedMobile),
      siteSpeedDesktop: calculateGap(client.siteSpeedDesktop, comp.siteSpeedDesktop),
      backlinks: calculateGap(client.backlinks, comp.backlinks),
    };
    
    // Calculate ranking gaps for tracked keywords
    const rankingGaps: Record<string, CompetitorGap> = {};
    const allKeywords = new Set([
      ...Object.keys(client.rankings),
      ...Object.keys(comp.rankings),
    ]);
    
    allKeywords.forEach(keyword => {
      const clientRank = client.rankings[keyword] || 0;
      const compRank = comp.rankings[keyword] || 0;
      
      if (clientRank > 0 || compRank > 0) {
        rankingGaps[keyword] = calculateGap(clientRank, compRank);
      }
    });
    
    if (Object.keys(rankingGaps).length > 0) {
      result[comp.businessName].rankings = rankingGaps;
    }
  });
  
  return result;
}


// ============================================================================
// Position Changes Calculator
// ============================================================================

function calculatePositionChanges(
  previousRankings: Record<string, number>,
  currentRankings: Record<string, number>
): Deltas['position_changes'] {
  const improved: string[] = [];
  const declined: string[] = [];
  const new_rankings: string[] = [];
  const lost_rankings: string[] = [];
  
  const allKeywords = new Set([
    ...Object.keys(previousRankings),
    ...Object.keys(currentRankings),
  ]);
  
  allKeywords.forEach(keyword => {
    const oldRank = previousRankings[keyword];
    const newRank = currentRankings[keyword];
    
    if (!oldRank && newRank) {
      // We now rank for this keyword
      new_rankings.push(keyword);
    } else if (oldRank && !newRank) {
      // We lost ranking for this keyword
      lost_rankings.push(keyword);
    } else if (oldRank && newRank) {
      // Note: Lower rank number = better position
      if (newRank < oldRank) {
        improved.push(keyword);
      } else if (newRank > oldRank) {
        declined.push(keyword);
      }
    }
  });
  
  return {
    improved,
    declined,
    new_rankings,
    lost_rankings,
  };
}
