import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { z } from "zod";

const updateTerritorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cities: z.array(z.string()).optional(),
  zipCodes: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Master access required" }, { status: 403 });
  }

  const { id } = await params;
  const territoryId = parseInt(id, 10);
  if (isNaN(territoryId)) {
    return NextResponse.json({ success: false, error: "Invalid territory ID" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateTerritorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const territory = await prisma.territory.update({
    where: { id: territoryId },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: territory });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Master access required" }, { status: 403 });
  }

  const { id } = await params;
  const territoryId = parseInt(id, 10);
  if (isNaN(territoryId)) {
    return NextResponse.json({ success: false, error: "Invalid territory ID" }, { status: 400 });
  }

  // Soft delete
  await prisma.territory.update({
    where: { id: territoryId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
