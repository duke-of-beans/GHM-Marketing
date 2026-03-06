// src/app/api/cron/intel-scan-scheduler/route.ts
// Daily cron — runs at 3:30am UTC (staggered away from other crons)
// Queries IntelAssets where nextScanAt <= now(), groups by asset group,
// triggers executeScan for each group with per-group staggering.
// Retries sensors that failed in the previous scan (via orchestrator partial logic).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeScan } from "@/lib/intel/scan-orchestrator";

export const dynamic = "force-dynamic";
// Vercel function timeout — scans can take time
export const maxDuration = 300;

// ── Stagger delay between groups ─────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STAGGER_MS = 2_000; // 2s between asset groups to avoid API rate limits

// ── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const now = new Date();

  try {
    // Find all assets due for a scan
    const dueAssets = await prisma.intelAsset.findMany({
      where: {
        status: "active",
        OR: [
          { nextScanAt: { lte: now } },
          { nextScanAt: null }, // Never scanned
        ],
      },
      select: {
        id: true,
        tenantId: true,
        assetGroupId: true,
        domain: true,
      },
    });

    if (dueAssets.length === 0) {
      console.log("[intel-scan-scheduler] No assets due for scan");
      return NextResponse.json({ scanned: 0, message: "No assets due" });
    }

    console.log(`[intel-scan-scheduler] ${dueAssets.length} assets due for scan`);

    // Group by (tenantId, assetGroupId) — scan at group level when possible
    const groups = new Map<string, { tenantId: number; assetGroupId: number | null }>();

    for (const asset of dueAssets) {
      const key = `${asset.tenantId}:${asset.assetGroupId ?? "null"}`;
      if (!groups.has(key)) {
        groups.set(key, {
          tenantId: asset.tenantId,
          assetGroupId: asset.assetGroupId,
        });
      }
    }

    const scanResults: Array<{
      tenantId: number;
      assetGroupId: number | null;
      scanId: number;
      status: string;
      snapshotCount: number;
    }> = [];
    const errors: Array<{ tenantId: number; assetGroupId: number | null; error: string }> = [];
    let groupIndex = 0;

    for (const [, group] of groups) {
      if (groupIndex > 0) {
        await delay(STAGGER_MS);
      }
      groupIndex++;

      try {
        const summary = await executeScan(
          group.tenantId,
          group.assetGroupId ?? undefined
        );
        scanResults.push({
          tenantId: group.tenantId,
          assetGroupId: group.assetGroupId,
          scanId: summary.scanId,
          status: summary.status,
          snapshotCount: summary.snapshotCount,
        });
        console.log(
          `[intel-scan-scheduler] scan ${summary.scanId} — ` +
          `tenant ${group.tenantId}, group ${group.assetGroupId ?? "all"} → ` +
          `${summary.status} (${summary.snapshotCount} snapshots, ${summary.alertCount} alerts)`
        );
      } catch (err) {
        // Orchestrator should never throw, but catch defensively
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({
          tenantId: group.tenantId,
          assetGroupId: group.assetGroupId,
          error: msg,
        });
        console.error(
          `[intel-scan-scheduler] ERROR tenant ${group.tenantId} group ${group.assetGroupId}: ${msg}`
        );
      }
    }

    const durationMs = Date.now() - startedAt.getTime();
    const complete = scanResults.filter((r) => r.status === "complete").length;
    const partial = scanResults.filter((r) => r.status === "partial").length;
    const failed = scanResults.filter((r) => r.status === "failed").length + errors.length;

    console.log(
      `[intel-scan-scheduler] Done in ${durationMs}ms — ` +
      `${complete} complete, ${partial} partial, ${failed} failed`
    );

    return NextResponse.json({
      scanned: scanResults.length,
      complete,
      partial,
      failed,
      durationMs,
      results: scanResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[intel-scan-scheduler] Top-level error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
