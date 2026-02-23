/**
 * GET /api/clients/[id]/site-health
 * Returns paginated site health history for a client.
 * Query params: domainId (optional), limit (default 12), page (default 1)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function GET(
  req: NextRequest,
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

    const sp = req.nextUrl.searchParams;
    const domainId = sp.get("domainId") ? parseInt(sp.get("domainId")!) : undefined;
    const limit = Math.min(parseInt(sp.get("limit") ?? "12"), 50);
    const page = Math.max(parseInt(sp.get("page") ?? "1"), 1);
    const skip = (page - 1) * limit;

    const where = {
      clientId,
      ...(domainId !== undefined && !isNaN(domainId) ? { domainId } : {}),
    };

    const [total, snapshots] = await Promise.all([
      prisma.siteHealthSnapshot.count({ where }),
      prisma.siteHealthSnapshot.findMany({
        where,
        orderBy: { scanDate: "desc" },
        skip,
        take: limit,
        include: {
          domain: { select: { id: true, domain: true, type: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        snapshots,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[site-health GET] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
