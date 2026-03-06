// src/lib/intel/scan-orchestrator.ts
// Intelligence Engine — Sprint IE-02
// Orchestrates a full scan: fetches assets/competitors, runs sensors,
// stores snapshots, calculates deltas. NEVER throws — marks scan as partial.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSensor } from "./sensors/sensor-interface";
import type { SensorResult } from "./sensors/sensor-interface";
import { calculateDeltas } from "./delta-engine";
import { computeAndPersistHealthScore } from "./health-score";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScanSummary {
  scanId: number;
  status: "complete" | "partial" | "failed";
  snapshotCount: number;
  alertCount: number;
  sensorsRun: string[];
  sensorsFailed: Record<string, string>;
  apiCosts: Record<string, number>;
  durationMs: number;
}

interface ScanTarget {
  id: number;
  domain: string;
  entityType: "asset" | "competitor";
}

// Active sensors for a basic vertical — will be driven by vertical profiles in IE-03+
const DEFAULT_SENSORS = ["pagespeed", "ahrefs"];

// ── Credential fetch ─────────────────────────────────────────────────────────

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

// ── Previous snapshot lookup ─────────────────────────────────────────────────

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

// ── Run one sensor against one target ────────────────────────────────────────

async function runSensor(
  sensorId: string,
  target: ScanTarget,
  credentials: Record<string, Record<string, string>>
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
  return sensor.collect({
    target: { domain: target.domain },
    credentials: credentials[sensorId] ?? {},
  });
}

// ── Main entry point ─────────────────────────────────────────────────────────

export async function executeScan(
  tenantId: number,
  assetGroupId?: number
): Promise<ScanSummary> {
  const startedAt = new Date();

  // Create the scan record immediately so we have an ID
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

  try {
    // Fetch credentials once for this tenant
    const credentials = await getCredentialsForTenant(tenantId);

    // Gather scan targets (assets + competitors)
    const assetWhere = assetGroupId
      ? { tenantId, assetGroupId, status: "active" }
      : { tenantId, status: "active" };

    const assets = await prisma.intelAsset.findMany({ where: assetWhere });
    const competitors = assetGroupId
      ? await prisma.intelCompetitor.findMany({
          where: { tenantId, assetGroupId, isActive: true },
        })
      : [];

    const targets: ScanTarget[] = [
      ...assets.map((a) => ({
        id: a.id,
        domain: a.domain,
        entityType: "asset" as const,
      })),
      ...competitors
        .filter((c) => !!c.domain)
        .map((c) => ({
          id: c.id,
          domain: c.domain!,
          entityType: "competitor" as const,
        })),
    ];

    // Run each sensor across each target
    for (const sensorId of DEFAULT_SENSORS) {
      let sensorSucceeded = false;

      for (const target of targets) {
        try {
          const result = await runSensor(sensorId, target, credentials);

          // Track costs per sensor
          if (result.cost && result.cost > 0) {
            apiCosts[sensorId] = (apiCosts[sensorId] ?? 0) + result.cost;
          }

          if (!result.success) {
            // SKIPPED is not a failure — it means no credentials
            const isSkipped = result.error?.startsWith("SKIPPED:");
            if (!isSkipped) {
              sensorsFailed[sensorId] = result.error ?? "Unknown error";
            }
            continue;
          }

          sensorSucceeded = true;

          // Fetch previous snapshot for delta calculation
          const previousMetrics = await getPreviousMetrics(
            target.entityType === "asset" ? target.id : null,
            target.entityType === "competitor" ? target.id : null,
            scan.id
          );

          // Calculate deltas (handles null previousMetrics gracefully)
          const { deltas, velocity, alerts } = calculateDeltas(
            result.metrics,
            previousMetrics ?? null
          );

          alertCount += alerts.length;

          // Persist snapshot — cast to Prisma.InputJsonValue for Json fields
          const toJson = <T>(v: T): Prisma.InputJsonValue =>
            JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

          await prisma.intelSnapshot.create({
            data: {
              scanId: scan.id,
              entityType: target.entityType,
              assetId: target.entityType === "asset" ? target.id : null,
              competitorId:
                target.entityType === "competitor" ? target.id : null,
              metrics: toJson(result.metrics),
              deltas: toJson(deltas ?? {}),
              velocity: toJson(velocity ?? {}),
              alerts: toJson(alerts),
            },
          });

          snapshotCount++;
        } catch (err) {
          // Per-target error — log but continue
          const msg = err instanceof Error ? err.message : String(err);
          sensorsFailed[`${sensorId}:${target.domain}`] = msg;
        }
      }

      if (sensorSucceeded) sensorsRun.push(sensorId);
    }

    // Update asset lastScanAt + nextScanAt, compute health scores
    const assetIds = assets.map((a) => a.id);
    if (assetIds.length > 0) {
      await prisma.intelAsset.updateMany({
        where: { id: { in: assetIds } },
        data: {
          lastScanAt: new Date(),
          nextScanAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Compute health scores for each asset
      for (const asset of assets) {
        await computeAndPersistHealthScore(asset.id, scan.id).catch(() => {
          // Health score failure is non-fatal
        });
      }
    }

    const hasFailed = Object.keys(sensorsFailed).length > 0;
    const status =
      sensorsRun.length === 0
        ? "failed"
        : hasFailed
        ? "partial"
        : "complete";

    await prisma.intelScan.update({
      where: { id: scan.id },
      data: {
        completedAt: new Date(),
        status,
        sensorsRun,
        sensorsFailed,
        snapshotCount,
        alertCount,
        apiCosts,
      },
    });

    return {
      scanId: scan.id,
      status,
      snapshotCount,
      alertCount,
      sensorsRun,
      sensorsFailed,
      apiCosts,
      durationMs: Date.now() - startedAt.getTime(),
    };
  } catch (err) {
    // Top-level catch — mark scan as failed, never rethrow
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
      sensorsRun: [],
      sensorsFailed: { orchestrator: msg },
      apiCosts: {},
      durationMs: Date.now() - startedAt.getTime(),
    };
  }
}
