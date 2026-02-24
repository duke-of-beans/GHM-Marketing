import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await getCurrentUser();
    const sources = await prisma.leadSource.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: sources });
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}
