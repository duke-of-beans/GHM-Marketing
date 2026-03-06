// src/lib/intel/types.ts
// Intelligence Engine — TypeScript type definitions
// Sprint IE-01: Unified Asset Layer + Sensor Foundation

// ── Core Entity Types (mirror Prisma models) ────────────────────────────────

export interface IntelAsset {
  id: number;
  tenantId: number;
  assetGroupId: number | null;
  domain: string;
  name: string;
  type: AssetType;
  ownershipModel: OwnershipModel;
  status: AssetStatus;
  healthScore: number;
  lastScanAt: Date | null;
  nextScanAt: Date | null;
  clientDomainId: number | null;
  siteId: number | null;
  verticalMeta: Record<string, unknown> | null;
  fleetId: number | null;
  fleetRole: FleetRole | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface IntelAssetGroup {
  id: number;
  tenantId: number;
  name: string;
  type: AssetGroupType;
  healthScore: number;
  status: AssetGroupStatus;
  clientProfileId: number | null;
  verticalMeta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntelCompetitor {
  id: number;
  tenantId: number;
  assetGroupId: number | null;
  assetId: number | null;
  name: string;
  domain: string | null;
  googlePlaceId: string | null;
  isActive: boolean;
  source: CompetitorSource;
  createdAt: Date;
}

export interface IntelSensorCredential {
  id: number;
  tenantId: number;
  sensorId: string;
  credentials: Record<string, unknown>;
  isActive: boolean;
  lastUsedAt: Date | null;
  status: CredentialStatus;
  statusNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}
// ── Enums / String Unions ───────────────────────────────────────────────────

export type AssetType =
  | "main_site"
  | "satellite"
  | "affiliate_domain"
  | "authority_site"
  | "landing_page"
  | "website"
  | "gbp_listing";

export type OwnershipModel = "tenant_owned" | "client_owned" | "managed";

export type AssetStatus = "active" | "building" | "paused" | "decommissioned";

export type AssetGroupType = "client" | "portfolio" | "niche_cluster" | "franchise_network" | "multi_location";

export type AssetGroupStatus = "active" | "onboarding" | "paused" | "churned";

export type FleetRole = "primary" | "satellite" | "standalone";

export type CompetitorSource = "auto_detected" | "manual" | "scan_discovered";

export type CredentialStatus = "active" | "expired" | "rate_limited" | "error";

export type SensorId =
  | "ahrefs"
  | "serpapi"
  | "pagespeed"
  | "gsc"
  | "ga4"
  | "outscraper"
  | "affiliate-revenue"
  | "ad-revenue"
  | "gbp"
  | "reviews"
  | "local-rank"
  | "citations"
  | "backlinks";

// ── Sensor Configuration ────────────────────────────────────────────────────

export interface SensorConfig {
  sensorId: SensorId;
  displayName: string;
  description: string;
  verticals: string[];
  requiresCredentials: boolean;
  defaultEnabled: boolean;
  costPerCall?: number;
}

export interface SensorResult {
  sensorId: string;
  success: boolean;
  metrics: Record<string, unknown>;
  cost?: number;
  error?: string;
  collectedAt: Date;
}

// ── Metric Definitions ──────────────────────────────────────────────────────

export interface MetricDefinition {
  key: string;
  label: string;
  description: string;
  unit: "number" | "percentage" | "score" | "count" | "currency" | "days";
  source: SensorId;
  higherIsBetter: boolean;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

// ── Health Score Configuration ──────────────────────────────────────────────

export interface HealthScoreWeight {
  metricKey: string;
  weight: number;
  label: string;
}

export interface HealthScoreConfig {
  weights: HealthScoreWeight[];
  minScore: number;
  maxScore: number;
  defaultScore: number;
}

// ── Threshold Rules ─────────────────────────────────────────────────────────

export interface ThresholdRule {
  ruleId: string;
  label: string;
  description: string;
  metric: string;
  condition: "gt" | "lt" | "delta_gt" | "delta_lt" | "delta_pct_gt" | "delta_pct_lt";
  value: number;
  priority: "P1" | "P2" | "P3";
  taskTemplate: TaskTemplate;
}

export interface TaskTemplate {
  category: string;
  title: string;
  descriptionTemplate: string;
  estimatedMinutes?: number;
}

// ── Vertical Profile (Master Config) ────────────────────────────────────────

export interface VerticalProfile {
  verticalId: string;
  displayName: string;
  description: string;
  sensors: SensorConfig[];
  metrics: MetricDefinition[];
  healthScore: HealthScoreConfig;
  thresholdRules: ThresholdRule[];
  assetTypes: AssetType[];
  groupTypes: AssetGroupType[];
}

// ── API Request/Response Types ──────────────────────────────────────────────

export interface CreateAssetRequest {
  domain: string;
  name: string;
  type: AssetType;
  assetGroupId?: number;
  ownershipModel?: OwnershipModel;
  clientDomainId?: number;
  siteId?: number;
  verticalMeta?: Record<string, unknown>;
}

export interface CreateAssetGroupRequest {
  name: string;
  type: AssetGroupType;
  clientProfileId?: number;
  verticalMeta?: Record<string, unknown>;
}

export interface CreateCompetitorRequest {
  name: string;
  domain?: string;
  googlePlaceId?: string;
  assetGroupId?: number;
  assetId?: number;
  source?: CompetitorSource;
}
