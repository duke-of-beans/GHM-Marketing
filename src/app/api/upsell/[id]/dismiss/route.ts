import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const oppId = parseInt(params.id);

    const opportunity = await prisma.upsellOpportunity.update({
      where: { id: oppId },
      data: {
        status: "dismissed",
        respondedAt: new Date(),
        response: "dismissed",
      },
    });

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error("Failed to dismiss opportunity:", error);
    return NextResponse.json(
      { error: "Failed to dismiss opportunity" },
      { status: 500 }
    );
  }
}
