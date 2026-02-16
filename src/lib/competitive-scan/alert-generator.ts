/**
 * Competitive Scan Alert Generator
 * 
 * Transforms deltas into actionable alerts based on significance thresholds.
 * Determines severity and suggests tasks for competitive gaps.
 */

import type {
  Deltas,
  Alert,
  Alerts,
  AlertType,
  AlertSeverity,
  TaskSuggestion,
} from '@/types/competitive-scan';

// ============================================================================
// Threshold Configuration
// ============================================================================

const THRESHOLDS = {
  // Percent change thresholds
  CRITICAL_DECLINE: -20,  // -20% or worse
  WARNING_DECLINE: -10,   // -10% to -20%
  MINOR_CHANGE: 5,        // ±5%
  WARNING_GAIN: 15,       // +15% or more
  CRITICAL_GAIN: 25,      // +25% or more
  
  // Absolute value thresholds
  RANKING_DROP_CRITICAL: 10,    // Lost 10+ positions
  RANKING_DROP_WARNING: 5,      // Lost 5-9 positions
  RANKING_GAIN_INFO: 3,         // Gained 3+ positions
  
  REVIEW_GAP_CRITICAL: 200,     // 200+ review gap
  REVIEW_GAP_WARNING: 100,      // 100-199 review gap
  
  DR_GAP_CRITICAL: 30,          // 30+ DR gap
  DR_GAP_WARNING: 15,           // 15-29 DR gap
} as const;


// ============================================================================
// Core Alert Generator
// ============================================================================

export function generateAlerts(deltas: Deltas): Alerts {
  const alerts: Alerts = [];
  
  // Generate alerts from historical changes (vs_previous)
  if (deltas.vs_previous) {
    alerts.push(...generateHistoricalAlerts(deltas.vs_previous));
  }
  
  // Generate alerts from competitive gaps (vs_competitors)
  alerts.push(...generateCompetitiveAlerts(deltas.vs_competitors));
  
  // Generate alerts from position changes (rankings)
  if (deltas.position_changes) {
    alerts.push(...generatePositionAlerts(deltas.position_changes));
  }
  
  return alerts;
}

// ============================================================================
// Historical Change Alerts
// ============================================================================

function generateHistoricalAlerts(vs_previous: NonNullable<Deltas['vs_previous']>): Alerts {
  const alerts: Alerts = [];
  
  // Domain Rating changes
  if (vs_previous.domainRating) {
    const dr = vs_previous.domainRating;
    if (dr.percentChange <= THRESHOLDS.CRITICAL_DECLINE) {
      alerts.push(createAlert({
        type: 'backlink_loss',
        severity: 'critical',
        metric: 'domainRating',
        message: `Domain Rating dropped ${Math.abs(dr.percentChange).toFixed(1)}% (${dr.old} → ${dr.new})`,
        oldValue: dr.old,
        newValue: dr.new,
        delta: dr.delta,
        actionable: true,
        taskSuggestion: {
          title: 'Investigate backlink loss',
          category: 'link-building',
          description: 'DR dropped significantly. Audit backlink profile for toxic or lost links.',
          priority: 'P1',
        },
      }));
    } else if (dr.percentChange >= THRESHOLDS.WARNING_GAIN) {
      alerts.push(createAlert({
        type: 'gap_closing',
        severity: 'info',
        metric: 'domainRating',
        message: `Domain Rating improved ${dr.percentChange.toFixed(1)}% (${dr.old} → ${dr.new})`,
        oldValue: dr.old,
        newValue: dr.new,
        delta: dr.delta,
        actionable: false,
      }));
    }
  }
  
  // Review changes
  if (vs_previous.reviewCount) {
    const reviews = vs_previous.reviewCount;
    if (reviews.delta < 0) {
      alerts.push(createAlert({
        type: 'review_decline',
        severity: Math.abs(reviews.delta) > 10 ? 'warning' : 'info',
        metric: 'reviewCount',
        message: `Lost ${Math.abs(reviews.delta)} reviews (${reviews.old} → ${reviews.new})`,
        oldValue: reviews.old,
        newValue: reviews.new,
        delta: reviews.delta,
        actionable: true,
        taskSuggestion: {
          title: 'Address negative reviews',
          category: 'review-mgmt',
          description: 'Review count dropped. Check for recent negative reviews that may have been removed or complaints.',
          priority: 'P2',
        },
      }));
    }
  }
  
  // Site speed degradation
  if (vs_previous.siteSpeedMobile && vs_previous.siteSpeedMobile.percentChange <= THRESHOLDS.WARNING_DECLINE) {
    const speed = vs_previous.siteSpeedMobile;
    alerts.push(createAlert({
      type: 'speed_degradation',
      severity: 'warning',
      metric: 'siteSpeedMobile',
      message: `Mobile speed score dropped ${Math.abs(speed.percentChange).toFixed(1)}% (${speed.old} → ${speed.new})`,
      oldValue: speed.old,
      newValue: speed.new,
      delta: speed.delta,
      actionable: true,
      taskSuggestion: {
        title: 'Optimize mobile performance',
        category: 'technical-seo',
        description: 'Site speed degraded. Audit for new scripts, unoptimized images, or hosting issues.',
        priority: 'P2',
      },
    }));
  }
  
  return alerts;
}


