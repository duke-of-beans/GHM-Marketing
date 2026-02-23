/**
 * GET  /api/recurring-tasks       — List rules
 * POST /api/recurring-tasks       — Create rule
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";
import { calculateNextRunAt } from "@/lib/ops/recurring-tasks";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rules = await prisma.recurringTaskRule.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ rules });
  } catch (err) {
    console.error("[GET /api/recurring-tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, clientId, category, title, description, priority,
            checklistTemplateId, cronExpression } = body;

    if (!name || !category || !title || !cronExpression) {
      return NextResponse.json(
        { error: "name, category, title, cronExpression required" },
        { status: 400 }
      );
    }

    const nextRunAt = calculateNextRunAt(cronExpression);

    const rule = await prisma.recurringTaskRule.create({
      data: {
        name,
        clientId:            clientId ?? null,
        category,
        title,
        description:         description ?? null,
        priority:            priority ?? "P3",
        checklistTemplateId: checklistTemplateId ?? null,
        cronExpression,
        nextRunAt,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/recurring-tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
