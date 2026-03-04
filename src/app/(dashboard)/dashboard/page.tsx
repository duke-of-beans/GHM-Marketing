// src/app/(dashboard)/dashboard/page.tsx
// Affiliate vertical home page — Sprint 41
// Replaces /sales and /manager as the landing page for affiliate_portfolio tenants.

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";
import { AffiliateDashboardClient } from "@/components/dashboard/AffiliateDashboardClient";

export default async function AffiliateDashboardPage() {
  const user = await requirePermission("view_all_clients");
  const tenant = await requireTenant();

  // Non-affiliate tenants bounce back to their vertical's dashboard
  if (tenant.verticalType !== "affiliate_portfolio") redirect("/manager");

  const tenantRow = await prisma.tenant.findUnique({ where: { slug: tenant.slug } });
  if (!tenantRow) redirect("/manager");
  const tid = tenantRow.id;

  const [sites, revenueEntries, networks, briefs, valuations] = await Promise.all([
    prisma.site.findMany({
      where: { tenantId: tid },
      select: {
        id: true, domain: true, status: true,
        monthlyRevenueCurrent: true, monthlyTrafficCurrent: true,
      },
    }),
    prisma.revenueEntry.findMany({
      where: { tenantId: tid },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 120,
    }),
    prisma.displayAdNetwork.findMany({ where: { tenantId: tid } }),
    prisma.affiliateContentBrief.findMany({ where: { tenantId: tid } }),
    prisma.siteValuation.findMany({
      where: { tenantId: tid },
      orderBy: { valuationDate: "desc" },
    }),
  ]);

  // ── Compute metrics server-side ──
  const totalSites = sites.length;
  const activeSites = sites.filter((s) => s.status === "ACTIVE").length;
  const portfolioMRR = sites
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (s.monthlyRevenueCurrent ?? 0), 0);

  // Latest valuation total across all active sites
  const latestBySite = new Map<number, number>();
  for (const v of valuations) {
    if (v.estimatedValue == null) continue;
    if (!sites.some((s) => s.id === v.siteId && s.status === "ACTIVE")) continue;
    if (!latestBySite.has(v.siteId)) latestBySite.set(v.siteId, v.estimatedValue);
  }
  const portfolioValue = [...latestBySite.values()].reduce((s, v) => s + v, 0);

  // Serialize Decimal/Date fields for client transport
  const serialize = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

  return (
    <AffiliateDashboardClient
      companyName={tenant.companyName}
      totalSites={totalSites}
      activeSites={activeSites}
      portfolioMRR={portfolioMRR}
      portfolioValue={portfolioValue}
      sites={serialize(sites)}
      revenueEntries={serialize(revenueEntries)}
      networks={serialize(networks)}
      briefs={serialize(briefs)}
      valuations={serialize(valuations)}
    />
  );
}