import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.taskChecklistTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: templates });
  } catch (err) {
    console.error("[checklist-templates GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch templates" }, { status: 500 });
  }
}
