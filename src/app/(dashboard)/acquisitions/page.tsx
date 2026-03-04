import { requirePermission } from "@/lib/auth/permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";
import { AcquisitionPipeline } from "@/components/sites/acquisition-pipeline";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

export default async function AcquisitionsPage() {
  await requirePermission("view_all_clients");
  const tenant = await requireTenant();
  const tenantId = await getTenantId(tenant.slug);
  if (!tenantId) return <div className="p-8">Tenant not found</div>;

  const targets = await prisma.acquisitionTarget.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acquisition Pipeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track domain acquisition targets from research through purchase
        </p>
      </div>
      <AcquisitionPipeline
        targets={JSON.parse(JSON.stringify(targets))}
        tenantId={tenantId}
      />
    </div>
  );
}