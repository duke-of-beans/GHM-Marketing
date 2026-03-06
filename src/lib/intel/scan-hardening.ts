// src/lib/intel/scan-hardening.ts
// Intelligence Engine — Sprint IE-06
// Production hardening utilities:
//   - Exponential backoff with jitter for rate-limited sensors
//   - Per-sensor timeout wrapper (configurable, default 30s)
//   - Dead letter queue for persistently failing sensors (DB-backed)
//   - Rate limit token bucket per sensor
//
// Used by scan-orchestrator.ts. All functions are pure utilities — no
// side-effectful imports at the module level.

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of attempts (including the first) */
  maxAttempts: number;
  /** Base delay in ms for exponential backoff */
  baseDelayMs: number;
  /** Maximum delay cap in ms */
  maxDelayMs: number;
  /** Jitter factor 0–1 (0 = no jitter, 1 = full jitter) */
  jitter: number;
}

export interface SensorTimeoutConfig {
  /** Per-sensor timeout in ms. Default: 30_000 */
  timeoutMs: number;
}

export type SensorStatus = "ok" | "rate_limited" | "error" | "dead_lettered";

export interface SensorRunResult<T> {
  success: boolean;
  value?: T;
  error?: string;
  attempts: number;
  status: SensorStatus;
}

export interface DeadLetterEntry {
  id: number;
  tenantId: number;
  sensorId: string;
  targetDomain: string;
  errorMessage: string;
  attemptCount: number;
  firstFailedAt: Date;
  lastAttemptAt: Date;
  resolvedAt: Date | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitter: 0.3,
};

export const DEFAULT_SENSOR_TIMEOUT_MS = 30_000;

/**
 * After this many consecutive failures across scans, a sensor+domain pair
 * is moved to the dead letter queue and skipped on future scans.
 */
const DEAD_LETTER_THRESHOLD = 5;

// ── Rate limit token bucket ────────────────────────────────────────────────────

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  refillRateMs: number; // ms between token refills
  capacity: number;
}

// In-memory rate limit buckets — reset on cold start (acceptable for edge functions)
const _rateLimitBuckets = new Map<string, TokenBucket>();

/**
 * Per-sensor rate limits (requests per minute).
 * Sensors not listed here are unconstrained.
 */
const SENSOR_RATE_LIMITS: Record<string, { rpm: number }> = {
  ahrefs:      { rpm: 30 },
  serpapi:     { rpm: 60 },
  outscraper:  { rpm: 20 },
  ga4:         { rpm: 40 },
  gsc:         { rpm: 40 },
  pagespeed:   { rpm: 25 }, // Google PSI free tier
};

function getBucket(sensorId: string): TokenBucket | null {
  const limit = SENSOR_RATE_LIMITS[sensorId];
  if (!limit) return null;

  let bucket = _rateLimitBuckets.get(sensorId);
  if (!bucket) {
    bucket = {
      tokens: limit.rpm,
      capacity: limit.rpm,
      lastRefill: Date.now(),
      refillRateMs: (60_000 / limit.rpm), // ms per token
    };
    _rateLimitBuckets.set(sensorId, bucket);
  }
  return bucket;
}

/**
 * Attempt to consume a token for a sensor request.
 * Refills tokens based on elapsed time since last refill.
 * Returns true if a token was available (proceed with request).
 * Returns false if rate limited (caller should back off).
 */
export function consumeRateToken(sensorId: string): boolean {
  const bucket = getBucket(sensorId);
  if (!bucket) return true; // No limit configured — always proceed

  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / bucket.refillRateMs);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens--;
    return true;
  }

  return false; // Rate limited
}

/**
 * Calculate wait time in ms until the next token is available.
 */
export function msUntilNextToken(sensorId: string): number {
  const bucket = getBucket(sensorId);
  if (!bucket) return 0;
  if (bucket.tokens > 0) return 0;
  const timeToNextToken = bucket.refillRateMs - (Date.now() - bucket.lastRefill);
  return Math.max(0, timeToNextToken);
}

// ── Exponential backoff ────────────────────────────────────────────────────────

/**
 * Calculate the delay in ms for a given attempt number using exponential
 * backoff with optional jitter.
 *
 * delay = min(baseDelay * 2^attempt, maxDelay) * (1 ± jitter/2)
 */
