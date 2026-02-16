import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMaster();
    const oppId = parseInt(params.id);

    // Update opportunity status to presented
    const opportunity = await prisma.upsellOpportunity.update({
      where: { id: oppId },
      data: {
        status: "presented",
        presentedAt: new Date(),
      },
      include: {
        product: true,
      },
    });

    // Create a note on the client profile
    await prisma.clientNote.create({
      data: {
        clientId: opportunity.clientId,
        authorId: user.id,
        type: "upsell-presented",
        content: `Presented upsell opportunity: ${opportunity.product.name} - ${opportunity.reasoning}`,
      },
    });

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error("Failed to present opportunity:", error);
    return NextResponse.json(
      { error: "Failed to present opportunity" },
      { status: 500 }
    );
  }
}
