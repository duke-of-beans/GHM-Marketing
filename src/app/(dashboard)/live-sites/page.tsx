import { requirePermission } from "@/lib/auth/permissions";
import { LiveSitesPanel } from "@/components/website-studio/LiveSitesPanel";

export default async function LiveSitesPage() {
  await requirePermission("view_analytics");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Live Sites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All deployed web properties across clients with staleness monitoring.
        </p>
      </div>
      <LiveSitesPanel />
    </div>
  );
}
