import { requirePermission } from "@/lib/auth/permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";
import { AffiliateContentCalendar } from "@/components/sites/affiliate-content-calendar";
import { redirect } from "next/navigation";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

export default async function ContentPage() {
  await requirePermission("view_all_clients");
  const tenant = await requireTenant();
  const tenantId = await getTenantId(tenant.slug);
  if (!tenantId) return <div className="p-8">Tenant not found</div>;

  const verticalType = (tenant as any)?.verticalType ?? null;

  // Non-affiliate tenants redirect to content studio
  if (verticalType !== "affiliate_portfolio") {
    redirect("/content-studio");
  }

  const [sites, briefs] = await Promise.all([
    prisma.site.findMany({ where: { tenantId }, orderBy: { domain: "asc" }, select: { id: true, domain: true } }),
    prisma.affiliateContentBrief.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { site: { select: { domain: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Plan, assign, and track content across your portfolio
        </p>
      </div>
      <AffiliateContentCalendar
        sites={JSON.parse(JSON.stringify(sites))}
        briefs={JSON.parse(JSON.stringify(briefs))}
      />
    </div>
  );
}
