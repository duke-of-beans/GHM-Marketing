import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter, isElevated } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  const daysParam = request.nextUrl.searchParams.get("days") || "30";
  const days = Math.min(parseInt(daysParam, 10) || 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // 1. Pipeline stage distribution
  const stageCounts = await prisma.lead.groupBy({
    by: ["status"],
    where: baseFilter,
    _count: { id: true },
    _sum: { dealValueTotal: true, mrr: true },
  });

  const pipeline = stageCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
    totalValue: Number(s._sum.dealValueTotal ?? 0),
    mrr: Number(s._sum.mrr ?? 0),
  }));

  // 2. Leads created over time (daily)
  const leadsOverTimeQuery = !isElevated(user.role) && user.territoryId
    ? prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM leads 
        WHERE created_at >= ${since} AND territory_id = ${user.territoryId}
        GROUP BY DATE(created_at) 
        ORDER BY date ASC
      `
    : prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM leads 
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at) 
        ORDER BY date ASC
      `;

  const leadsOverTime = await leadsOverTimeQuery;

  // 3. Status transitions over time (won deals per week)
  const wonsOverTime = await prisma.$queryRaw<
    { week: string; count: bigint; value: string }[]
  >`
    SELECT 
      DATE_TRUNC('week', lh.changed_at)::text as week,
      COUNT(*) as count,
      COALESCE(SUM(l.deal_value_total), 0)::text as value
    FROM lead_history lh
    JOIN leads l ON l.id = lh.lead_id
    WHERE lh.new_status = 'won' 
      AND lh.changed_at >= ${since}
    GROUP BY DATE_TRUNC('week', lh.changed_at)
    ORDER BY week ASC
  `;

  // 4. Average time in each stage (from history)
  const stageTimes = await prisma.$queryRaw<
    { status: string; avg_seconds: number }[]
  >`
    SELECT 
      old_status as status,
      AVG(time_in_previous_stage) as avg_seconds
    FROM lead_history
    WHERE old_status IS NOT NULL 
      AND time_in_previous_stage IS NOT NULL
      AND changed_at >= ${since}
    GROUP BY old_status
    ORDER BY old_status
  `;

  // 5. Source performance
  const sourceStats = await prisma.lead.groupBy({
    by: ["leadSourceId"],
    where: { ...baseFilter, leadSourceId: { not: null } },
    _count: { id: true },
  });

  const sourceIds = sourceStats
    .filter((s) => s.leadSourceId !== null)
    .map((s) => s.leadSourceId as number);

  const sources =
    sourceIds.length > 0
      ? await prisma.leadSource.findMany({
          where: { id: { in: sourceIds } },
          select: { id: true, name: true },
        })
      : [];

  const wonBySource = await prisma.lead.groupBy({
    by: ["leadSourceId"],
    where: { ...baseFilter, status: "won", leadSourceId: { not: null } },
    _count: { id: true },
    _sum: { dealValueTotal: true },
  });

  const sourcePerformance = sourceStats
    .filter((s) => s.leadSourceId !== null)
    .map((s) => {
      const source = sources.find((src) => src.id === s.leadSourceId);
      const won = wonBySource.find((w) => w.leadSourceId === s.leadSourceId);
      return {
        name: source?.name ?? "Unknown",
        total: s._count.id,
        won: won?._count.id ?? 0,
        revenue: Number(won?._sum.dealValueTotal ?? 0),
        conversionRate:
          s._count.id > 0
            ? Math.round(((won?._count.id ?? 0) / s._count.id) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // 6. Rep leaderboard
  const repStats = await prisma.user.findMany({
    where: { isActive: true, role: "sales" },
    select: {
      id: true,
      name: true,
      territory: { select: { name: true } },
      _count: { select: { assignedLeads: true } },
    },
  });

  const repWonData = await prisma.lead.groupBy({
    by: ["assignedTo"],
    where: { status: "won", assignedTo: { not: null } },
    _count: { id: true },
    _sum: { dealValueTotal: true, mrr: true },
  });

  const repLeaderboard = repStats
    .map((rep) => {
      const won = repWonData.find((w) => w.assignedTo === rep.id);
      return {
        name: rep.name,
        territory: rep.territory?.name ?? "—",
        totalLeads: rep._count.assignedLeads,
        wonDeals: won?._count.id ?? 0,
        revenue: Number(won?._sum.dealValueTotal ?? 0),
        mrr: Number(won?._sum.mrr ?? 0),
        conversionRate:
          rep._count.assignedLeads > 0
            ? Math.round(
                ((won?._count.id ?? 0) / rep._count.assignedLeads) * 100
              )
            : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    success: true,
    data: {
      pipeline,
      leadsOverTime: leadsOverTime.map((r) => ({
        date: String(r.date),
        count: Number(r.count),
      })),
      wonsOverTime: wonsOverTime.map((r) => ({
        week: String(r.week).slice(0, 10),
        count: Number(r.count),
        value: Number(r.value),
      })),
      stageTimes: stageTimes.map((r) => ({
        status: r.status,
        avgDays: Math.round(Number(r.avg_seconds) / 86400 * 10) / 10,
      })),
      sourcePerformance,
      repLeaderboard,
    },
  });
}
