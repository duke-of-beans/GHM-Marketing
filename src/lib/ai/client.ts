/**
 * AI Client — GHM Dashboard
 *
 * The single entry point for all AI calls in the dashboard.
 * Every API route that calls Anthropic goes through here.
 *
 * Provides:
 * 1. Model routing (GREGORE Free Energy algorithm)
 * 2. System prompt assembly (feature-specific protocol scaffolding)
 * 3. Cost tracking (per-client, per-feature USD logging)
 * 4. Cascade retry (escalate to Opus if Sonnet quality is insufficient)
 *
 * Usage (in any API route):
 *
 *   import { callAI } from "@/lib/ai/client";
 *
 *   const result = await callAI({
 *     feature: "content_brief",
 *     prompt: "Generate a content brief for...",
 *     context: { clientId: 42, clientName: "German Auto Doctor", industry: "Auto Repair" },
 *   });
 *
 *   if (result.ok) {
 *     const parsed = JSON.parse(result.content);
 *   }
 */

import Anthropic from "@anthropic-ai/sdk";
import { classifyQuery } from "./router/complexity-analyzer";
import { ModelRouter } from "./router/model-router";
import { buildSystemPrompt } from "./context/system-prompt-builder";
import { recordAICost } from "./cost-tracker";
import { estimateQueryCost, estimateTokens } from "./router/model-benchmarks";
import type { FeatureContext, RoutingConstraints, AIFeature } from "./router/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AICallInput {
  /** Which dashboard feature is making this call */
  feature: AIFeature;
  /** The user-facing prompt / task description */
  prompt: string;
  /** Client + feature context for system prompt assembly */
  context: FeatureContext;
  /** Optional: override routing constraints */
  constraints?: RoutingConstraints;
  /** Optional: max tokens for response (defaults per feature) */
  maxTokens?: number;
}

export interface AICallResult {
  ok: true;
  content: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  latencyMs: number;
  wasEscalated: boolean;
}

export interface AICallError {
  ok: false;
  error: string;
  modelUsed?: string;
}

const DEFAULT_MAX_TOKENS: Record<AIFeature, number> = {
  // Website Studio
  content_brief:     2000,
  website_copy:      1500,
  scrvnr_gate:        800,
  // Content Studio
  seo_strategy:      1200,
  blog_post:         4000,
  social_posts:      2000,
  ppc_ads:           1200,
  meta_description:   200,
  // Analytics
  competitive_scan:  1500,
  upsell_detection:   600,
  // SCRVNR / Voice
  voice_capture:     1200,
};

// ── Singleton client ──────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const router = new ModelRouter();

// ── Main entry point ──────────────────────────────────────────────────────────

export async function callAI(
  input: AICallInput
): Promise<AICallResult | AICallError> {
  const startTime = Date.now();

  try {
    // 1. Classify query complexity
    const classification = classifyQuery(input.prompt);

    // 2. Route to optimal model
    const routingResult = router.route({
      query: input.prompt,
      classification,
      constraints: input.constraints,
    });

    const maxTokens = input.maxTokens ?? DEFAULT_MAX_TOKENS[input.feature];
    const systemPrompt = buildSystemPrompt(input.context);

    // 3. First attempt
    let result = await callModel(
      routingResult.model.id,
      systemPrompt,
      input.prompt,
      maxTokens
    );

    let wasEscalated = false;

    // 4. Cascade: if strategy is cascade and model wasn't already Opus, try escalation
    if (
      routingResult.strategy === "cascade" &&
      routingResult.model.tier !== "OPUS" &&
      shouldEscalate(result, input.feature)
    ) {
      const opusModel = "claude-opus-4-6";
      result = await callModel(opusModel, systemPrompt, input.prompt, maxTokens);
      wasEscalated = true;
    }

    const latencyMs = Date.now() - startTime;
    const modelUsed = wasEscalated ? "claude-opus-4-6" : routingResult.model.id;

    // 5. Record cost (non-blocking)
    recordAICost({
      timestamp: new Date(),
      feature: input.feature,
      clientId: input.context.clientId,
      modelId: modelUsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUSD: result.costUSD,
      latencyMs,
    }).catch(() => {}); // intentionally fire-and-forget

    return {
      ok: true,
      content: result.content,
      modelUsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUSD: result.costUSD,
      latencyMs,
      wasEscalated,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? "Unknown AI call error",
    };
  }
}

// ── Internal: single model call ───────────────────────────────────────────────

async function callModel(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string; inputTokens: number; outputTokens: number; costUSD: number }> {
  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Use actual token counts for cost calculation (more accurate than estimates)
  const { AVAILABLE_MODELS } = await import("./router/model-benchmarks");
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const costUSD = model
    ? estimateQueryCost(model, inputTokens, outputTokens)
    : 0;

  return { content, inputTokens, outputTokens, costUSD };
}

// ── Cascade escalation heuristic ─────────────────────────────────────────────

/**
 * Decide if a response warrants escalation to Opus.
 * Conservative — escalation costs ~10x more.
 */
function shouldEscalate(result: { content: string }, feature: AIFeature): boolean {
  const content = result.content.trim();

  // Empty or very short — always escalate
  if (content.length < 50) return true;

  // JSON-output features: check parse validity
  const jsonFeatures: AIFeature[] = [
    "content_brief", "scrvnr_gate", "competitive_scan", "upsell_detection",
    "seo_strategy", "social_posts", "ppc_ads", "voice_capture",
  ];
  if (jsonFeatures.includes(feature)) {
    try {
      JSON.parse(content.replace(/```json|```/g, "").trim());
      return false; // valid JSON
    } catch {
      return true; // malformed — escalate
    }
  }

  // HTML output (blog post): check it actually contains HTML
  if (feature === "blog_post") {
    return !/<h[1-3]|<p[> ]/i.test(content);
  }

  // Plain text (meta, website_copy): don't escalate — length check already done above
  return false;
}
