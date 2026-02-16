import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { sendUpsellNotification } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const { opportunityId } = await req.json();

    if (!opportunityId) {
      return NextResponse.json(
        { error: "Opportunity ID required" },
        { status: 400 }
      );
    }

    // Get opportunity with client and product info
    const opportunity = await prisma.upsellOpportunity.findUnique({
      where: { id: opportunityId },
      include: {
        client: {
          include: {
            lead: {
              select: {
                email: true,
                businessName: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    if (!opportunity.client.lead?.email) {
      return NextResponse.json(
        { error: "Client email not configured" },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendUpsellNotification({
      to: opportunity.client.lead.email,
      clientName: opportunity.client.businessName,
      productName: opportunity.product.name,
      opportunityScore: opportunity.opportunityScore,
      projectedMrr: Number(opportunity.projectedMrr),
      projectedRoi: opportunity.projectedRoi
        ? Number(opportunity.projectedRoi)
        : null,
      reasoning: opportunity.reasoning || "",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Upsell notification sent successfully",
      emailId: result.id,
    });
  } catch (error) {
    console.error("Failed to send upsell email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
