/**
 * GET  /api/checklist-templates       — List all templates
 * POST /api/checklist-templates       — Create a template
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.taskChecklistTemplate.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      items: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: templates });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserWithPermissions();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isElevated(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, category, description, items } = body;

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  const normalised = items.map((item: { label: string }, idx: number) => ({
    label: String(item.label ?? "").trim(),
    sortOrder: idx + 1,
  }));

  const template = await prisma.taskChecklistTemplate.create({
    data: {
      name: name.trim(),
      category: category ?? null,
      description: description ?? null,
      items: normalised,
    },
  });

  return NextResponse.json({ success: true, data: template }, { status: 201 });
}
