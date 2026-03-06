// src/lib/intel/scan-orchestrator.ts
// Intelligence Engine — Sprint IE-02 + IE-03 + IE-05
// Orchestrates a full scan: fetches assets/competitors, runs sensors,
// stores snapshots, calculates deltas, evaluates thresholds, generates tasks,
// and persists IntelIndexHealth from GSC sensor data (IE-05).
// NEVER throws — marks scan as partial/failed and returns a summary.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSensor } from "./sensors/sensor-interface";
import type { SensorResult } from "./sensors/sensor-interface";
import { calculateDeltas } from "./delta-engine";
import type { MetricDelta } from "./delta-engine";
import { computeAndPersistHealthScore } from "./health-score";
import { evaluateRules } from "./threshold-engine";
import type { SnapshotContext } from "./threshold-engine";
import { generateTasks } from "./task-generator";
import { getThresholdRules } from "./threshold-rules";
import { getVerticalProfile } from "./verticals";
// ── IE-06: Advanced patterns ───────────────────────────────────────────────────
import { detectSeasonalPatterns, persistSeasonalTasks } from "./patterns/seasonal";
import { detectUpsellOpportunities } from "./patterns/upsell";
import { detectCannibalization } from "./patterns/cannibalization";
import { notifyP1Tasks } from "./notify-p1";
import {
  withRetry,
  isDeadLettered,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_SENSOR_TIMEOUT_MS,
} from "./scan-hardening";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ScanSummary {
  scanId: number;
  status: "complete" | "partial" | "failed";
  snapshotCount: number;
  alertCount: number;
  tasksGenerated: number;
  sensorsRun: string[];
  sensorsFailed: Record<string, string>;
  apiCosts: Record<string, number>;
  durationMs: number;
}

interface ScanTarget {
  id: number;
  domain: string;
  entityType: "asset" | "competitor";
  name?: string;
  googlePlaceId?: string;
}

// ── Credential fetch ───────────────────────────────────────────────────────────

async function getCredentialsForTenant(
  tenantId: number
): Promise<Record<string, Record<string, string>>> {
  const rows = await prisma.intelSensorCredential.findMany({
    where: { tenantId, isActive: true, status: "active" },
  });
  const out: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    out[row.sensorId] = row.credentials as Record<string, string>;
  }
  return out;
}


// ── Resolve ClientProfile ID from an asset group ─────────────────────────────
// Returns null for affiliate/portfolio groups — task creation is skipped for those.

async function resolveClientProfileId(
  assetGroupId: number | null
): Promise<number | null> {
  if (!assetGroupId) return null;
  const group = await prisma.intelAssetGroup.findUnique({
    where: { id: assetGroupId },
    select: { clientProfileId: true },
  });
  return group?.clientProfileId ?? null;
}

// ── Previous snapshot lookup ───────────────────────────────────────────────────

async function getPreviousMetrics(
  assetId: number | null,
  competitorId: number | null,
  currentScanId: number
): Promise<Record<string, unknown> | undefined> {
  const where =
    assetId !== null
      ? { assetId, scanId: { not: currentScanId } }
      : { competitorId: competitorId!, scanId: { not: currentScanId } };

  const prev = await prisma.intelSnapshot.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });
  return prev ? (prev.metrics as Record<string, unknown>) : undefined;
}

// ── Run one sensor against one target (hardened — IE-06) ──────────────────────

