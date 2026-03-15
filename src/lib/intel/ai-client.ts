/**
 * src/lib/intel/ai-client.ts
 * Intelligence Engine — CPR-01 / PERF-001 / PERF-002
 *
 * Canonical AI wrapper for the Intelligence Engine.
 * All future IE AI calls MUST go through this wrapper.
 *
 * Key behaviours:
 *   - Accepts a model parameter: "sonnet" | "haiku" (defaults to sonnet)
 *   - Applies Anthropic prompt caching headers to static system prompt blocks
 *   - Uses the anthropic-beta: prompt-caching-2024-07-31 header for cache_control support
 *   - Sanitizes all user-controlled content via sanitizePromptInput() from ai-security.ts
 *
 * Model routing guide (per CPR-IE-001-CLASSIFICATION.md):
 *   Class 3 — complex synthesis, nuanced judgment, client-facing copy → model: "sonnet" (default)
 *   Class 2 — moderate reasoning, structured output          → model: "sonnet"
 *   Class 1 — simple pattern match, template fill            → model: "haiku"
 *   Class 0 — local logic, no AI needed                      → do NOT call this wrapper
 *
 * USAGE EXAMPLE (Class 1 — Haiku):
 *   const result = await callIE({
 *     systemPrompt: STATIC_SYSTEM_PROMPT,   // developer-authored, never user-supplied
 *     userMessages: [{ role: "user", content: sanitizePromptInput(userContent) }],
 *     model: "haiku",
 *   });
 *
 * USAGE EXAMPLE (Class 3 — Sonnet with caching):
 *   const result = await callIE({
 *     systemPrompt: LARGE_STATIC_SYSTEM_PROMPT,
 *     userMessages: [{ role: "user", content: sanitizePromptInput(userContent) }],
 *     model: "sonnet",   // default
 *   });
 *   // The system prompt block is automatically cache_control: ephemeral
 *
 * NOTES:
 *   - As of 2026-03-14 (COVOS-CPR-01), the IE contains ZERO AI calls.
 *     This file is forward infrastructure — the standard harness for any
 *     future IE AI integration.
 *   - Do not use this wrapper for content studio calls (generate-blog, etc.)
 *     Those live in src/app/api/content/ and have their own fetch patterns.
 *   - Model strings are pinned — do not change without updating CPR-IE-001-CLASSIFICATION.md.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  TextBlockParam,
  Message,
} from "@anthropic-ai/sdk/resources/messages";

// ── Model string constants (exact values required — never change casually) ────

export const IE_MODEL_SONNET = "claude-sonnet-4-6" as const;
export const IE_MODEL_HAIKU  = "claude-haiku-4-5-20251001" as const;

export type IEModel = typeof IE_MODEL_SONNET | typeof IE_MODEL_HAIKU;

// ── Client (lazy singleton) ────────────────────────────────────────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Enable prompt caching beta header globally on this client instance.
      // Per Anthropic docs (2024-07-31), this header is required for
      // cache_control blocks to be honoured.
      defaultHeaders: {
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
    });
  }
  return _client;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface IECallOptions {
  /**
   * Developer-authored system prompt. Must NOT contain user-controlled data.
   * If static (same across requests), prompt caching will be applied automatically.
   * If dynamic (changes per-request), set staticSystemPrompt: false to skip caching.
   */
  systemPrompt: string;

  /**
   * Whether the system prompt is static/near-static across requests.
   * When true (default), cache_control: { type: "ephemeral" } is applied.
   * Set false only for system prompts that are fully dynamic per-request.
   */
  staticSystemPrompt?: boolean;

  /**
   * Conversation turns. All user-controlled strings must already be sanitized
   * via sanitizePromptInput() from src/lib/ai-security.ts before passing here.
   */
  userMessages: MessageParam[];

  /**
   * Model to use. Default: claude-sonnet-4-6 (Class 2/3).
   * Use "haiku" for Class 1 calls (simple pattern match / template fill).
   * Full model strings: IE_MODEL_SONNET | IE_MODEL_HAIKU.
   */
  model?: "sonnet" | "haiku" | IEModel;

  /**
   * Maximum tokens in the completion. Default: 1024.
   */
  maxTokens?: number;
}

export interface IECallResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  model: IEModel;
  durationMs: number;
}

// ── Model resolution ───────────────────────────────────────────────────────────

function resolveModel(model: IECallOptions["model"]): IEModel {
  if (!model || model === "sonnet") return IE_MODEL_SONNET;
  if (model === "haiku") return IE_MODEL_HAIKU;
  // Accept full model strings for explicit overrides
  if (model === IE_MODEL_SONNET || model === IE_MODEL_HAIKU) return model;
  // Unknown — default to sonnet (safe)
  return IE_MODEL_SONNET;
}

// ── Main wrapper ───────────────────────────────────────────────────────────────

/**
 * Call an Anthropic model from within the Intelligence Engine.
 *
 * Applies:
 *   - Correct model routing (sonnet vs haiku)
 *   - Prompt caching headers on static system prompts
 *   - Structured result with token accounting
 *
 * Throws on API errors — callers are responsible for try/catch.
 * The IE's scan orchestrator wraps all calls in try/catch already.
 */
export async function callIE(options: IECallOptions): Promise<IECallResult> {
  const startedAt = Date.now();
  const {
    systemPrompt,
    staticSystemPrompt = true,
    userMessages,
    maxTokens = 1024,
  } = options;

  const resolvedModel = resolveModel(options.model);
  const client = getClient();

  // Build system block — apply cache_control if system prompt is static
  const systemBlock: TextBlockParam = staticSystemPrompt
    ? {
        type: "text",
        text: systemPrompt,
        // cache_control is not in the official SDK types for TextBlockParam but is
        // accepted by the API when the beta header is present. Cast to any for now.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cache_control: { type: "ephemeral" } as any,
      }
    : {
        type: "text",
        text: systemPrompt,
      };

  const response: Message = await client.messages.create({
    model: resolvedModel,
    max_tokens: maxTokens,
    system: [systemBlock],
    messages: userMessages,
  });

  // Extract text content
  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Token accounting — cache fields present when caching is active
  const usage = response.usage as Anthropic.Usage & {
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };

  return {
    content,
    inputTokens:          usage.input_tokens,
    outputTokens:         usage.output_tokens,
    cacheCreationTokens:  usage.cache_creation_input_tokens  ?? 0,
    cacheReadTokens:      usage.cache_read_input_tokens      ?? 0,
    model:                resolvedModel,
    durationMs:           Date.now() - startedAt,
  };
}
