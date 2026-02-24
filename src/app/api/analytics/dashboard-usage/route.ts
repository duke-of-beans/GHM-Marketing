import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

// GET /api/analytics/dashboard-usage
// Admin-only. Returns aggregated platform usage metrics.
export async function GET() {
  await requirePermission("manage_settings");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [featureRaw, pageRaw, dauRaw, userRaw] = await Promise.all([
    // Feature heatmap — count by feature name
    prisma.dashboardEvent.groupBy({
      by: ["feature"],
      where: { feature: { not: null }, occurredAt: { gte: since } },
      _count: { feature: true },
      orderBy: { _count: { feature: "desc" } },
      take: 20,
    }),

    // Top pages by view count
    prisma.dashboardEvent.groupBy({
      by: ["page"],
      where: { eventType: "page_view", page: { not: null }, occurredAt: { gte: since } },
      _count: { page: true },
      orderBy: { _count: { page: "desc" } },
      take: 20,
    }),

    // DAU — group by day. Prisma doesn't support date truncation natively,
    // so we use raw SQL via $queryRaw.
    prisma.$queryRaw<{ day: Date; active_users: bigint }[]>`
      SELECT DATE_TRUNC('day', occurred_at) AS day,
             COUNT(DISTINCT user_id) AS active_users
      FROM dashboard_events
      WHERE occurred_at >= ${since}
      GROUP BY DATE_TRUNC('day', occurred_at)
      ORDER BY day ASC
    `,

    // Per-user summary — event count + last seen
    prisma.dashboardEvent.groupBy({
      by: ["userId"],
      where: { occurredAt: { gte: since } },
      _count: { id: true },
      _max: { occurredAt: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    }),
  ]);

  // Enrich user summary with names
  const userIds = userRaw.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    featureHeatmap: featureRaw.map((r) => ({
      feature: r.feature,
      count: r._count.feature,
    })),
    topPages: pageRaw.map((r) => ({
      page: r.page,
      count: r._count.page,
    })),
    dau: dauRaw.map((r) => ({
      day: r.day.toISOString().split("T")[0],
      activeUsers: Number(r.active_users),
    })),
    userSummary: userRaw.map((r) => ({
      userId: r.userId,
      name: userMap[r.userId]?.name ?? "Unknown",
      role: userMap[r.userId]?.role ?? "unknown",
      eventCount: r._count.id,
      lastSeen: r._max.occurredAt,
    })),
    periodDays: 30,
    since: since.toISOString(),
  });
}
