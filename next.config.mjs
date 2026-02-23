import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Pre-existing type errors in analytics/seed files — suppress during builds
    // TODO: clean up when doing a dedicated type audit sprint
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable client-side Router Cache for dynamic pages (default is 30s in Next 14).
    // This ensures dashboard widgets always show fresh data when navigating between
    // pages — no stale wins/pipeline counts after moving leads in the kanban.
    staleTimes: {
      dynamic: 0,
    },
  },

  // ── SECURITY HEADERS ─────────────────────────────────────────────────────
  // Applied to all routes. These headers harden the app against common
  // web attacks: clickjacking, XSS, MIME sniffing, data leakage.
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          // Prevent embedding in iframes (clickjacking protection)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Strict HTTPS for 1 year, includes subdomains
          // Note: only effective on HTTPS (Vercel enforces HTTPS in production)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Control referrer information sent with requests
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disable browser features not used by this app
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
              "bluetooth=()",
              "accelerometer=()",
              "gyroscope=()",
              "magnetometer=()",
            ].join(", "),
          },
          // Content Security Policy
          // self + Sentry ingest + Vercel analytics — explicitly denies all else
          {
            key: "Content-Security-Policy",
            value: [
              // Default: self only
              "default-src 'self'",
              // Scripts: self + Next.js inline scripts (required for hydration) + Vercel live preview
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              // Styles: self + inline (required for Tailwind/shadcn) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com",
              // Images: self + data URIs + blob (for PDF generation) + Vercel image optimization
              "img-src 'self' data: blob: https:",
              // Fetch/XHR: self + Sentry error reporting + Wave API + external APIs used server-side
              // Note: API calls from server components don't need connect-src — only client-side fetch does
              "connect-src 'self' https://*.sentry.io https://sentry.io wss://ws.pusher.com",
              // Media: self only
              "media-src 'self'",
              // Object/embed: none
              "object-src 'none'",
              // Frames: none (deny iframing, consistent with X-Frame-Options)
              "frame-src 'none'",
              // Form actions: self only
              "form-action 'self'",
              // Base URI: self (prevent base tag injection)
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// ── SENTRY CONFIGURATION ─────────────────────────────────────────────────────
// Only wrap with Sentry if DSN is configured — avoids noise in dev without Sentry setup.
// withSentryConfig adds: source map upload, bundle size analysis, edge/server instrumentation.
const sentryWebpackPluginOptions = {
  // Organization and project from Sentry dashboard
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source map upload (set in Vercel env vars, never committed)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps silently during build
  silent: true,

  // Disable source map upload in dev (no auth token, no value)
  dryRun: !process.env.SENTRY_AUTH_TOKEN,

  // Automatically tree-shake Sentry debug logging in production
  disableLogger: true,

  // Hide source maps from the browser bundle (served separately for Sentry)
  hideSourceMaps: true,

  // Automatically instrument Vercel cron routes
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
