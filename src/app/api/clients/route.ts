import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClients, getPortfolioStats } from "@/lib/db/clients";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const [clients, stats] = await Promise.all([
    getClients({
      status: searchParams.status || "active",
      healthMin: searchParams.healthMin ? parseInt(searchParams.healthMin) : undefined,
      healthMax: searchParams.healthMax ? parseInt(searchParams.healthMax) : undefined,
    }),
    getPortfolioStats(),
  ]);

  return NextResponse.json({ success: true, data: { clients, stats } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const {
      businessName,
      contactName,
      phone,
      email,
      website,
      city,
      state,
      zipCode,
      retainerAmount,
      scanFrequency,
    } = body;

    // Validation
    if (!businessName || !phone || !city || !state) {
      return NextResponse.json(
        { success: false, error: "Business name, phone, city, and state are required" },
        { status: 400 }
      );
    }

    if (!retainerAmount || retainerAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid retainer amount is required" },
        { status: 400 }
      );
    }

    // Find or create "Manual Entry" lead source
    let leadSource = await prisma.leadSource.findFirst({
      where: { name: "Manual Entry" },
    });

    if (!leadSource) {
      leadSource = await prisma.leadSource.create({
        data: {
          name: "Manual Entry",
        },
      });
    }

    // First, create a Lead record (ClientProfile requires a lead)
    const lead = await prisma.lead.create({
      data: {
        businessName,
        phone,
        email: email || null,
        website: website || null,
        city,
        state,
        zipCode: zipCode || null,
        status: "won", // Mark as won since we're creating a client
        dealValueTotal: retainerAmount,
        leadSourceId: leadSource.id,
      },
    });

    // Then create the ClientProfile
    const client = await prisma.clientProfile.create({
      data: {
        leadId: lead.id,
        businessName,
        contactName: contactName || null,
        retainerAmount,
        status: "active",
        healthScore: 50, // Default middle score
        scanFrequency: scanFrequency || "weekly",
        onboardedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { client, lead },
    });
  } catch (error: any) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create client" },
      { status: 500 }
    );
  }
}
