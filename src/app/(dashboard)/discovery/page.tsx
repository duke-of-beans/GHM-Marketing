import { requireMaster } from "@/lib/auth/session";
import { DiscoveryDashboard } from "@/components/discovery/discovery-dashboard";

export default async function DiscoveryPage() {
  await requireMaster();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lead Discovery</h1>
        <p className="text-muted-foreground mt-1">
          Find and qualify potential clients automatically using Maps data
        </p>
      </div>

      <DiscoveryDashboard />
    </div>
  );
}
