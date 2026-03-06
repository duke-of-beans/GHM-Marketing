// ── Intel Module Public API ──────────────────────────────────────────────────
//
// Import from "@/lib/intel" — never reach into submodules directly.

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

export {
  getVerticalProfile,
  listVerticalIds,
  verticalRegistry,
} from "./verticals";

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
