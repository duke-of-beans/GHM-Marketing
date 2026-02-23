/**
 * PUT    /api/tasks/[id]/checklist/[itemId]  — Toggle complete, update label
 * DELETE /api/tasks/[id]/checklist/[itemId]  — Remove item
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

async function getItem(taskId: number, itemId: number) {
  return prisma.taskChecklistItem.findFirst({ where: { id: itemId, taskId } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = parseInt(params.id);
  const itemId = parseInt(params.itemId);
  if (isNaN(taskId) || isNaN(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await getItem(taskId, itemId);
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const body = await req.json();
  const now = new Date();

  // Toggle complete
  let isComplete = existing.isComplete;
  let completedAt = existing.completedAt;
  if (typeof body.isComplete === "boolean") {
    isComplete = body.isComplete;
    completedAt = isComplete ? now : null;
  }

  const updated = await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: {
      isComplete,
      completedAt,
      label: body.label?.trim() ?? existing.label,
    },
    select: { id: true, label: true, isComplete: true, completedAt: true, sortOrder: true },
  });

  // Update task.checklistComplete if all items done
  const allItems = await prisma.taskChecklistItem.findMany({ where: { taskId } });
  const allDone = allItems.length > 0 && allItems.every((i) => i.isComplete);
  await prisma.clientTask.update({ where: { id: taskId }, data: { checklistComplete: allDone } });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = parseInt(params.id);
  const itemId = parseInt(params.itemId);
  if (isNaN(taskId) || isNaN(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await getItem(taskId, itemId);
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  await prisma.taskChecklistItem.delete({ where: { id: itemId } });

  // Recalculate checklistComplete
  const remaining = await prisma.taskChecklistItem.findMany({ where: { taskId } });
  const allDone = remaining.length > 0 && remaining.every((i) => i.isComplete);
  await prisma.clientTask.update({ where: { id: taskId }, data: { checklistComplete: remaining.length > 0 ? allDone : false } });

  return NextResponse.json({ success: true });
}