export function calcBackoffDelayMs(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const base = Math.min(
    config.baseDelayMs * Math.pow(2, attempt),
    config.maxDelayMs
  );
  const jitterAmount = base * config.jitter;
  const jittered = base - jitterAmount / 2 + Math.random() * jitterAmount;
  return Math.round(jittered);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Timeout wrapper ────────────────────────────────────────────────────────────

/**
 * Wraps an async operation with a per-sensor timeout.
 * Throws a descriptive error if the operation exceeds timeoutMs.
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = DEFAULT_SENSOR_TIMEOUT_MS,
  sensorId: string = "unknown"
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`TIMEOUT: sensor "${sensorId}" exceeded ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([operation, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Dead letter queue (DB-backed) ──────────────────────────────────────────────

/**
 * Check whether a sensor+domain combination is dead-lettered
 * (i.e., should be skipped without attempting).
 */
export async function isDeadLettered(
  tenantId: number,
  sensorId: string,
  targetDomain: string
): Promise<boolean> {
  const entry = await prisma.intelScanDeadLetter.findFirst({
    where: {
      tenantId,
      sensorId,
      targetDomain,
      resolvedAt: null,
    },
    select: { id: true, attemptCount: true },
  });
  return (entry?.attemptCount ?? 0) >= DEAD_LETTER_THRESHOLD;
}

/**
 * Record a sensor failure for a target domain.
 * Increments the failure counter. Once the counter reaches DEAD_LETTER_THRESHOLD,
 * subsequent calls to isDeadLettered will return true, suppressing future attempts.
 */
export async function recordSensorFailure(
  tenantId: number,
  sensorId: string,
  targetDomain: string,
  errorMessage: string
): Promise<void> {
  const existing = await prisma.intelScanDeadLetter.findFirst({
    where: { tenantId, sensorId, targetDomain, resolvedAt: null },
    select: { id: true, attemptCount: true },
  });

  if (existing) {
    await prisma.intelScanDeadLetter.update({
      where: { id: existing.id },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
        errorMessage,
      },
    });
  } else {
    await prisma.intelScanDeadLetter.create({
      data: {
        tenantId,
        sensorId,
        targetDomain,
        errorMessage,
        attemptCount: 1,
        firstFailedAt: new Date(),
        lastAttemptAt: new Date(),
      },
    });
  }
}

/**
 * Mark a dead letter entry as resolved (e.g., after credentials are fixed).
 * The entry will be re-attempted on the next scan cycle.
 */
export async function resolveDeadLetter(
  tenantId: number,
  sensorId: string,
  targetDomain: string
): Promise<void> {
  await prisma.intelScanDeadLetter.updateMany({
    where: { tenantId, sensorId, targetDomain, resolvedAt: null },
    data: { resolvedAt: new Date(), attemptCount: 0 },
  });
}

/**
 * List all unresolved dead letter entries for a tenant.
 */
export async function listDeadLetterEntries(
  tenantId: number
): Promise<DeadLetterEntry[]> {
  return prisma.intelScanDeadLetter.findMany({
    where: { tenantId, resolvedAt: null },
    orderBy: { lastAttemptAt: "desc" },
  });
}

// ── Retry wrapper ──────────────────────────────────────────────────────────────

/**
 * Execute an async operation with exponential backoff retry, rate limit
 * awareness, timeout enforcement, and dead letter tracking.
 *
 * Callers should use this for every sensor invocation via the orchestrator.
 */
export async function withRetry<T>(
  sensorId: string,
  targetDomain: string,
  tenantId: number,
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  timeoutMs: number = DEFAULT_SENSOR_TIMEOUT_MS
): Promise<SensorRunResult<T>> {
  // Check dead letter queue before any attempt
  if (await isDeadLettered(tenantId, sensorId, targetDomain)) {
    return {
      success: false,
      error: `SKIPPED: ${sensorId}/${targetDomain} is in dead letter queue`,
      attempts: 0,
      status: "dead_lettered",
    };
  }

  let lastError = "";

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    // Rate limit check
    if (!consumeRateToken(sensorId)) {
      const waitMs = msUntilNextToken(sensorId);
      if (waitMs > 0 && waitMs < 5_000) {
        await delay(waitMs);
      } else if (waitMs >= 5_000) {
        // Too long to wait — defer to next scan cycle
        return {
          success: false,
          error: `RATE_LIMITED: ${sensorId} rate limit exceeded — deferred to next scan cycle`,
          attempts: attempt,
          status: "rate_limited",
        };
      }
    }

    // Backoff delay before retry (skip on first attempt)
    if (attempt > 0) {
      const backoff = calcBackoffDelayMs(attempt - 1, config);
      await delay(backoff);
    }

    try {
      const value = await withTimeout(operation(), timeoutMs, sensorId);
      return { success: true, value, attempts: attempt + 1, status: "ok" };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      // Don't retry on timeout — likely a persistent issue
      if (lastError.startsWith("TIMEOUT:")) {
        await recordSensorFailure(tenantId, sensorId, targetDomain, lastError);
        return {
          success: false,
          error: lastError,
          attempts: attempt + 1,
          status: "error",
        };
      }
    }
  }

  // All attempts exhausted — record failure
  await recordSensorFailure(tenantId, sensorId, targetDomain, lastError);

  return {
    success: false,
    error: lastError,
    attempts: config.maxAttempts,
    status: "error",
  };
}
