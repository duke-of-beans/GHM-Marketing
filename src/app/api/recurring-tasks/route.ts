/**
 * GET  /api/recurring-tasks       — List rules (with optional client+template names)
 * POST /api/recurring-tasks       — Create rule
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";
import { calculateNextRunAt } from "@/lib/ops/recurring-tasks";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rules = await prisma.recurringTaskRule.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        client: { select: { businessName: true } },
        checklistTemplate: { select: { name: true } },
      },
    });

    const data = rules.map((r) => ({
      id: r.id,
      name: r.name,
      clientId: r.clientId,
      clientName: r.client?.businessName ?? null,
      category: r.category,
      title: r.title,
      priority: r.priority,
      cronExpression: r.cronExpression,
      isActive: r.isActive,
      lastRunAt: r.lastRunAt?.toISOString() ?? null,
      nextRunAt: r.nextRunAt?.toISOString() ?? null,
      checklistTemplateName: r.checklistTemplate?.name ?? null,
    }));

    return NextResponse.json({ success: true, data });
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

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/recurring-tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
