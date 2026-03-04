// src/app/(dashboard)/sites/[id]/page.tsx
// Affiliate Site Detail — server component wrapper
// Sprint 38-40

import { requirePermission } from "@/lib/auth/server-permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";
import { SiteDetail } from "@/components/sites/detail";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

function serializeDecimals(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === "object" && v !== null && "toNumber" in v ? v.toNumber() : v
  ));
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("view_all_clients");
  const tenant = await requireTenant();
  const tenantId = await getTenantId(tenant.slug);
  if (!tenantId) return <div className="p-8">Tenant not found</div>;

  const { id } = await params;
  const siteId = parseInt(id, 10);
  if (isNaN(siteId)) return <div className="p-8">Invalid site ID</div>;

  const site = await prisma.site.findFirst({
    where: { id: siteId, tenantId },
    include: {
      affiliatePrograms: { orderBy: { merchantName: "asc" } },
      adNetworks: { orderBy: { networkName: "asc" } },
      revenueEntries: { orderBy: [{ year: "desc" }, { month: "desc" }] },
      contentBriefs: { orderBy: { createdAt: "desc" } },
      valuations: { orderBy: { valuationDate: "desc" } },
    },
  });

  if (!site) return <div className="p-8">Site not found</div>;

  const serialized = serializeDecimals(site) as any;

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/sites">Sites</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{site.domain}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <SiteDetail site={serialized} />
    </div>
  );
}