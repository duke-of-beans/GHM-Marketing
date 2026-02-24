// GET /api/import/pm/sessions
// Returns import session history for the current user.

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0", 10)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sessions = await prisma.pmImportSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, platform: true, status: true, previewStats: true,
      commitStats: true, errorMessage: true, createdAt: true, updatedAt: true,
    },
  })

  return NextResponse.json({ success: true, sessions })
}