async function runSensor(
  sensorId: string,
  target: ScanTarget,
  credentials: Record<string, Record<string, string>>,
  tenantId: number,
  previousMetrics?: Record<string, unknown>
): Promise<SensorResult> {
  const sensor = await getSensor(sensorId);
  if (!sensor) {
    return {
      sensorId,
      success: false,
      metrics: {},
      error: `Sensor "${sensorId}" not found in registry`,
      collectedAt: new Date(),
    };
  }

  // Dead letter check — skip persistently failing sensor+domain pairs
  if (await isDeadLettered(tenantId, sensorId, target.domain)) {
    return {
      sensorId,
      success: false,
      metrics: {},
      error: `SKIPPED: ${sensorId}/${target.domain} is in dead letter queue`,
      collectedAt: new Date(),
    };
  }

  // Hardened execution: exponential backoff + per-sensor timeout
  const runResult = await withRetry(
    sensorId,
    target.domain,
    tenantId,
    () =>
      sensor.collect({
        target: { domain: target.domain, googlePlaceId: target.googlePlaceId },
        credentials: credentials[sensorId] ?? {},
        previousMetrics,
      }),
    DEFAULT_RETRY_CONFIG,
    DEFAULT_SENSOR_TIMEOUT_MS
  );

  if (runResult.success && runResult.value) {
    return runResult.value;
  }

  return {
    sensorId,
    success: false,
    metrics: {},
    error: runResult.error ?? "Unknown error after retries",
    collectedAt: new Date(),
  };
}

// ── Determine vertical for this asset group ────────────────────────────────────

async function resolveVerticalId(
  tenantId: number,
  assetGroupId: number | null
): Promise<string> {
  if (assetGroupId) {
    const group = await prisma.intelAssetGroup.findUnique({
      where: { id: assetGroupId },
      select: { clientProfileId: true, verticalMeta: true },
    });
    if (group?.clientProfileId) return "seo-agency";
    const meta = group?.verticalMeta as Record<string, unknown> | null;
    if (typeof meta?.verticalId === "string") return meta.verticalId;
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { verticalType: true },
  });
  // Map DB verticalType values to profile IDs
  const typeMap: Record<string, string> = {
    seo_agency:          "seo-agency",
    affiliate_portfolio: "affiliate",
    "seo-agency":        "seo-agency",
    affiliate:           "affiliate",
  };
  return typeMap[tenant?.verticalType ?? ""] ?? "local-service";
}

/** Get ordered sensor IDs for a vertical, falling back to defaults */
function getSensorsForVertical(verticalId: string): string[] {
  try {
    const profile = getVerticalProfile(verticalId);
    return profile.sensors
      .filter((s) => s.defaultEnabled)
      .map((s) => s.sensorId);
  } catch {
    // Unknown vertical — fall back to free sensors only
    return ["pagespeed"];
  }
}

// ── Index Health persistence (IE-05) ──────────────────────────────────────────