// ============================================================================
// Competitive Gap Alerts
// ============================================================================

function generateCompetitiveAlerts(vs_competitors: Deltas['vs_competitors']): Alerts {
  const alerts: Alerts = [];
  
  Object.entries(vs_competitors).forEach(([compName, gaps]) => {
    // Review gap alerts
    if (gaps.reviewCount.gap >= THRESHOLDS.REVIEW_GAP_CRITICAL) {
      alerts.push(createAlert({
        type: 'competitor_gain',
        severity: 'critical',
        metric: 'reviewCount',
        competitor: compName,
        message: `${compName} has ${gaps.reviewCount.gap} more reviews (${gaps.reviewCount.client} vs ${gaps.reviewCount.competitor})`,
        oldValue: gaps.reviewCount.client,
        newValue: gaps.reviewCount.competitor,
        delta: gaps.reviewCount.gap,
        actionable: true,
        taskSuggestion: {
          title: 'Launch aggressive review campaign',
          category: 'review-mgmt',
          description: `Major review gap with ${compName}. Implement automated review requests and incentive program.`,
          priority: 'P1',
        },
      }));
    } else if (gaps.reviewCount.gap >= THRESHOLDS.REVIEW_GAP_WARNING) {
      alerts.push(createAlert({
        type: 'competitor_gain',
        severity: 'warning',
        metric: 'reviewCount',
        competitor: compName,
        message: `${compName} has ${gaps.reviewCount.gap} more reviews`,
        oldValue: gaps.reviewCount.client,
        newValue: gaps.reviewCount.competitor,
        delta: gaps.reviewCount.gap,
        actionable: true,
        taskSuggestion: {
          title: 'Increase review generation',
          category: 'review-mgmt',
          description: `Review gap with ${compName}. Implement post-service review requests.`,
          priority: 'P2',
        },
      }));
    }
    
    // Domain Rating gap alerts
    if (gaps.domainRating.gap >= THRESHOLDS.DR_GAP_CRITICAL) {
      alerts.push(createAlert({
        type: 'gap_widening',
        severity: 'warning',
        metric: 'domainRating',
        competitor: compName,
        message: `${compName} has ${gaps.domainRating.gap} higher DR (${gaps.domainRating.client} vs ${gaps.domainRating.competitor})`,
        oldValue: gaps.domainRating.client,
        newValue: gaps.domainRating.competitor,
        delta: gaps.domainRating.gap,
        actionable: true,
        taskSuggestion: {
          title: 'Accelerate link building',
          category: 'link-building',
          description: `Significant DR gap with ${compName}. Focus on high-authority backlink acquisition.`,
          priority: 'P2',
        },
      }));
    }
  });
  
  return alerts;
}

// ============================================================================
// Position Change Alerts
// ============================================================================


function generatePositionAlerts(changes: NonNullable<Deltas['position_changes']>): Alerts {
  const alerts: Alerts = [];
  
  // Alert on new rankings (positive)
  if (changes.new_rankings.length > 0) {
    alerts.push(createAlert({
      type: 'ranking_gain',
      severity: 'info',
      metric: 'rankings',
      message: `Now ranking for ${changes.new_rankings.length} new keywords: ${changes.new_rankings.slice(0, 3).join(', ')}${changes.new_rankings.length > 3 ? '...' : ''}`,
      oldValue: 0,
      newValue: changes.new_rankings.length,
      delta: changes.new_rankings.length,
      actionable: false,
    }));
  }
  
  // Alert on lost rankings (negative)
  if (changes.lost_rankings.length > 0) {
    alerts.push(createAlert({
      type: 'ranking_drop',
      severity: changes.lost_rankings.length >= 5 ? 'critical' : 'warning',
      metric: 'rankings',
      message: `Lost rankings for ${changes.lost_rankings.length} keywords: ${changes.lost_rankings.slice(0, 3).join(', ')}${changes.lost_rankings.length > 3 ? '...' : ''}`,
      oldValue: changes.lost_rankings.length,
      newValue: 0,
      delta: -changes.lost_rankings.length,
      actionable: true,
      taskSuggestion: {
        title: 'Recover lost rankings',
        category: 'content',
        description: `Lost rankings for ${changes.lost_rankings.length} keywords. Audit pages and refresh content.`,
        priority: changes.lost_rankings.length >= 5 ? 'P1' : 'P2',
      },
    }));
  }
  
  return alerts;
}

// ============================================================================
// Helper Function
// ============================================================================


interface CreateAlertParams {
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

function createAlert(params: CreateAlertParams): Alert {
  return {
    type: params.type,
    severity: params.severity,
    metric: params.metric,
    keyword: params.keyword,
    competitor: params.competitor,
    message: params.message,
    oldValue: params.oldValue,
    newValue: params.newValue,
    delta: params.delta,
    actionable: params.actionable,
    taskSuggestion: params.taskSuggestion,
  };
}
