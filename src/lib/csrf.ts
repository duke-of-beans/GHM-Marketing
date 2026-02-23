/**
 * src/lib/csrf.ts
 *
 * CSRF token verification for sensitive mutation routes.
 * Strategy: Double-submit cookie pattern.
 *   - Server sets a csrf-token cookie on page load (via GET endpoint or middleware)
 *   - Client reads the cookie and sends it as X-CSRF-Token header on mutations
 *   - Server verifies header === cookie value
 *
 * Applies to: routes that write money, permissions, or user data.
 * Exempt: GET/HEAD requests, API routes called server-to-server (no cookie),
 *         NextAuth's own /api/auth/* (NextAuth has CSRF built-in).
 *
 * Note: NextAuth v5 includes CSRF protection on its own endpoints. This
 * utility targets our custom mutation API routes beyond NextAuth.
 */

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

// ── Token generation (server → client) ───────────────────────────────────────

/**
 * Generate a new CSRF token (16 bytes = 32 hex chars).
 */
export function generateCsrfToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Cookie options for the CSRF token.
 * SameSite=Strict + Secure + HttpOnly=false (must be readable by JS to send in header).
 */
export function csrfCookieOptions(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CSRF_COOKIE_NAME}=; Path=/; SameSite=Strict${secure}`;
}

// ── Token verification (incoming mutation request) ────────────────────────────

export type CsrfCheckResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Verify the CSRF token on a mutation request.
 * Returns { valid: true } if the header matches the cookie, or if we're
 * in a server-to-server context where no cookie is expected.
 */
export function verifyCsrfToken(req: NextRequest): CsrfCheckResult {
  // Skip safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return { valid: true };
  }

  // Skip NextAuth routes (they have their own CSRF)
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return { valid: true };
  }

  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = req.headers.get(CSRF_HEADER_NAME);

  // Server-to-server calls (crons, internal) won't have the cookie — allow them.
  // Identified by absence of Cookie header entirely or a specific internal header.
  const isInternalCall =
    req.headers.get("x-cron-secret") || req.headers.get("x-internal-call");
  if (isInternalCall) {
    return { valid: true };
  }

  if (!cookieToken) {
    return { valid: false, reason: "Missing CSRF cookie" };
  }

  if (!headerToken) {
    return { valid: false, reason: "Missing X-CSRF-Token header" };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, reason: "CSRF token mismatch" };
  }

  return { valid: true };
}

/**
 * Standard 403 response for CSRF failures.
 */
export function csrfFailureResponse(reason: string): Response {
  return new Response(
    JSON.stringify({ error: "Forbidden", reason }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
