/**
 * COVOS Telemetry Cron — FEAT-020
 *
 * Runs daily at 5am UTC. Aggregates yesterday's DashboardEvents by
 * eventType + feature, anonymizes them, and ships to COVOS central endpoint.
 * If COVOS_TELEMETRY_ENDPOINT is not set, exits cleanly.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelemetry } from "@/lib/telemetry/covos";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Aggregate yesterday's events
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  const todayMidnight = new Date(yesterday);
  todayMidnight.setUTCDate(yesterday.getUTCDate() + 1);

  const day = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // Group by eventType + feature and count
    const rows = await prisma.dashboardEvent.groupBy({
      by: ["eventType", "feature"],
      where: {
        occurredAt: {
          gte: yesterday,
          lt: todayMidnight,
        },
      },
      _count: { _all: true },
    });

    if (rows.length === 0) {
      return NextResponse.json({ shipped: 0, day, message: "No events for yesterday" });
    }

    const events = rows.map((r) => ({
      eventType: r.eventType,
      feature: r.feature ?? null,
      count: r._count._all,
      day,
    }));

    await sendTelemetry(events);

    console.log(`[covos-telemetry] Shipped ${events.length} event groups for ${day}`);
    return NextResponse.json({ shipped: events.length, day });
  } catch (err) {
    console.error("[covos-telemetry] Failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
