import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { dashboardLayout: true },
  });

  return NextResponse.json({ layout: user?.dashboardLayout ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layout } = await req.json();

  await prisma.user.update({
    where: { id: parseInt(session.user.id) },
    data: { dashboardLayout: layout },
  });

  return NextResponse.json({ ok: true });
}
