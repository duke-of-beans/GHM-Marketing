/**
 * AI Router Types — GHM Dashboard
 *
 * Adapted from GREGORE orchestration/router/types.ts
 * Core equation preserved: Free Energy = Uncertainty × Cost
 *
 * Changes from GREGORE original:
 * - Added GHM-specific QueryDomains: seo, copywriting, competitive
 * - Added GHM-specific QueryIntents: website_copy, brief_generation, scrvnr_eval
 * - Removed Tribunal/Parallel strategies (not needed for dashboard's use cases)
 * - Added FeatureContext for system prompt assembly
 */

// ── Model definitions ─────────────────────────────────────────────────────────

export type ModelTier = "HAIKU" | "SONNET" | "OPUS";

/** Direct = single model call. Cascade = try cheap first, escalate on quality fail. */
export type RoutingStrategy = "direct" | "cascade";

// ── Query classification ──────────────────────────────────────────────────────

export type QueryIntent =
  | "creation"          // Generate new content
  | "analysis"          // Analyze existing content
  | "reasoning"         // Complex logical reasoning
  | "coding"            // Code generation/debugging
  | "website_copy"      // GHM: Page copy for Website Studio
  | "brief_generation"  // GHM: Content brief generation
  | "scrvnr_eval";      // GHM: SCRVNR gate evaluation

export type QueryComplexity = "simple" | "moderate" | "complex" | "very_complex";

export type QueryDomain =
  | "general"
  | "technical"
  | "seo"           // GHM: SEO strategy and keyword analysis
  | "copywriting"   // GHM: Website and content copy
  | "competitive"   // GHM: Competitor analysis
  | "financial"
  | "legal";

export interface QueryClassification {
  intent: QueryIntent;
  complexity: QueryComplexity;
  domain: QueryDomain;
  confidence: {
    intent: number;    // 0–1
    complexity: number; // 0–1
    domain: number;    // 0–1
  };
}

// ── Model definitions ─────────────────────────────────────────────────────────

export interface Model {
  id: string;
  name: string;
  tier: ModelTier;
  provider: "anthropic";
  costPerMInputTokens: number;   // USD per 1M tokens
  costPerMOutputTokens: number;
  maxContextTokens: number;
  avgLatencyMs: number;
}

export interface ModelPerformance {
  modelId: string;
  domain: QueryDomain;
  complexity: QueryComplexity;
  qualityScore: number;   // 0–1
  actualCost: number;     // USD
  actualLatencyMs: number;
  timestamp: Date;
}

export interface RoutingConstraints {
  maxCost?: number;
  maxLatency?: number;
  minContextWindow?: number;
  /** Force a specific minimum tier regardless of complexity */
  minTier?: ModelTier;
}

// ── Router I/O ────────────────────────────────────────────────────────────────

export interface RouterInput {
  query: string;
  classification: QueryClassification;
  constraints?: RoutingConstraints;
  performanceHistory?: ModelPerformance[];
}

export interface RouterOutput {
  model: Model;
  strategy: RoutingStrategy;
  reasoning: string;
  costPrediction: {
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    estimatedCostUSD: number;
  };
  uncertaintyMetrics: {
    epistemicUncertainty: number;  // 0–1
    aleatoricUncertainty: number;  // 0–1
    totalUncertainty: number;      // 0–1
  };
}

// ── Feature context (GHM-specific, for system prompt assembly) ────────────────

/** Which dashboard feature is driving the AI call */
export type AIFeature =
  // Website Studio
  | "content_brief"      // Task content brief generator
  | "website_copy"       // Website Studio page composer
  | "scrvnr_gate"        // SCRVNR voice/AI detection evaluation
  // Content Studio (migrated from direct Anthropic calls)
  | "seo_strategy"       // Topic/keyword strategy generation
  | "blog_post"          // Long-form blog post (HTML output)
  | "social_posts"       // Social media posts (JSON array output)
  | "ppc_ads"            // Google Ads copy variants (JSON array output)
  | "meta_description"   // Meta description (plain text output)
  // Analytics / CRM
  | "competitive_scan"   // Competitor analysis
  | "upsell_detection"   // Upsell opportunity detection
  // SCRVNR / Voice
  | "voice_capture"      // Extract brand voice profile from website content
  // GMB
  | "gbp_post"           // AI-drafted Google Business Profile post
  // Reports
  | "report_narrative";  // AI narrative section for monthly client reports

export interface FeatureContext {
  feature: AIFeature;
  clientId: number;
  clientName: string;
  /** Optional: industry/niche for domain weighting */
  industry?: string;
  /** Optional: voice profile slug for copy-generation features */
  voiceProfileSlug?: string;
  /** Optional: competitor names for competitive features */
  competitors?: string[];
  /** Optional: property tier for Website Studio */
  propertyTier?: "tier1" | "tier2" | "tier3";
  /** Optional: page/section context for website copy */
  pageContext?: {
    pageTitle: string;
    sectionKey: string;
    targetKeywords?: string[];
  };
  /** Optional: task context for brief generation */
  taskContext?: {
    title: string;
    category: string;
    targetKeywords?: string[];
  };
}

// ── Cost tracking ─────────────────────────────────────────────────────────────

export interface CostRecord {
  id: string;
  timestamp: Date;
  feature: AIFeature;
  clientId: number;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  latencyMs: number;
  qualityScore?: number;  // Set retroactively if SCRVNR passes
}
