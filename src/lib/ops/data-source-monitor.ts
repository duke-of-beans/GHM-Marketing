/**
 * Data Source Health Monitor
 * src/lib/ops/data-source-monitor.ts
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type DataProvider =
  | "dataforseo"
  | "ahrefs"
  | "pagespeed"
  | "google_business"
  | "google_ads"
  | "wave"
  | "outscraper";

const PROVIDER_DISPLAY_NAMES: Record<DataProvider, string> = {
  dataforseo:      "DataForSEO",
  ahrefs:          "Ahrefs",
  pagespeed:       "PageSpeed Insights",
  google_business: "Google Business Profile",
  google_ads:      "Google Ads",
  wave:            "Wave Accounting",
  outscraper:      "Outscraper",
};

const DEGRADED_THRESHOLD = 3;
const DOWN_THRESHOLD = 10;

function toJson(v: Record<string, unknown> | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return v !== undefined ? (v as Prisma.InputJsonValue) : Prisma.DbNull;
}

export async function recordProviderSuccess(
  provider: DataProvider,
  latencyMs: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const existing = await prisma.dataSourceStatus.findUnique({ where: { provider } });
  const prevStatus = existing?.status ?? "unknown";

  await prisma.dataSourceStatus.upsert({
    where: { provider },
    create: {
      provider,
      displayName: PROVIDER_DISPLAY_NAMES[provider],
      status: "healthy",
      lastCheckAt: new Date(),
      lastSuccessAt: new Date(),
      consecutiveFailures: 0,
      avgLatencyMs: latencyMs,
      errorMessage: null,
      metadata: toJson(metadata),
    },
    update: {
      status: "healthy",
      lastCheckAt: new Date(),
      lastSuccessAt: new Date(),
      consecutiveFailures: 0,
      avgLatencyMs: latencyMs,
      errorMessage: null,
      metadata: toJson(metadata),
    },
  });

  if (prevStatus === "degraded" || prevStatus === "down") {
    await fireStatusChangeAlert(provider, prevStatus, "healthy");
  }
}

export async function recordProviderFailure(
  provider: DataProvider,
  error: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  const existing = await prisma.dataSourceStatus.findUnique({ where: { provider } });
  const prevFailures = existing?.consecutiveFailures ?? 0;
  const newFailures = prevFailures + 1;
  const prevStatus = existing?.status ?? "unknown";

  const newStatus = newFailures >= DOWN_THRESHOLD ? "down" : "degraded";
  const errorMessage = error instanceof Error ? error.message : String(error);

  await prisma.dataSourceStatus.upsert({
    where: { provider },
    create: {
      provider,
      displayName: PROVIDER_DISPLAY_NAMES[provider],
      status: newStatus,
      lastCheckAt: new Date(),
      lastFailureAt: new Date(),
      consecutiveFailures: newFailures,
      errorMessage,
      metadata: toJson(metadata),
    },
    update: {
      status: newStatus,
      lastCheckAt: new Date(),
      lastFailureAt: new Date(),
      consecutiveFailures: newFailures,
      errorMessage,
      metadata: toJson(metadata),
    },
  });

  if (newStatus !== prevStatus) {
    await fireStatusChangeAlert(provider, prevStatus, newStatus);
  }
}

async function fireStatusChangeAlert(
  provider: DataProvider,
  fromStatus: string,
  toStatus: string
): Promise<void> {
  try {
    const { evaluateAlertRules } = await import("./alert-engine");
    await evaluateAlertRules({
      sourceType: "health",
      sourceId: 0,
      clientId: 0,
      data: { provider, displayName: PROVIDER_DISPLAY_NAMES[provider], fromStatus, toStatus,
              isDown: toStatus === "down", isDegraded: toStatus === "degraded", isRecovered: toStatus === "healthy" },
    });

    if (toStatus === "down" || toStatus === "degraded") {
      await prisma.alertEvent.create({
        data: {
          type: "health_degraded",
          severity: toStatus === "down" ? "critical" : "warning",
          title: `${PROVIDER_DISPLAY_NAMES[provider]} is ${toStatus}`,
          description: `Provider status changed from ${fromStatus} to ${toStatus}`,
          sourceType: "health",
          metadata: { provider, fromStatus, toStatus } as Prisma.InputJsonValue,
        },
      });
    }
  } catch (err) {
    console.error("[data-source-monitor] Alert fire failed:", err);
  }
}

export async function withProviderTracking<T>(
  provider: DataProvider,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    void recordProviderSuccess(provider, Date.now() - start);
    return result;
  } catch (err) {
    void recordProviderFailure(provider, err);
    throw err;
  }
}

export async function initDataSourceStatus(): Promise<void> {
  const providers = Object.keys(PROVIDER_DISPLAY_NAMES) as DataProvider[];
  for (const provider of providers) {
    await prisma.dataSourceStatus.upsert({
      where: { provider },
      create: { provider, displayName: PROVIDER_DISPLAY_NAMES[provider], status: "unknown" },
      update: {},
    });
  }
}
