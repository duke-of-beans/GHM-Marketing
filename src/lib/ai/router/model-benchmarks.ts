/**
 * Model Benchmarks — GHM Dashboard
 *
 * Adapted from GREGORE orchestration/router/model-benchmarks.ts
 * Pricing sourced from Anthropic API docs (current as of Feb 2026).
 *
 * Update pricing here when Anthropic changes rates.
 */

import type { Model, ModelTier, RoutingConstraints } from "./types";

export const AVAILABLE_MODELS: Model[] = [
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    tier: "HAIKU",
    provider: "anthropic",
    costPerMInputTokens: 0.8,
    costPerMOutputTokens: 4.0,
    maxContextTokens: 200_000,
    avgLatencyMs: 600,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    tier: "SONNET",
    provider: "anthropic",
    costPerMInputTokens: 3.0,
    costPerMOutputTokens: 15.0,
    maxContextTokens: 200_000,
    avgLatencyMs: 1200,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    tier: "OPUS",
    provider: "anthropic",
    costPerMInputTokens: 15.0,
    costPerMOutputTokens: 75.0,
    maxContextTokens: 200_000,
    avgLatencyMs: 2500,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getModel(modelId: string): Model | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function getModelsByTier(tier: ModelTier): Model[] {
  return AVAILABLE_MODELS.filter((m) => m.tier === tier);
}

export function filterByConstraints(
  models: Model[],
  constraints?: RoutingConstraints
): Model[] {
  if (!constraints) return models;

  const tierOrder: Record<ModelTier, number> = { HAIKU: 0, SONNET: 1, OPUS: 2 };

  return models.filter((m) => {
    if (constraints.maxCost !== undefined) {
      const est = estimateQueryCost(m, 1000, 500);
      if (est > constraints.maxCost) return false;
    }
    if (constraints.maxLatency !== undefined && m.avgLatencyMs > constraints.maxLatency) {
      return false;
    }
    if (constraints.minContextWindow !== undefined && m.maxContextTokens < constraints.minContextWindow) {
      return false;
    }
    if (constraints.minTier !== undefined && tierOrder[m.tier] < tierOrder[constraints.minTier]) {
      return false;
    }
    return true;
  });
}

/**
 * Estimate USD cost for a call.
 * Rule of thumb: 1 token ≈ 4 characters.
 */
export function estimateQueryCost(
  model: Model,
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * model.costPerMInputTokens +
    (outputTokens / 1_000_000) * model.costPerMOutputTokens
  );
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
