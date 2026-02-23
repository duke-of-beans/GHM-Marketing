/**
 * GET  /api/alerts/rules  — List alert rules
 * POST /api/alerts/rules  — Create alert rule
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rules = await prisma.alertRule.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ rules });
  } catch (err) {
    console.error("[GET /api/alerts/rules]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, description, sourceType, conditionType, conditionConfig,
            severity, autoCreateTask, taskTemplate, notifyOnTrigger, cooldownMinutes } = body;

    if (!name || !sourceType || !conditionType || !conditionConfig) {
      return NextResponse.json({ error: "name, sourceType, conditionType, conditionConfig required" }, { status: 400 });
    }

    const rule = await prisma.alertRule.create({
      data: {
        name,
        description,
        sourceType,
        conditionType,
        conditionConfig,
        severity:        severity ?? "warning",
        autoCreateTask:  autoCreateTask ?? false,
        taskTemplate:    taskTemplate ?? undefined,
        notifyOnTrigger: notifyOnTrigger ?? true,
        cooldownMinutes: cooldownMinutes ?? 1440,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/alerts/rules]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
