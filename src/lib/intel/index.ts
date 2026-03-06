// ── Intel Module Public API ──────────────────────────────────────────────────
//
// Import from "@/lib/intel" — never reach into submodules directly.

// ── Types (IE-01) ────────────────────────────────────────────────────────────
export type {
  SensorId,
  AssetType,
  AssetGroupType,
  OwnershipModel,
  CompetitorSource,
  SensorConfig,
  SensorResult,
  MetricDefinition,
  HealthScoreWeight,
  HealthScoreConfig,
  ThresholdRule,
  TaskTemplate,
  VerticalProfile,
  CreateAssetRequest,
  CreateAssetGroupRequest,
  CreateCompetitorRequest,
} from "./types";

// ── Vertical profiles (IE-01) ────────────────────────────────────────────────
export {
  getVerticalProfile,
  listVerticalIds,
  verticalRegistry,
} from "./verticals";

// ── Asset CRUD (IE-01) ───────────────────────────────────────────────────────
export {
  createAsset,
  getAsset,
  listAssets,
  updateAsset,
  deleteAsset,
  createAssetGroup,
  getAssetGroup,
  listAssetGroups,
  deleteAssetGroup,
  createCompetitor,
  listCompetitors,
  deleteCompetitor,
  getAssetsForClientDomain,
  getIntelOverviewForClient,
} from "./asset-service";

// ── Delta engine (IE-02) ─────────────────────────────────────────────────────
export { calculateDeltas } from "./delta-engine";
export type { DeltaResult, MetricDelta, ScanAlert, VelocityDirection } from "./delta-engine";

// ── Scan orchestrator (IE-02 + IE-03) ────────────────────────────────────────
export { executeScan } from "./scan-orchestrator";
export type { ScanSummary } from "./scan-orchestrator";

// ── Threshold engine (IE-03) ─────────────────────────────────────────────────
export { evaluateRules } from "./threshold-engine";
export type {
  IntelThresholdCondition,
  IntelThresholdRule,
  RichTaskTemplate,
  SnapshotContext,
  ThresholdMatch,
} from "./threshold-engine";

// ── Threshold rules (IE-03) ──────────────────────────────────────────────────
export { SEO_THRESHOLD_RULES } from "./threshold-rules/seo-rules";
export { AFFILIATE_THRESHOLD_RULES } from "./threshold-rules/affiliate-rules";
export { getThresholdRules } from "./threshold-rules";

// ── Task templates (IE-03) ───────────────────────────────────────────────────
export { interpolate, buildContext, adjustPriority } from "./task-templates";
export type { TaskInterpolationContext } from "./task-templates";

// ── Task generator (IE-03) ───────────────────────────────────────────────────
export { generateTasks } from "./task-generator";
export type { TaskGenerationResult } from "./task-generator";

// ── IE-06: Advanced patterns ─────────────────────────────────────────────────
export {
  detectSeasonalPatterns,
  persistSeasonalTasks,
} from "./patterns/seasonal";
export type {
  SeasonalPattern,
  SeasonalInsight,
  SeasonalTask,
  SeasonalResult,
} from "./patterns/seasonal";

export { detectUpsellOpportunities } from "./patterns/upsell";
export type {
  UpsellDetectionResult,
  DetectedOpportunity,
} from "./patterns/upsell";

export { detectCannibalization } from "./patterns/cannibalization";
export type {
  CannibalizationPair,
  CannibalizationResult,
} from "./patterns/cannibalization";

export { generateCrossClientInsights } from "./patterns/cross-client";
export type {
  CrossClientInsight,
  CrossClientSummary,
  ContentApprovalStats,
  InsightSeverity,
} from "./patterns/cross-client";

// ── IE-06: Production hardening ───────────────────────────────────────────────
export {
  withRetry,
  withTimeout,
  consumeRateToken,
  msUntilNextToken,
  calcBackoffDelayMs,
  isDeadLettered,
  recordSensorFailure,
  resolveDeadLetter,
  listDeadLetterEntries,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_SENSOR_TIMEOUT_MS,
} from "./scan-hardening";
export type {
  RetryConfig,
  SensorRunResult,
  SensorStatus,
  DeadLetterEntry,
} from "./scan-hardening";

// ── IE-06: P1 notifications ───────────────────────────────────────────────────
export { notifyP1Tasks } from "./notify-p1";
export type { P1NotificationResult } from "./notify-p1";
