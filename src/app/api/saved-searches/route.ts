import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

// GET /api/saved-searches — list saved searches for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser & { id: number };

  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, filtersJson: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: searches });
  } catch (err) {
    console.error("[saved-searches] GET failed:", err);
    return NextResponse.json({ success: false, error: "Failed to load saved searches" }, { status: 500 });
  }
}

// POST /api/saved-searches — save current filter state
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser & { id: number };

  try {
    const body = await request.json();
    const { name, filters } = body as { name: string; filters: unknown };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (!filters) {
      return NextResponse.json({ success: false, error: "Filters are required" }, { status: 400 });
    }

    const saved = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: name.trim().slice(0, 80),
        filtersJson: filters as object,
      },
      select: { id: true, name: true, filtersJson: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err) {
    console.error("[saved-searches] POST failed:", err);
    return NextResponse.json({ success: false, error: "Failed to save search" }, { status: 500 });
  }
}