async function persistIndexHealth(
  assetId: number,
  scanId: number,
  gscMetrics: Record<string, unknown>,
  previousMetrics: Record<string, unknown> | null
): Promise<void> {
  const pagesSubmitted = gscMetrics["pagesSubmitted"] as number | null ?? null;
  const pagesIndexed   = gscMetrics["pagesIndexed"]   as number | null ?? null;
  const indexRatio     = gscMetrics["indexRatio"]     as number | null ?? null;
  const sitemapValid   = gscMetrics["sitemapValid"]   as boolean | null ?? null;
  const crawlErrors    = (gscMetrics["crawlErrors"]   ?? []) as unknown[];
  const manualActions  = (gscMetrics["manualActions"] ?? []) as unknown[];

  // Calculate deltas vs previous GSC snapshot if available
  const deltas: Record<string, unknown> = {};
  if (previousMetrics) {
    const prevIndexed = previousMetrics["pagesIndexed"] as number | null;
    if (prevIndexed !== null && prevIndexed !== undefined && pagesIndexed !== null) {
      deltas["pagesIndexedDelta"] = pagesIndexed - prevIndexed;
      deltas["pagesIndexedDeltaPct"] = prevIndexed > 0
        ? ((pagesIndexed - prevIndexed) / prevIndexed) * 100
        : null;
    }
  }

  await prisma.intelIndexHealth.create({
    data: {
      assetId,
      scanId,
      pagesSubmitted,
      pagesIndexed,
      indexRatio,
      crawlErrors:  crawlErrors  as Prisma.InputJsonValue,
      sitemapValid,
      manualActions: manualActions as Prisma.InputJsonValue,
      deltas:        Object.keys(deltas).length > 0
        ? (deltas as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
}

/** Generate P1 tasks for index anomalies */
async function checkIndexAnomalies(
  assetId: number,
  scanId: number,
  clientProfileId: number | null,
  tenantId: number,
  gscMetrics: Record<string, unknown>,
  previousGscMetrics: Record<string, unknown> | null
): Promise<number> {
  const manualActions = (gscMetrics["manualActions"] ?? []) as string[];
  const indexRatio    = gscMetrics["indexRatio"]     as number | null;
  const prevRatio     = previousGscMetrics?.["indexRatio"] as number | null;

  let tasksCreated = 0;
  const asset = await prisma.intelAsset.findUnique({
    where: { id: assetId },
    select: { name: true, domain: true },
  });
  const assetName = asset?.name ?? asset?.domain ?? `Asset ${assetId}`;

  // Manual action detected (only for SEO agency groups with a client profile)
  if (clientProfileId && Array.isArray(manualActions) && manualActions.length > 0) {
    await prisma.clientTask.create({
      data: {
        title:       `URGENT: Manual action detected on ${assetName}`,
        description: `Google Search Console reports a manual action on ${assetName}. ` +
                     `Actions: ${manualActions.join(", ")}. ` +
                     `This must be resolved immediately to restore search visibility.`,
        category:    "technical_seo",
        priority:    "P1",
        status:      "queued",
        source:      "intelligence_engine",
        intelScanId: scanId,
        clientId:    clientProfileId!,
      },
    });
    tasksCreated++;
  }

  // Sudden index drop (>20% from previous scan, SEO agency groups only)
  if (clientProfileId && indexRatio !== null && prevRatio !== null && prevRatio > 0) {
    const drop = (prevRatio - indexRatio) / prevRatio;
    if (drop >= 0.2) {
      const pct = Math.round(drop * 100);
      await prisma.clientTask.create({
        data: {
          title:       `Index coverage dropped ${pct}% on ${assetName}`,
          description: `Index ratio fell from ${Math.round(prevRatio * 100)}% to ${Math.round(indexRatio * 100)}% ` +
                       `since the last scan. Investigate crawl errors, sitemaps, and robots.txt. ` +
                       `Check for accidental noindex tags or server-side blocks.`,
          category:    "technical_seo",
          priority:    "P1",
          status:      "queued",
          source:      "intelligence_engine",
          intelScanId: scanId,
          clientId:    clientProfileId!,
        },
      });
      tasksCreated++;
    }
  }

  return tasksCreated;
}

// ── Main entry point ───────────────────────────────────────────────────────────

export async function executeScan(
  tenantId: number,
  assetGroupId?: number
): Promise<ScanSummary> {
  const startedAt = new Date();
  const toJson = <T>(v: T): Prisma.InputJsonValue =>
    JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

  const scan = await prisma.intelScan.create({
    data: {
      tenantId,
      assetGroupId: assetGroupId ?? null,
      scheduledAt: startedAt,
      startedAt,
      status: "running",
    },
  });

  const sensorsRun: string[] = [];
  const sensorsFailed: Record<string, string> = {};
  const apiCosts: Record<string, number> = {};
  let snapshotCount = 0;
  let alertCount = 0;
  let tasksGenerated = 0;

  const snapshotContexts: SnapshotContext[] = [];

  try {
    const credentials = await getCredentialsForTenant(tenantId);

    const assetWhere = assetGroupId
      ? { tenantId, assetGroupId, status: "active" }
      : { tenantId, status: "active" };

    const assets = await prisma.intelAsset.findMany({ where: assetWhere });
    const competitors = assetGroupId
      ? await prisma.intelCompetitor.findMany({
          where: { tenantId, assetGroupId, isActive: true },
        })
      : [];

    const assetMap     = new Map(assets.map((a) => [a.id, a]));
    const competitorMap = new Map(competitors.map((c) => [c.id, c]));

    const targets: ScanTarget[] = [
      ...assets.map((a) => ({
        id:           a.id,
        domain:       a.domain,
        name:         a.name,
        entityType:   "asset" as const,
      })),
      ...competitors
        .filter((c) => !!c.domain)
        .map((c) => ({
          id:           c.id,
          domain:       c.domain!,
          name:         c.name,
          entityType:   "competitor" as const,
          googlePlaceId: c.googlePlaceId ?? undefined,
        })),
    ];

    // Resolve which sensors to run for this vertical
    const verticalId  = await resolveVerticalId(tenantId, assetGroupId ?? null);
    const sensorOrder = getSensorsForVertical(verticalId);

    // ── Sensor pass ────────────────────────────────────────────────────────────
    for (const sensorId of sensorOrder) {
      let sensorSucceeded = false;

      for (const target of targets) {
        try {
          const previousMetrics = await getPreviousMetrics(
            target.entityType === "asset" ? target.id : null,
            target.entityType === "competitor" ? target.id : null,
            scan.id
          );

          const result = await runSensor(sensorId, target, credentials, tenantId, previousMetrics);

          if (result.cost && result.cost > 0) {
            apiCosts[sensorId] = (apiCosts[sensorId] ?? 0) + result.cost;
          }

          if (!result.success) {
            const isSkipped = result.error?.startsWith("SKIPPED:");
            if (!isSkipped) {
              sensorsFailed[sensorId] = result.error ?? "Unknown error";
            }
            continue;
          }

          sensorSucceeded = true;

          const { deltas, velocity, alerts } = calculateDeltas(
            result.metrics,
            previousMetrics ?? null
          );

          alertCount += alerts.length;

          const snapshot = await prisma.intelSnapshot.create({
            data: {
              scanId:      scan.id,
              entityType:  target.entityType,
              assetId:     target.entityType === "asset"      ? target.id : null,
              competitorId: target.entityType === "competitor" ? target.id : null,
              metrics:  toJson(result.metrics),
              deltas:   toJson(deltas ?? {}),
              velocity: toJson(velocity ?? {}),
              alerts:   toJson(alerts),
            },
          });

          snapshotCount++;

          // ── IE-05: Persist IntelIndexHealth after successful GSC sensor run ──
          if (sensorId === "gsc" && target.entityType === "asset") {
            try {
              await persistIndexHealth(
                target.id,
                scan.id,
                result.metrics,
                previousMetrics ?? null
              );
              // Check for index anomalies → P1 tasks
              const clientProfileId = await resolveClientProfileId(assetGroupId ?? null);
              const anomalyTasks = await checkIndexAnomalies(
                target.id,
                scan.id,
                clientProfileId,
                tenantId,
                result.metrics,
                previousMetrics ?? null
              );
              tasksGenerated += anomalyTasks;
            } catch (indexErr) {
              const msg = indexErr instanceof Error ? indexErr.message : String(indexErr);
              sensorsFailed[`gsc_index_health:${target.domain}`] = msg;
            }
          }

          // ── Accumulate snapshot context for threshold evaluation ─────────────
          if (target.entityType === "asset") {
            const asset = assetMap.get(target.id);
            snapshotContexts.push({
              snapshotId:   snapshot.id,
              entityType:   "asset",
              assetId:      target.id,
              competitorId: null,
              assetName:    asset?.name ?? target.domain,
              assetDomain:  target.domain,
              metrics:  result.metrics,
              deltas:   deltas as Record<string, MetricDelta> | null,
            });
          } else {
            const competitor = competitorMap.get(target.id);
            snapshotContexts.push({
              snapshotId:       snapshot.id,
              entityType:       "competitor",
              assetId:          null,
              competitorId:     target.id,
              competitorName:   competitor?.name ?? target.domain,
              competitorDomain: target.domain,
              metrics:  result.metrics,
              deltas:   deltas as Record<string, MetricDelta> | null,
            });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sensorsFailed[`${sensorId}:${target.domain}`] = msg;
        }
      }

      if (sensorSucceeded) sensorsRun.push(sensorId);
    }

    // ── Health scores ──────────────────────────────────────────────────────────
    const assetIds = assets.map((a) => a.id);
    if (assetIds.length > 0) {
      await prisma.intelAsset.updateMany({
        where: { id: { in: assetIds } },
        data: {
          lastScanAt: new Date(),
          nextScanAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      for (const asset of assets) {
        await computeAndPersistHealthScore(asset.id, scan.id).catch(() => {});
      }
    }

    // ── Threshold evaluation + task generation (IE-03) ─────────────────────────
    const allGeneratedTaskIds: number[] = [];

    if (snapshotContexts.length > 0) {
      try {
        const rules   = getThresholdRules(verticalId);
        const matches = evaluateRules(rules, snapshotContexts);
        if (matches.length > 0) {
          const taskResult = await generateTasks({
            matches,
            scanId:       scan.id,
            assetGroupId: assetGroupId ?? null,
            tenantId,
          });
          tasksGenerated += taskResult.created;
          allGeneratedTaskIds.push(...taskResult.taskIds);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sensorsFailed["task_generator"] = msg;
      }
    }

    // ── IE-06: Advanced pattern detection ─────────────────────────────────────
    if (assetGroupId) {
      // Seasonal pattern detection (requires 6+ months of data — degrades gracefully)
      try {
        const seasonalResult = await detectSeasonalPatterns(tenantId, assetGroupId);
        if (seasonalResult.status === "ok") {
          const seasonalCreated = await persistSeasonalTasks(
            assetGroupId,
            scan.id,
            seasonalResult
          );
          tasksGenerated += seasonalCreated;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sensorsFailed["seasonal_patterns"] = msg;
      }

      // Upsell detection (SEO agency groups only — no-op for affiliate)
      try {
        const upsellResult = await detectUpsellOpportunities(
          tenantId,
          assetGroupId,
          scan.id
        );
        tasksGenerated += upsellResult.tasksCreated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sensorsFailed["upsell_detection"] = msg;
      }

      // Keyword cannibalization (asset groups with 2+ assets)
      try {
        const cannibResult = await detectCannibalization(
          tenantId,
          assetGroupId,
          scan.id
        );
        tasksGenerated += cannibResult.tasksCreated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sensorsFailed["cannibalization_detection"] = msg;
      }
    }

    // ── IE-06: P1 task notifications ───────────────────────────────────────────
    if (allGeneratedTaskIds.length > 0) {
      notifyP1Tasks(tenantId, allGeneratedTaskIds).catch(() => {
        // Notifications are non-fatal — never block scan completion
      });
    }

    // ── Finalise scan record ───────────────────────────────────────────────────
    const hasFailed = Object.keys(sensorsFailed).length > 0;
    const status =
      sensorsRun.length === 0 ? "failed" : hasFailed ? "partial" : "complete";

    await prisma.intelScan.update({
      where: { id: scan.id },
      data: {
        completedAt: new Date(),
        status,
        sensorsRun,
        sensorsFailed,
        snapshotCount,
        alertCount,
        tasksGenerated,
        apiCosts,
      },
    });

    return {
      scanId: scan.id,
      status,
      snapshotCount,
      alertCount,
      tasksGenerated,
      sensorsRun,
      sensorsFailed,
      apiCosts,
      durationMs: Date.now() - startedAt.getTime(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.intelScan.update({
      where: { id: scan.id },
      data: {
        completedAt: new Date(),
        status: "failed",
        sensorsFailed: { orchestrator: msg },
      },
    });
    return {
      scanId: scan.id,
      status: "failed",
      snapshotCount: 0,
      alertCount: 0,
      tasksGenerated: 0,
      sensorsRun: [],
      sensorsFailed: { orchestrator: msg },
      apiCosts: {},
      durationMs: Date.now() - startedAt.getTime(),
    };
  }
}
