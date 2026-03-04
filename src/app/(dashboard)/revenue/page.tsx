import { requirePermission } from "@/lib/auth/permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";
import { RevenueDashboard } from "@/components/sites/revenue-dashboard";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

export default async function RevenuePage() {
  await requirePermission("view_all_clients");
  const tenant = await requireTenant();
  const tenantId = await getTenantId(tenant.slug);
  if (!tenantId) return <div className="p-8">Tenant not found</div>;

  const [sites, revenueEntries, networks] = await Promise.all([
    prisma.site.findMany({ where: { tenantId }, orderBy: { domain: "asc" } }),
    prisma.revenueEntry.findMany({ where: { tenantId }, orderBy: [{ year: "desc" }, { month: "desc" }] }),
    prisma.displayAdNetwork.findMany({ where: { tenantId, status: "APPROVED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>        <p className="text-muted-foreground text-sm mt-1">
          Portfolio-wide revenue performance and trends
        </p>
      </div>
      <RevenueDashboard
        sites={JSON.parse(JSON.stringify(sites))}
        revenueEntries={JSON.parse(JSON.stringify(revenueEntries))}
        networks={JSON.parse(JSON.stringify(networks))}
      />
    </div>
  );
}