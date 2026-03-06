// src/lib/intel/delta-engine.ts
// Intelligence Engine — Sprint IE-02
// Metric-by-metric delta calculation, velocity classification, and
// basic threshold alert detection.
// Handles null previousSnapshot gracefully (first scan = no deltas).

export type VelocityDirection = "improving" | "stable" | "declining";

export interface MetricDelta {
  current: number;
  previous: number;
  absoluteChange: number;
  percentChange: number;
  velocity: VelocityDirection;
}

export interface DeltaResult {
  deltas: Record<string, MetricDelta> | null;
  velocity: Record<string, VelocityDirection> | null;
  alerts: ScanAlert[];
}

export interface ScanAlert {
  metricKey: string;
  severity: "warning" | "critical";
  message: string;
  currentValue: number;
  previousValue?: number;
  percentChange?: number;
}

// ── Threshold config — wired to vertical profiles in IE-03+ ─────────────────
// For now: conservative cross-vertical defaults used by the orchestrator.

interface ThresholdConfig {
  warning?: number;
  critical?: number;
  higherIsBetter: boolean;
}

const METRIC_THRESHOLDS: Record<string, ThresholdConfig> = {
  mobileScore: { warning: 50, critical: 30, higherIsBetter: true },
  desktopScore: { warning: 50, critical: 30, higherIsBetter: true },
  lcp: { warning: 2500, critical: 4000, higherIsBetter: false },
  cls: { warning: 0.1, critical: 0.25, higherIsBetter: false },
  fid: { warning: 100, critical: 300, higherIsBetter: false },
  domainRating: { higherIsBetter: true },
  referringDomains: { higherIsBetter: true },
  estimatedTraffic: { higherIsBetter: true },
};

// ── Velocity thresholds ─────────────────────────────────────────────────────

const VELOCITY_THRESHOLD_PCT = 5; // % change before classifying as improving/declining

function classifyVelocity(
  percentChange: number,
  higherIsBetter: boolean
): VelocityDirection {
  if (Math.abs(percentChange) < VELOCITY_THRESHOLD_PCT) return "stable";
  const isPositiveChange = percentChange > 0;
  // If higher is better: positive change = improving; else: negative change = improving
  return isPositiveChange === higherIsBetter ? "improving" : "declining";
}

// ── Alert generation ─────────────────────────────────────────────────────────

function generateAlerts(
  metrics: Record<string, unknown>
): ScanAlert[] {
  const alerts: ScanAlert[] = [];

  for (const [key, config] of Object.entries(METRIC_THRESHOLDS)) {
    const value = metrics[key];
    if (typeof value !== "number") continue;

    if (config.higherIsBetter) {
      if (config.critical !== undefined && value < config.critical) {
        alerts.push({
          metricKey: key,
          severity: "critical",
          message: `${key} is critically low at ${value} (threshold: ${config.critical})`,
          currentValue: value,
        });
      } else if (config.warning !== undefined && value < config.warning) {
        alerts.push({
          metricKey: key,
          severity: "warning",
          message: `${key} is below warning threshold: ${value} (threshold: ${config.warning})`,
          currentValue: value,
        });
      }
    } else {
      // Lower is better (LCP, CLS, FID)
      if (config.critical !== undefined && value > config.critical) {
        alerts.push({
          metricKey: key,
          severity: "critical",
          message: `${key} is critically high at ${value} (threshold: ${config.critical})`,
          currentValue: value,
        });
      } else if (config.warning !== undefined && value > config.warning) {
        alerts.push({
          metricKey: key,
          severity: "warning",
          message: `${key} exceeds warning threshold: ${value} (threshold: ${config.warning})`,
          currentValue: value,
        });
      }
    }
  }

  return alerts;
}

// ── Delta generation (requires two snapshots) ────────────────────────────────

function generateDeltas(
  current: Record<string, unknown>,
  previous: Record<string, unknown>
): { deltas: Record<string, MetricDelta>; velocity: Record<string, VelocityDirection>; alerts: ScanAlert[] } {
  const deltas: Record<string, MetricDelta> = {};
  const velocity: Record<string, VelocityDirection> = {};
  const alerts: ScanAlert[] = [];

  // Union of all numeric keys in both snapshots
  const keys = new Set([
    ...Object.keys(current),
    ...Object.keys(previous),
  ]);

  for (const key of keys) {
    const cur = current[key];
    const prev = previous[key];
    if (typeof cur !== "number" || typeof prev !== "number") continue;
    if (prev === 0) continue; // Can't compute % change from zero

    const absoluteChange = cur - prev;
    const percentChange = (absoluteChange / Math.abs(prev)) * 100;
    const thresholdConfig = METRIC_THRESHOLDS[key];
    const higherIsBetter = thresholdConfig?.higherIsBetter ?? true;
    const vel = classifyVelocity(percentChange, higherIsBetter);

    deltas[key] = { current: cur, previous: prev, absoluteChange, percentChange, velocity: vel };
    velocity[key] = vel;

    // Generate delta-based alerts for significant declines
    if (vel === "declining" && Math.abs(percentChange) > 15) {
      alerts.push({
        metricKey: key,
        severity: Math.abs(percentChange) > 30 ? "critical" : "warning",
        message: `${key} declined ${Math.abs(percentChange).toFixed(1)}% (${prev} → ${cur})`,
        currentValue: cur,
        previousValue: prev,
        percentChange,
      });
    }
  }

  return { deltas, velocity, alerts };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function calculateDeltas(
  currentMetrics: Record<string, unknown>,
  previousMetrics: Record<string, unknown> | null
): DeltaResult {
  // Always generate threshold-based alerts, even on first scan
  const thresholdAlerts = generateAlerts(currentMetrics);

  if (!previousMetrics) {
    // First scan — no historical comparison available
    return {
      deltas: null,
      velocity: null,
      alerts: thresholdAlerts,
    };
  }

  const { deltas, velocity, alerts: deltaAlerts } = generateDeltas(
    currentMetrics,
    previousMetrics
  );

  // Merge and deduplicate alerts (threshold + delta)
  const seen = new Set<string>();
  const allAlerts: ScanAlert[] = [];
  for (const alert of [...thresholdAlerts, ...deltaAlerts]) {
    const key = `${alert.metricKey}:${alert.severity}`;
    if (!seen.has(key)) {
      seen.add(key);
      allAlerts.push(alert);
    }
  }

  return { deltas, velocity, alerts: allAlerts };
}
