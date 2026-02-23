/**
 * sentry.client.config.ts
 *
 * Sentry initialization for client-side (browser) bundle.
 * Runs in the user's browser — keep config minimal and privacy-respecting.
 *
 * DSN is read from NEXT_PUBLIC_SENTRY_DSN (safe to expose in browser bundle —
 * DSNs are not secrets; they're rate-limited ingest endpoints).
 *
 * User context is set in src/lib/sentry.ts and called from layout.tsx.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — capture 10% of transactions (low cost)
  tracesSampleRate: 0.1,

  // Session replay — 0% normal, 100% on errors (helps reproduce issues)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Only initialize if DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media in replays to protect user data
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out noise — don't report errors we can't fix
  ignoreErrors: [
    // Browser extension noise
    "Non-Error promise rejection captured",
    // Network errors the user experiences (connection drops, etc.)
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    // Next.js client-side navigation
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],

  beforeSend(event) {
    // Strip any accidentally captured auth tokens from headers
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },
});
