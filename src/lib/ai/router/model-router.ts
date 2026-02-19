/**
 * Model Router — GHM Dashboard
 *
 * Adapted from GREGORE orchestration/router/model-router.ts
 * Core principle preserved: Free Energy = Uncertainty × Cost
 *
 * Simplifications from GREGORE original:
 * - Tribunal and Parallel strategies removed (not needed for dashboard)
 * - Returns RouterOutput directly (no Result<T> wrapper — Next.js routes handle errors)
 * - Performance history optional, not required
 *
 * Usage:
 *   const router = new ModelRouter();
 *   const output = router.route({ query, classification, constraints });
 *   // output.model.id → pass to Anthropic API
 */

import {
  AVAILABLE_MODELS,
  filterByConstraints,
  estimateQueryCost,
  estimateTokens,
} from "./model-benchmarks";
import type {
  RouterInput,
  RouterOutput,
  Model,
  ModelPerformance,
  QueryClassification,
  QueryComplexity,
  ModelTier,
} from "./types";

export class ModelRouter {
  route(input: RouterInput): RouterOutput {
    const candidates = filterByConstraints(
      AVAILABLE_MODELS,
      input.constraints
    );

    if (candidates.length === 0) {
      // Fallback: return Sonnet regardless — never fail silently
      const sonnet = AVAILABLE_MODELS.find((m) => m.tier === "SONNET")!;
      return this.buildOutput(sonnet, "direct", input, 0.5);
    }

    // Calculate Free Energy for every candidate
    const scored = candidates.map((model) => ({
      model,
      freeEnergy: this.freeEnergy(input.query, model, input.classification, input.performanceHistory),
    }));

    // Lowest free energy wins
    scored.sort((a, b) => a.freeEnergy - b.freeEnergy);
    const best = scored[0]!;

    // Strategy: cascade if complex + routed to a non-Opus model
    const strategy =
      (input.classification.complexity === "complex" ||
        input.classification.complexity === "very_complex") &&
      best.model.tier !== "OPUS"
        ? "cascade"
        : "direct";

    return this.buildOutput(best.model, strategy, input, best.freeEnergy);
  }

  // ── Free Energy = Uncertainty × NormalizedCost ──────────────────────────────

  private freeEnergy(
    query: string,
    model: Model,
    classification: QueryClassification,
    history?: ModelPerformance[]
  ): number {
    const uncertainty = this.uncertainty(model, classification, history);
    const inputTokens = estimateTokens(query);
    const outputTokens = this.estimateOutputTokens(inputTokens, classification.complexity);
    const cost = estimateQueryCost(model, inputTokens, outputTokens);
    const normalizedCost = Math.min(cost / 0.10, 1.0); // Cap at $0.10
    return uncertainty * normalizedCost;
  }

  private uncertainty(
    model: Model,
    classification: QueryClassification,
    history?: ModelPerformance[]
  ): number {
    const epistemic = this.epistemicUncertainty(model, classification, history);
    const aleatoric = this.aleatoricUncertainty(classification);
    return Math.sqrt(epistemic ** 2 + aleatoric ** 2);
  }

  private epistemicUncertainty(
    model: Model,
    classification: QueryClassification,
    history?: ModelPerformance[]
  ): number {
    if (!history || history.length === 0) return 0.8;

    const relevant = history.filter(
      (h) => h.modelId === model.id && h.domain === classification.domain
    );
    if (relevant.length === 0) return 0.6;

    const scores = relevant.map((h) => h.qualityScore);
    const mean = scores.reduce((s, q) => s + q, 0) / scores.length;
    const variance = scores.reduce((s, q) => s + (q - mean) ** 2, 0) / scores.length;
    const varianceUncertainty = Math.min(Math.sqrt(variance), 1.0);
    const sampleUncertainty = 1 - Math.min(relevant.length / 10, 1.0);
    return varianceUncertainty * 0.7 + sampleUncertainty * 0.3;
  }

  private aleatoricUncertainty(classification: QueryClassification): number {
    const complexityMap: Record<QueryComplexity, number> = {
      simple: 0.1,
      moderate: 0.3,
      complex: 0.5,
      very_complex: 0.7,
    };
    return complexityMap[classification.complexity];
  }

  private estimateOutputTokens(inputTokens: number, complexity: QueryComplexity): number {
    const multipliers: Record<QueryComplexity, number> = {
      simple: 0.5,
      moderate: 0.8,
      complex: 1.2,
      very_complex: 1.8,
    };
    return Math.ceil(inputTokens * multipliers[complexity]);
  }

  // ── Output assembly ──────────────────────────────────────────────────────────

  private buildOutput(
    model: Model,
    strategy: "direct" | "cascade",
    input: RouterInput,
    freeEnergy: number
  ): RouterOutput {
    const inputTokens = estimateTokens(input.query);
    const outputTokens = this.estimateOutputTokens(inputTokens, input.classification.complexity);

    return {
      model,
      strategy,
      reasoning: this.buildReasoning(model, strategy, input.classification, freeEnergy),
      costPrediction: {
        estimatedInputTokens: inputTokens,
        estimatedOutputTokens: outputTokens,
        estimatedCostUSD: estimateQueryCost(model, inputTokens, outputTokens),
      },
      uncertaintyMetrics: {
        epistemicUncertainty: this.epistemicUncertainty(model, input.classification, input.performanceHistory),
        aleatoricUncertainty: this.aleatoricUncertainty(input.classification),
        totalUncertainty: this.uncertainty(model, input.classification, input.performanceHistory),
      },
    };
  }

  private buildReasoning(
    model: Model,
    strategy: "direct" | "cascade",
    classification: QueryClassification,
    freeEnergy: number
  ): string {
    return [
      `Routed to ${model.name} (free energy: ${freeEnergy.toFixed(3)}).`,
      `Query: ${classification.complexity} complexity, ${classification.intent} intent, ${classification.domain} domain.`,
      strategy === "cascade"
        ? `Cascade strategy active — will escalate to Opus if ${model.name} quality is insufficient.`
        : `Direct strategy — single model call.`,
    ].join(" ");
  }
}
