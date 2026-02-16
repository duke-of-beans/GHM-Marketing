/**
 * Competitive Scan Health Score Calculator
 * 
 * Calculates client health score (0-100) based on scan metrics and competitive position.
 * Higher score = healthier competitive position.
 */

import type { ClientData, Deltas } from '@/types/competitive-scan';

// ============================================================================
// Health Score Weights
// ============================================================================

const WEIGHTS = {
  DOMAIN_AUTHORITY: 0.20,    // 20%
  REVIEWS: 0.20,             // 20%
  SITE_SPEED: 0.15,          // 15%
  MOMENTUM: 0.25,            // 25%
  COMPETITIVE_POSITION: 0.20, // 20%
} as const;

// ============================================================================
// Core Health Score Calculator
// ============================================================================

interface CalculateHealthScoreParams {
  clientData: ClientData;
  deltas: Deltas;
}

export function calculateHealthScore(params: CalculateHealthScoreParams): number {
  const { clientData, deltas } = params;
  
  let score = 50; // Start neutral
  
  // Component 1: Domain Authority (20%)
  score += calculateDomainAuthorityScore(clientData);
  
  // Component 2: Reviews (20%)
  score += calculateReviewScore(clientData);
  
  // Component 3: Site Speed (15%)
  score += calculateSpeedScore(clientData);
  
  // Component 4: Momentum (25%) - from deltas
  score += calculateMomentumScore(deltas);
  
  // Component 5: Competitive Position (20%)
  score += calculateCompetitivePositionScore(deltas);
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// Component Scorers
// ============================================================================

function calculateDomainAuthorityScore(client: ClientData): number {
  const dr = client.domainRating;
  const maxPoints = 100 * WEIGHTS.DOMAIN_AUTHORITY;
  
  // DR scoring curve
  if (dr >= 70) return maxPoints;           // Excellent
  if (dr >= 50) return maxPoints * 0.75;    // Good
  if (dr >= 30) return maxPoints * 0.50;    // Fair
  if (dr >= 15) return maxPoints * 0.25;    // Poor
  return 0;                                  // Critical
}

function calculateReviewScore(client: ClientData): number {
  const count = client.reviewCount;
  const avg = client.reviewAvg;
  const maxPoints = 100 * WEIGHTS.REVIEWS;
  
  // Reviews require both quantity and quality
  const quantityScore = count >= 200 ? 1.0 : count >= 100 ? 0.75 : count >= 50 ? 0.50 : count >= 20 ? 0.25 : 0;
  const qualityScore = avg >= 4.5 ? 1.0 : avg >= 4.0 ? 0.75 : avg >= 3.5 ? 0.50 : avg >= 3.0 ? 0.25 : 0;
  
  return maxPoints * ((quantityScore + qualityScore) / 2);
}


function calculateSpeedScore(client: ClientData): number {
  const mobile = client.siteSpeedMobile;
  const desktop = client.siteSpeedDesktop;
  const maxPoints = 100 * WEIGHTS.SITE_SPEED;
  
  // Average mobile and desktop, weight mobile more heavily
  const avgSpeed = (mobile * 0.6) + (desktop * 0.4);
  
  if (avgSpeed >= 90) return maxPoints;           // Excellent
  if (avgSpeed >= 75) return maxPoints * 0.75;    // Good
  if (avgSpeed >= 60) return maxPoints * 0.50;    // Fair
  if (avgSpeed >= 40) return maxPoints * 0.25;    // Poor
  return 0;                                        // Critical
}

function calculateMomentumScore(deltas: Deltas): number {
  const maxPoints = 100 * WEIGHTS.MOMENTUM;
  
  if (!deltas.vs_previous) {
    // First scan, no momentum data - return neutral
    return 0;
  }
  
  let momentumPoints = 0;
  const vp = deltas.vs_previous;
  
  // DR momentum (40% of momentum score)
  if (vp.domainRating) {
    const drDelta = vp.domainRating.delta;
    if (drDelta >= 5) momentumPoints += maxPoints * 0.40;
    else if (drDelta > 0) momentumPoints += maxPoints * 0.20;
    else if (drDelta < -5) momentumPoints -= maxPoints * 0.40;
    else if (drDelta < 0) momentumPoints -= maxPoints * 0.20;
  }
  
  // Review momentum (30% of momentum score)
  if (vp.reviewCount) {
    const reviewDelta = vp.reviewCount.delta;
    if (reviewDelta >= 20) momentumPoints += maxPoints * 0.30;
    else if (reviewDelta > 0) momentumPoints += maxPoints * 0.15;
    else if (reviewDelta < -10) momentumPoints -= maxPoints * 0.30;
  }
  
  // Ranking momentum (30% of momentum score)
  if (deltas.position_changes) {
    const improved = deltas.position_changes.improved.length;
    const declined = deltas.position_changes.declined.length;
    const netChange = improved - declined;
    
    if (netChange >= 5) momentumPoints += maxPoints * 0.30;
    else if (netChange > 0) momentumPoints += maxPoints * 0.15;
    else if (netChange <= -5) momentumPoints -= maxPoints * 0.30;
    else if (netChange < 0) momentumPoints -= maxPoints * 0.15;
  }
  
  return momentumPoints;
}

function calculateCompetitivePositionScore(deltas: Deltas): number {
  const maxPoints = 100 * WEIGHTS.COMPETITIVE_POSITION;
  
  // Calculate average gap across all competitors for key metrics
  const competitors = Object.values(deltas.vs_competitors);
  if (competitors.length === 0) return 0; // No competitors to compare
  
  const avgDRGap = competitors.reduce((sum, c) => sum + c.domainRating.gap, 0) / competitors.length;
  const avgReviewGap = competitors.reduce((sum, c) => sum + c.reviewCount.gap, 0) / competitors.length;
  
  let positionPoints = 0;
  
  // DR position (60% of position score)
  if (avgDRGap <= -10) positionPoints += maxPoints * 0.60;      // We're ahead
  else if (avgDRGap < 0) positionPoints += maxPoints * 0.40;    // Slightly ahead
  else if (avgDRGap <= 10) positionPoints += maxPoints * 0.20;  // Competitive
  else if (avgDRGap <= 25) positionPoints += 0;                 // Behind but catchable
  else positionPoints -= maxPoints * 0.30;                      // Significantly behind
  
  // Review position (40% of position score)
  if (avgReviewGap <= -50) positionPoints += maxPoints * 0.40;  // We're ahead
  else if (avgReviewGap < 0) positionPoints += maxPoints * 0.20; // Slightly ahead
  else if (avgReviewGap <= 50) positionPoints += maxPoints * 0.10; // Competitive
  else if (avgReviewGap <= 100) positionPoints += 0;            // Behind but catchable
  else positionPoints -= maxPoints * 0.20;                      // Significantly behind
  
  return positionPoints;
}
