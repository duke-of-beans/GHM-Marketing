import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";

// GET /api/website-studio/live-sites
// Returns all live web properties across all clients with staleness alerts.
// Elevated roles only.
export async function GET(request: NextRequest) {
  const permissionError = await withPermission(request, "view_analytics");
  if (permissionError) return permissionError;

  try {
    const properties = await prisma.webProperty.findMany({
      where: { deployStatus: "live", isArchived: false },
      include: {
        client: { select: { id: true, businessName: true } },
      },
      orderBy: { lastDeployedAt: "desc" },
    });

    const now = new Date();
    const sites = properties.map((p) => {
      const daysSinceDeploy = p.lastDeployedAt
        ? Math.floor((now.getTime() - new Date(p.lastDeployedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const isStale = daysSinceDeploy !== null && daysSinceDeploy > p.stalenessThresholdDays;

      return {
        id: p.id,
        slug: p.slug,
        brandSegment: p.brandSegment,
        tier: p.tier,
        targetUrl: p.targetUrl,
        deployStatus: p.deployStatus,
        lastDeployedAt: p.lastDeployedAt,
        daysSinceDeploy,
        isStale,
        stalenessThresholdDays: p.stalenessThresholdDays,
        dnsVerified: p.dnsVerified,
        sslActive: p.sslActive,
        client: p.client,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sites,
        total: sites.length,
        staleCount: sites.filter((s) => s.isStale).length,
      },
    });
  } catch (err) {
    console.error("[live-sites] GET failed", err);
    return NextResponse.json({ success: false, error: "Failed to load live sites" }, { status: 500 });
  }
}
