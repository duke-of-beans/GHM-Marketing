/**
 * PUT /api/alerts/[id]/acknowledge
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const alert = await prisma.alertEvent.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: parseInt(user.id),
        acknowledgedAt: new Date(),
      },
    });

    return NextResponse.json({ alert });
  } catch (err) {
    console.error("[PUT /api/alerts/[id]/acknowledge]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
