/**
 * src/lib/logger.ts
 *
 * Structured logger for GHM Dashboard.
 * - Production: JSON output via pino (machine-parseable, Vercel log drain compatible)
 * - Development: pretty-printed via pino-pretty
 * - Attaches correlation IDs automatically when called from API route context
 *
 * Usage:
 *   import { log } from '@/lib/logger'
 *   log.info({ clientId: 5, count: 3 }, 'Payment transactions created')
 *   log.warn({ userId: 1 }, 'Rate limit threshold approaching')
 *   log.error({ error: e, cron: 'generate-payments' }, 'Cron job failed')
 */

import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

// Build the pino logger. In dev we use pino-pretty via transport;
// in prod we emit raw JSON (Vercel captures and indexes it).
const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    base: {
      // Tag every log line with the service name so Vercel log drains
      // and Sentry breadcrumbs can identify the source.
      service: "ghm-dashboard",
      env: process.env.NODE_ENV ?? "production",
    },
    // ISO timestamp on every line
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields everywhere — belt-and-suspenders against
    // accidentally logging request bodies that contain passwords/tokens.
    redact: {
      paths: ["password", "passwordHash", "token", "secret", "authorization"],
      censor: "[REDACTED]",
    },
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,service,env",
        },
      })
    : undefined
);

// ── Typed log namespace (prevents raw pino leaking into callsites) ──────────

export type LogMeta = Record<string, unknown>;

export const log = {
  /** Informational — normal operational events */
  info(meta: LogMeta | string, msg?: string) {
    if (typeof meta === "string") {
      logger.info({}, meta);
    } else {
      logger.info(meta, msg ?? "");
    }
  },

  /** Warnings — recoverable issues worth surfacing */
  warn(meta: LogMeta | string, msg?: string) {
    if (typeof meta === "string") {
      logger.warn({}, meta);
    } else {
      logger.warn(meta, msg ?? "");
    }
  },

  /** Errors — caught exceptions, cron failures, API errors */
  error(meta: LogMeta | string, msg?: string) {
    if (typeof meta === "string") {
      logger.error({}, meta);
    } else {
      // Serialize Error objects so pino captures stack traces properly
      if (meta.error instanceof Error) {
        meta = {
          ...meta,
          error: {
            message: meta.error.message,
            stack: meta.error.stack,
            name: meta.error.name,
          },
        };
      }
      logger.error(meta, msg ?? "");
    }
  },

  /**
   * Create a child logger pre-bound with correlation context.
   * Call this at the top of an API route handler:
   *
   *   const reqLog = log.child({ requestId: req.headers.get('x-request-id'), path: req.nextUrl.pathname })
   *   reqLog.info({ userId }, 'Processing request')
   */
  child(meta: LogMeta) {
    const child = logger.child(meta);
    return {
      info: (m: LogMeta | string, msg?: string) => {
        if (typeof m === "string") child.info({}, m);
        else child.info(m, msg ?? "");
      },
      warn: (m: LogMeta | string, msg?: string) => {
        if (typeof m === "string") child.warn({}, m);
        else child.warn(m, msg ?? "");
      },
      error: (m: LogMeta | string, msg?: string) => {
        if (typeof m === "string") child.error({}, m);
        else {
          if (m.error instanceof Error) {
            m = {
              ...m,
              error: { message: m.error.message, stack: m.error.stack, name: m.error.name },
            };
          }
          child.error(m, msg ?? "");
        }
      },
    };
  },
};

export default log;
