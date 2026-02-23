/**
 * src/lib/rate-limit.ts
 *
 * Per-user (and per-IP for unauthenticated) rate limiting for auth endpoints.
 * Uses rate-limiter-flexible with in-memory storage.
 * For multi-region Vercel deployments, swap BurstyRateLimiter for Redis-backed
 * limiter once Redis is in the stack.
 *
 * Limits:
 *  - Login attempts: 5 per 15 minutes per IP (brute-force protection)
 *  - TOTP attempts: 3 per 5 minutes per userId (OTP guessing protection)
 *  - General API mutations: 30 per minute per userId
 */

import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextRequest } from "next/server";

// ── Limiters ──────────────────────────────────────────────────────────────────

/** Login: 5 attempts per 15 min per IP */
const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
  keyPrefix: "login",
});

/** TOTP: 3 attempts per 5 min per userId */
const totpLimiter = new RateLimiterMemory({
  points: 3,
  duration: 5 * 60,
  keyPrefix: "totp",
});

/** Generic mutation: 30 per minute per userId */
const mutationLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  keyPrefix: "mutation",
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

/**
 * Check login rate limit by IP.
 * Call at the top of POST /api/auth handlers before credentials are checked.
 */
export async function checkLoginRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  try {
    await loginLimiter.consume(ip);
    return { limited: false };
  } catch (res: unknown) {
    const msBeforeNext = (res as { msBeforeNext?: number }).msBeforeNext ?? 60000;
    return { limited: true, retryAfterSeconds: Math.ceil(msBeforeNext / 1000) };
  }
}

/**
 * Check TOTP rate limit by userId.
 * Call before verifying a TOTP code.
 */
export async function checkTotpRateLimit(userId: number): Promise<RateLimitResult> {
  try {
    await totpLimiter.consume(String(userId));
    return { limited: false };
  } catch (res: unknown) {
    const msBeforeNext = (res as { msBeforeNext?: number }).msBeforeNext ?? 60000;
    return { limited: true, retryAfterSeconds: Math.ceil(msBeforeNext / 1000) };
  }
}

/**
 * Check general mutation rate limit by userId.
 */
export async function checkMutationRateLimit(userId: number): Promise<RateLimitResult> {
  try {
    await mutationLimiter.consume(String(userId));
    return { limited: false };
  } catch (res: unknown) {
    const msBeforeNext = (res as { msBeforeNext?: number }).msBeforeNext ?? 60000;
    return { limited: true, retryAfterSeconds: Math.ceil(msBeforeNext / 1000) };
  }
}

/**
 * Standard 429 response for rate-limited requests.
 */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests", retryAfterSeconds }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
