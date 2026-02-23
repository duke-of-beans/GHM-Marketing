/**
 * PUT    /api/recurring-tasks/[id]  — Update rule
 * DELETE /api/recurring-tasks/[id]  — Delete rule
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";
import { calculateNextRunAt } from "@/lib/ops/recurring-tasks";

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

    // Recalculate nextRunAt if cronExpression changed
    if (body.cronExpression) {
      body.nextRunAt = calculateNextRunAt(body.cronExpression);
    }

    const rule = await prisma.recurringTaskRule.update({ where: { id: ruleId }, data: body });
    return NextResponse.json({ rule });
  } catch (err) {
    console.error("[PUT /api/recurring-tasks/[id]]", err);
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

    await prisma.recurringTaskRule.delete({ where: { id: ruleId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/recurring-tasks/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
