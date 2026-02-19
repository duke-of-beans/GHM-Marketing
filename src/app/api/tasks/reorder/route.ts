/**
 * PATCH /api/tasks/reorder
 *
 * Batch-update sort order for drag-and-drop queue reordering.
 *
 * Body: { items: Array<{ id: number, sortOrder: number }> }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    if (items.length > 100) {
      return NextResponse.json({ error: "Max 100 items per reorder" }, { status: 400 });
    }

    // Batch update in transaction
    await prisma.$transaction(
      items.map((item: { id: number; sortOrder: number }) =>
        prisma.clientTask.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true, updated: items.length });
  } catch (error: any) {
    console.error("Task reorder error:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}
