import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTerritorySchema } from "@/lib/validations";
import type { SessionUser } from "@/lib/auth/session";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const territories = await prisma.territory.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { users: true, leads: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: territories });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Master access required" }, { status: 403 });
  }

  const body = await request.json();
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
