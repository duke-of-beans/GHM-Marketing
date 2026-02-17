import { requireMaster } from "@/lib/auth/session";
import { getClients, getPortfolioStats } from "@/lib/db/clients";
import { ClientPortfolio } from "@/components/clients/portfolio";

export default async function ClientsPage() {
  await requireMaster();

  const [clients, stats] = await Promise.all([
    getClients({ status: "active" }),
    getPortfolioStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track client performance, manage SEO tasks, and monitor how they stack up against competitors
        </p>
      </div>
      <ClientPortfolio clients={JSON.parse(JSON.stringify(clients))} stats={stats} />
    </div>
  );
}
