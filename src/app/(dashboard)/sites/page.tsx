// src/app/(dashboard)/sites/page.tsx
// Affiliate Site Portfolio — list page
// Sprint 38-40

import { requirePermission } from "@/lib/auth/server-permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";
import { SitePortfolio } from "@/components/sites/portfolio";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

export default async function SitesPage() {
  await requirePermission("view_all_clients");
  const tenant = await requireTenant();
  const tenantId = await getTenantId(tenant.slug);
  if (!tenantId) return <div className="p-8">Tenant not found</div>;

  const sites = await prisma.site.findMany({
    where: { tenantId },
    orderBy: { domain: "asc" },
    include: {
      revenueEntries: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      adNetworks: { where: { status: "ACTIVE" } },
    },
  });

  const serialized = JSON.parse(JSON.stringify(sites, (_, v) =>
    typeof v === "object" && v !== null && "toNumber" in v ? v.toNumber() : v
  ));

  return (
    <div className="space-y-6">
      <SitePortfolio sites={serialized} />
    </div>
  );
}