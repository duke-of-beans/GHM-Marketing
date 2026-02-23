/**
 * GET  /api/tasks/[id]/checklist  — List checklist items for a task
 * POST /api/tasks/[id]/checklist  — Add item, or apply a template
 *
 * POST body:
 *   { label: string; sortOrder?: number }               — single item
 *   { templateId: number; clearExisting?: boolean }     — apply template
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = parseInt(params.id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const task = await prisma.clientTask.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const items = await prisma.taskChecklistItem.findMany({
    where: { taskId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, isComplete: true, completedAt: true, sortOrder: true },
  });

  const total = items.length;
  const done = items.filter((i) => i.isComplete).length;

  return NextResponse.json({ success: true, data: items, meta: { total, done, pct: total ? Math.round((done / total) * 100) : 0 } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = parseInt(params.id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const task = await prisma.clientTask.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();

  // Apply template mode
  if (body.templateId) {
    const template = await prisma.taskChecklistTemplate.findUnique({
      where: { id: body.templateId },
      select: { id: true, items: true },
    });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const templateItems = template.items as Array<{ label: string; sortOrder: number }>;

    await prisma.$transaction(async (tx) => {
      if (body.clearExisting) {
        await tx.taskChecklistItem.deleteMany({ where: { taskId } });
      }
      for (const item of templateItems) {
        await tx.taskChecklistItem.create({
          data: { taskId, label: item.label, sortOrder: item.sortOrder },
        });
      }
    });

    const created = await prisma.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  }

  // Single item mode
  const { label, sortOrder } = body;
  if (!label?.trim()) return NextResponse.json({ error: "label is required" }, { status: 400 });

  const maxSort = await prisma.taskChecklistItem.aggregate({
    where: { taskId },
    _max: { sortOrder: true },
  });
  const nextSort = sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1;

  const item = await prisma.taskChecklistItem.create({
    data: { taskId, label: label.trim(), sortOrder: nextSort },
    select: { id: true, label: true, isComplete: true, completedAt: true, sortOrder: true },
  });

  return NextResponse.json({ success: true, data: item }, { status: 201 });
}
