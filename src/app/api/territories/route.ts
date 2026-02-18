import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { createTerritorySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_territories");
  if (permissionError) return permissionError;

  const territories = await prisma.territory.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { users: true, leads: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: territories });
}

export async function POST(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_territories");
  if (permissionError) return permissionError;

  const body = await req.json();
  const parsed = createTerritorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid territory", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const territory = await prisma.territory.create({
    data: parsed.data,
    include: { _count: { select: { users: true, leads: true } } },
  });

  return NextResponse.json({ success: true, data: territory }, { status: 201 });
}
