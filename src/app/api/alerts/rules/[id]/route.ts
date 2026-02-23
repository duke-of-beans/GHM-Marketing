/**
 * PUT    /api/alerts/rules/[id]  — Update rule
 * DELETE /api/alerts/rules/[id]  — Delete rule
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();
    const rule = await prisma.alertRule.update({ where: { id: ruleId }, data: body });

    return NextResponse.json({ rule });
  } catch (err) {
    console.error("[PUT /api/alerts/rules/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.alertRule.delete({ where: { id: ruleId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/alerts/rules/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
