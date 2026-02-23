/**
 * PUT    /api/checklist-templates/[id]  — Update template
 * DELETE /api/checklist-templates/[id]  — Delete template
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const { name, category, description, items } = body;

  const data: Record<string, unknown> = {};
  if (name?.trim()) data.name = name.trim();
  if (typeof category !== "undefined") data.category = category ?? null;
  if (typeof description !== "undefined") data.description = description ?? null;
  if (Array.isArray(items)) {
    data.items = items.map((item: { label: string }, idx: number) => ({
      label: String(item.label ?? "").trim(),
      sortOrder: idx + 1,
    }));
  }

  const updated = await prisma.taskChecklistTemplate.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.taskChecklistTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
