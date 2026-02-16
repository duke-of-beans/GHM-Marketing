import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMaster();
    const oppId = parseInt(params.id);

    // Update opportunity status to dismissed
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
