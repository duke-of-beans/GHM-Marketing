/**
 * sentry.edge.config.ts
 *
 * Sentry initialization for Edge Runtime (middleware.ts runs here).
 * Edge runtime has a reduced API surface — keep this minimal.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Lower sample rate for edge — high volume, low signal for perf monitoring
  tracesSampleRate: 0.05,

  enabled: !!process.env.SENTRY_DSN,
});
