import { requireMaster } from "@/lib/auth/session";
import { DiscoveryDashboard } from "@/components/discovery/discovery-dashboard";

export default async function DiscoveryPage() {
  await requireMaster();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find New Leads</h1>
        <p className="text-muted-foreground mt-1">
          Search Google Maps for local businesses and get instant quality scores based on reviews, ratings, and online presence
        </p>
      </div>

      <DiscoveryDashboard />
    </div>
  );
}
