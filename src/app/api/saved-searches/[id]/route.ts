import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

// DELETE /api/saved-searches/[id] — delete a saved search (own only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser & { id: number };
  const { id } = await params;
  const searchId = parseInt(id, 10);

  if (isNaN(searchId)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id: searchId },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.savedSearch.delete({ where: { id: searchId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[saved-searches] DELETE failed:", err);
    return NextResponse.json({ success: false, error: "Failed to delete saved search" }, { status: 500 });
  }
}
