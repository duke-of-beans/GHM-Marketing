import { requirePermission } from "@/lib/auth/permissions";
import { DiscoveryDashboard } from "@/components/discovery/discovery-dashboard";

export default async function DiscoveryPage() {
  await requirePermission("view_all_leads");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find New Leads</h1>
        <p className="text-muted-foreground mt-1">
          Search for businesses and score lead quality
        </p>
      </div>

      <DiscoveryDashboard />
    </div>
  );
}
