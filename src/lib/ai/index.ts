/**
 * AI Layer — GHM Dashboard
 *
 * Public exports for all AI functionality.
 * Import from here, not from subdirectory paths.
 *
 * Derived from GREGORE orchestration engine:
 *   - Model Router (Free Energy = Uncertainty × Cost)
 *   - Complexity Analyzer (4-factor scoring)
 *   - Cost Tracker (USD per client/feature)
 *
 * New for GHM:
 *   - System Prompt Builder (feature-specific protocol scaffolding)
 *   - AI Client (unified entry point with cascade retry)
 */

// Main entry point — use this in API routes
export { callAI } from "./client";
export type { AICallInput, AICallResult, AICallError } from "./client";

// Router types — used when building FeatureContext
export type {
  AIFeature,
  FeatureContext,
  QueryClassification,
  RoutingConstraints,
} from "./router/types";

// System prompt builder — use if you need the prompt without calling the API
export { buildSystemPrompt } from "./context/system-prompt-builder";

// Cost analytics — use in dashboard admin views
export {
  recordAICost,
  getCostByClient,
  getCostByFeature,
  getCostAccuracy,
} from "./cost-tracker";

// Classification — use if you need to inspect routing logic
export { classifyQuery, analyzeComplexity } from "./router/complexity-analyzer";
