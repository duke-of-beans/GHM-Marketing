import { requirePermission } from "@/lib/auth/permissions";
import { getClients, getPortfolioStats } from "@/lib/db/clients";
import { prisma } from "@/lib/db";
import { ClientPortfolio } from "@/components/clients/portfolio";
import { buildHealthTrajectory, buildSparklinePath } from "@/lib/analytics/intelligence";

export default async function ClientsPage() {
  await requirePermission("view_all_clients");

  const [clients, stats, recentScans] = await Promise.all([
    getClients({ status: "active" }),
    getPortfolioStats(),
    prisma.competitiveScan.findMany({
      select: { clientId: true, scanDate: true, healthScore: true },
      orderBy: { scanDate: "desc" },
      take: 1000, // Covers ~10 scans × 100 clients
    }),
  ]);

  // Build per-client sparkline data
  const scansByClient = new Map<number, typeof recentScans>();
  for (const scan of recentScans) {
    const arr = scansByClient.get(scan.clientId) ?? [];
    if (arr.length < 10) {
      arr.push(scan);
      scansByClient.set(scan.clientId, arr);
    }
  }

  const sparklines = new Map<number, { path: string | null; delta: number | null }>();
  for (const client of clients) {
    const scans = scansByClient.get(client.id) ?? [];
    const trajectory = buildHealthTrajectory(scans, 10);
    const path = buildSparklinePath(trajectory);
    const delta = trajectory.length >= 2
      ? trajectory[trajectory.length - 1].score - trajectory[0].score
      : null;
    sparklines.set(client.id, { path, delta });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track client performance, manage SEO tasks, and monitor how they stack up against competitors
        </p>
      </div>
      <ClientPortfolio
        clients={JSON.parse(JSON.stringify(clients))}
        stats={stats}
        sparklines={JSON.parse(JSON.stringify(Object.fromEntries(sparklines)))}
      />
    </div>
  );
}
