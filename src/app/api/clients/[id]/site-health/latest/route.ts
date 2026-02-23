/**
 * GET /api/clients/[id]/site-health/latest
 * Returns the most recent SiteHealthSnapshot per domain for this client,
 * with computed delta indicators (vs previousMobile / previousDesktop).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    // Get all domains for this client
    const domains = await prisma.clientDomain.findMany({
      where: { clientId },
      select: { id: true, domain: true, type: true },
    });

    if (domains.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch latest snapshot per domain
    const snapshots = await Promise.all(
      domains.map(async (domain) => {
        const snapshot = await prisma.siteHealthSnapshot.findFirst({
          where: { domainId: domain.id },
          orderBy: { scanDate: "desc" },
        });

        if (!snapshot) return { domain, snapshot: null, deltas: null };

        const mobileDelta =
          snapshot.previousMobile != null && snapshot.performanceMobile != null
            ? snapshot.performanceMobile - snapshot.previousMobile
            : null;

        const desktopDelta =
          snapshot.previousDesktop != null && snapshot.performanceDesktop != null
            ? snapshot.performanceDesktop - snapshot.previousDesktop
            : null;

        return {
          domain,
          snapshot,
          deltas: {
            mobile: mobileDelta,
            desktop: desktopDelta,
            mobileTrend:
              mobileDelta === null ? "unknown"
              : mobileDelta > 5 ? "up"
              : mobileDelta < -5 ? "down"
              : "stable",
            desktopTrend:
              desktopDelta === null ? "unknown"
              : desktopDelta > 5 ? "up"
              : desktopDelta < -5 ? "down"
              : "stable",
          },
        };
      })
    );

    return NextResponse.json({ success: true, data: snapshots });
  } catch (err) {
    console.error("[site-health/latest GET] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
