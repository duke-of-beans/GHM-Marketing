/**
 * GET  /api/alerts       — List alerts (filterable)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const clientId    = searchParams.get("clientId");
    const type        = searchParams.get("type");
    const severity    = searchParams.get("severity");
    const acknowledged = searchParams.get("acknowledged");
    const limit       = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const cursor      = searchParams.get("cursor");

    const where: Record<string, unknown> = {};
    if (clientId)    where.clientId    = parseInt(clientId);
    if (type)        where.type        = type;
    if (severity)    where.severity    = severity;
    if (acknowledged !== null) where.acknowledged = acknowledged === "true";
    if (cursor)      where.id          = { lt: parseInt(cursor) };

    const alerts = await prisma.alertEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        client: { select: { id: true, businessName: true } },
        rule:   { select: { id: true, name: true } },
        taskLinks: {
          include: { task: { select: { id: true, title: true, status: true } } },
        },
      },
    });

    return NextResponse.json({ alerts, nextCursor: alerts[alerts.length - 1]?.id ?? null });
  } catch (err) {
    console.error("[GET /api/alerts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
