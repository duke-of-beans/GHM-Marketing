import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { sendPortalInvite } from "@/lib/email/templates";
import { requireTenant } from "@/lib/tenant/server";
import { randomBytes } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMaster();
    const clientId = parseInt(params.id);

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        lead: {
          select: {
            email: true,
            businessName: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const clientEmail = client.lead?.email;
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client email not found" },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Update client with portal token
    await prisma.clientProfile.update({
      where: { id: clientId },
      data: { portalToken: token },
    });

    // Generate portal URL
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal?token=${token}`;

    const tenant = await requireTenant();

    // Send invite email
    const result = await sendPortalInvite({
      to: clientEmail,
      clientName: client.businessName,
      portalUrl,
    }, tenant);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      portalUrl,
      emailId: result.id,
      message: `Portal invite sent to ${clientEmail}`,
    });
  } catch (error) {
    console.error("Failed to generate portal token:", error);
    return NextResponse.json(
      { error: "Failed to generate portal access" },
      { status: 500 }
    );
  }
}
