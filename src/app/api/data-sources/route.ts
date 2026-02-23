/**
 * GET /api/data-sources — List all provider health statuses
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";
import { initDataSourceStatus } from "@/lib/ops/data-source-monitor";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Ensure rows exist for all known providers
    await initDataSourceStatus();

    const sources = await prisma.dataSourceStatus.findMany({
      orderBy: { provider: "asc" },
    });

    const summary = {
      healthy:  sources.filter((s) => s.status === "healthy").length,
      degraded: sources.filter((s) => s.status === "degraded").length,
      down:     sources.filter((s) => s.status === "down").length,
      unknown:  sources.filter((s) => s.status === "unknown").length,
    };

    return NextResponse.json({ sources, summary });
  } catch (err) {
    console.error("[GET /api/data-sources]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
