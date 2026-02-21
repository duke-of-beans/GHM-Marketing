/**
 * GET /api/review/content-queue
 *
 * Returns ClientContent items currently in "review" status, across all clients.
 * Used by the Approvals tab in the Tasks page.
 *
 * Requires: manage_clients permission (same gate as the old /review page).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const items = await prisma.clientContent.findMany({
      where: { status: "review" },
      select: {
        id: true,
        contentType: true,
        title: true,
        status: true,
        keywords: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { id: true, businessName: true },
        },
      },
      orderBy: { updatedAt: "asc" }, // oldest first — most urgent
    });

    const data = items.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      title: item.title,
      status: item.status,
      keywords: item.keywords,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      clientId: item.client.id,
      clientName: item.client.businessName,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to load content review queue:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load content review queue" },
      { status: 500 }
    );
  }
}
