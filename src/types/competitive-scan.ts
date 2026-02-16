/**
 * Competitive Scan Type Definitions
 * 
 * TypeScript interfaces for CompetitiveScan Json fields.
 * These types provide structure and type safety for scan data.
 */

// ============================================================================
// Client Data
// ============================================================================

export interface ClientData {
  domainRating: number;
  reviewCount: number;
  reviewAvg: number;
  siteSpeedMobile: number;
  siteSpeedDesktop: number;
  backlinks: number;
  rankings: Record<string, number>;
  organicTraffic?: number;
  topPages?: Array<{
    url: string;
    traffic: number;
  }>;
}

// ============================================================================
// Competitor Data
// ============================================================================

export interface CompetitorData {
  businessName: string;
  domain: string;
  googlePlaceId?: string;
  domainRating: number;
  reviewCount: number;
  reviewAvg: number;
  siteSpeedMobile: number;
  siteSpeedDesktop: number;
  backlinks: number;
  rankings: Record<string, number>;
  organicTraffic?: number;
}

export type Competitors = CompetitorData[];

// ============================================================================
// Deltas
// ============================================================================

export interface MetricDelta {
  old: number;
  new: number;
  delta: number;
  percentChange: number;
}

export interface CompetitorGap {
  client: number;
  competitor: number;
  gap: number;
}

export interface Deltas {
  vs_previous: {
    domainRating?: MetricDelta;
    reviewCount?: MetricDelta;
    reviewAvg?: MetricDelta;
    siteSpeedMobile?: MetricDelta;
    siteSpeedDesktop?: MetricDelta;
    backlinks?: MetricDelta;
    rankings?: Record<string, MetricDelta>;
  } | null;
  
  vs_competitors: Record<string, {
    domainRating: CompetitorGap;
    reviewCount: CompetitorGap;
    reviewAvg: CompetitorGap;
    siteSpeedMobile: CompetitorGap;
    siteSpeedDesktop: CompetitorGap;
    backlinks: CompetitorGap;
    rankings?: Record<string, CompetitorGap>;
  }>;
  
  position_changes?: {
    improved: string[];
    declined: string[];
    new_rankings: string[];
    lost_rankings: string[];
  };
}

// ============================================================================
// Alerts
// ============================================================================

export type AlertType =
  | 'ranking_drop'
  | 'ranking_gain'
  | 'competitor_gain'
  | 'review_decline'
  | 'speed_degradation'
  | 'backlink_loss'
  | 'gap_widening'
  | 'gap_closing';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface TaskSuggestion {
  title: string;
  category: string;
  description: string;
  priority: string;
}

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  keyword?: string;
  competitor?: string;
  message: string;
  oldValue: number;
  newValue: number;
  delta: number;
  actionable: boolean;
  taskSuggestion?: TaskSuggestion;
}

export type Alerts = Alert[];

// ============================================================================
// API Costs
// ============================================================================

export interface ApiCosts {
  outscraper: number;
  ahrefs: number;
  pagespeed: number;
  total: number;
  calls: {
    outscraper: number;
    ahrefs: number;
    pagespeed: number;
  };
}
