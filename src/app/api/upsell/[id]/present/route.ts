import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  const user = await getCurrentUserWithPermissions();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oppId = parseInt(params.id);

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

    await prisma.clientNote.create({
      data: {
        clientId: opportunity.clientId,
        authorId: parseInt(user.id),
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
