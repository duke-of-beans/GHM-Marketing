import { prisma } from "@/lib/db";
import { generateRankTrackingSection } from "./sections/rank-tracking";
import { generateCitationHealthSection } from "./sections/citation-health";
import { generateGBPPerformanceSection } from "./sections/gbp-performance";

/**
 * Generate monthly report data for a client
 */
export async function generateMonthlyReportData(
  clientId: number,
  periodStart: Date,
  periodEnd: Date
) {
  // Get all scans in the period
  const scans = await prisma.competitiveScan.findMany({
    where: {
      clientId,
      scanDate: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    orderBy: { scanDate: "asc" },
  });

  // Get client profile
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: {
      lead: {
        select: {
          businessName: true,
          website: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  // Get tasks completed in period
  const tasksCompleted = await prisma.clientTask.findMany({
    where: {
      clientId,
      status: "deployed",
      deployedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    select: {
      id: true,
      title: true,
      category: true,
      deployedAt: true,
      deployedUrl: true,
    },
  });

  // Calculate metrics
  const healthScoreTrend = scans.map((scan) => ({
    date: scan.scanDate,
    score: scan.healthScore,
  }));

  const currentHealthScore = scans[scans.length - 1]?.healthScore || client.healthScore;
  const previousHealthScore = scans[0]?.healthScore || 50;
  const healthScoreChange = currentHealthScore - previousHealthScore;

  // Aggregate alerts by severity
  const allAlerts = scans.flatMap((scan) => {
    const alerts = scan.alerts as any;
    return [
      ...(alerts?.critical || []),
      ...(alerts?.warning || []),
      ...(alerts?.info || []),
    ];
  });

  const criticalAlerts = allAlerts.filter((a: any) => a.severity === "critical");
  const warningAlerts = allAlerts.filter((a: any) => a.severity === "warning");

  // Get top wins (positive deltas)
  const wins = scans
    .flatMap((scan) => {
      const deltas = scan.deltas as any;
      return Object.entries(deltas || {})
        .filter(([_, value]: [string, any]) => value.direction === "positive")
        .map(([key, value]: [string, any]) => ({
          metric: key,
          improvement: value.change,
          description: value.description,
        }));
    })
    .slice(0, 5); // Top 5 wins

  // Get top gaps (areas needing improvement)
  const gaps = criticalAlerts.slice(0, 5).map((alert: any) => ({
    issue: alert.title,
    severity: alert.severity,
    recommendation: alert.action,
  }));

  // Run new section generators in parallel
  const [rankTracking, citationHealth, gbpPerformance] = await Promise.all([
    generateRankTrackingSection(clientId, periodStart, periodEnd),
    generateCitationHealthSection(clientId, periodStart, periodEnd),
    generateGBPPerformanceSection(clientId, periodStart, periodEnd),
  ]);

  return {
    client: {
      id: client.id,
      businessName: client.lead.businessName,
      website: client.lead.website,
      city: client.lead.city,
      state: client.lead.state,
      retainerAmount: Number(client.retainerAmount),
    },
    period: {
      start: periodStart,
      end: periodEnd,
      scansCount: scans.length,
    },
    health: {
      current: currentHealthScore,
      previous: previousHealthScore,
      change: healthScoreChange,
      trend: healthScoreTrend,
    },
    alerts: {
      total: allAlerts.length,
      critical: criticalAlerts.length,
      warning: warningAlerts.length,
    },
    tasks: {
      completed: tasksCompleted.length,
      list: tasksCompleted,
    },
    wins,
    gaps,
    rankTracking,
    citationHealth,
    gbpPerformance,
  };
}
