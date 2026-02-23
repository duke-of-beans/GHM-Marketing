/**
 * src/lib/sentry.ts
 *
 * Sentry utility helpers for GHM Dashboard.
 *
 * Usage in Server Components or API routes:
 *   import { setSentryUser, captureApiError } from '@/lib/sentry'
 *
 * Usage in Client Components:
 *   import { setSentryUserClient } from '@/lib/sentry'
 */

import * as Sentry from "@sentry/nextjs";

export type SentryUserContext = {
  id: string;
  role: string;
};

/**
 * Set user context on all subsequent Sentry events.
 * Call this after session is resolved in server components / API routes.
 * Only attaches role + userId — no email or name (PII minimization).
 */
export function setSentryUser(user: SentryUserContext | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    // Custom tag — role is not PII and is useful for debugging
    role: user.role,
  });
}

/**
 * Capture an error with additional context.
 * Wrapper around Sentry.captureException that ensures consistent tagging.
 */
export function captureApiError(
  error: unknown,
  context: {
    route?: string;
    userId?: string | number;
    role?: string;
    extra?: Record<string, unknown>;
  } = {}
) {
  Sentry.withScope((scope) => {
    if (context.route) scope.setTag("route", context.route);
    if (context.role) scope.setTag("user.role", context.role);
    if (context.userId) scope.setUser({ id: String(context.userId) });
    if (context.extra) scope.setExtras(context.extra);
    scope.setLevel("error");
    Sentry.captureException(error);
  });
}

/**
 * Capture a non-fatal warning (e.g., Wave bill creation failed but approval succeeded).
 */
export function captureWarning(
  message: string,
  context: Record<string, unknown> = {}
) {
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setExtras(context);
    Sentry.captureMessage(message);
  });
}
