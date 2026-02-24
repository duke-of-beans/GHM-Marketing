import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const positionSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["sales", "management", "operations", "contractor"]),
  compensationType: z.enum(["commission_residual", "management_fee", "flat_monthly", "per_deliverable", "manual"]),
  defaultAmount: z.number().nullable().optional(),
  defaultFrequency: z.enum(["monthly", "per_close", "per_deliverable", "manual"]).nullable().optional(),
  dashboardAccessLevel: z.enum(["admin", "manager", "sales", "readonly"]),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/positions — list all positions (admin only)
export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const positions = await prisma.position.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({ success: true, data: positions });
}

// POST /api/positions — create a new position (admin only)
export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const body = await req.json();
  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.position.findFirst({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ success: false, error: "A position with this name already exists" }, { status: 409 });
  }

  const position = await prisma.position.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      compensationType: parsed.data.compensationType,
      defaultAmount: parsed.data.defaultAmount ?? null,
      defaultFrequency: parsed.data.defaultFrequency ?? null,
      dashboardAccessLevel: parsed.data.dashboardAccessLevel,
      isActive: parsed.data.isActive ?? true,
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ success: true, data: position }, { status: 201 });
}
