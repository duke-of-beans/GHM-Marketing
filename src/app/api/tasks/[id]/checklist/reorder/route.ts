/**
 * PUT /api/tasks/[id]/checklist/reorder — Reorder checklist items
 * Body: { itemIds: number[] }  — ordered array of item IDs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = parseInt(params.id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const body = await req.json();
  const { itemIds } = body;
  if (!Array.isArray(itemIds) || itemIds.some((id) => typeof id !== "number")) {
    return NextResponse.json({ error: "itemIds must be an array of numbers" }, { status: 400 });
  }

  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.taskChecklistItem.updateMany({
        where: { id, taskId },
        data: { sortOrder: index + 1 },
      })
    )
  );

  return NextResponse.json({ success: true });
}
