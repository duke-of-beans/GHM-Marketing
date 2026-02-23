/**
 * sentry.server.config.ts
 *
 * Sentry initialization for server-side (Node.js / Serverless Functions).
 * This runs in Vercel serverless functions and API routes.
 *
 * DSN is read from SENTRY_DSN (server-side, not exposed in client bundle).
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 10% of server transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Only initialize if DSN is configured
  enabled: !!process.env.SENTRY_DSN,

  // Scrub sensitive data from server errors
  beforeSend(event) {
    // Strip authorization headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-cron-secret"];
    }
    // Strip query strings that might contain tokens
    if (event.request?.query_string) {
      event.request.query_string = "[Filtered]";
    }
    return event;
  },

  // Don't report expected errors (auth failures, validation errors, etc.)
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
});
