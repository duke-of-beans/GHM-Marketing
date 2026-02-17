import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireMaster();

    const body = await req.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "No leads provided" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        // Check if lead already exists by place_id or phone
        // Check for duplicates by phone
        const existing = lead.phone
          ? await prisma.lead.findFirst({
              where: { phone: lead.phone },
            })
          : null;

        if (existing) {
          skipped++;
          continue;
        }

        // Extract city, state, zip from address
        const addressParts = parseAddress(lead.address);

        // Create lead
        await prisma.lead.create({
          data: {
            businessName: lead.name,
            phone: lead.phone || null,
            email: null, // Not available from Maps
            website: lead.website || null,
            city: addressParts.city,
            state: addressParts.state,
            zipCode: addressParts.zip,
            reviewCount: lead.reviewCount,
            reviewAvg: lead.rating,
            googlePlaceId: lead.placeId,
            status: "new",
            source: "discovery",
            assignedToId: user.id,
            qualificationScore: lead.qualificationScore,
            competitiveIntel: {
              category: lead.category,
              discoveryReasons: lead.reasons,
              discoveredAt: new Date().toISOString(),
            },
          },
        });

        imported++;
      } catch (error) {
        console.error(`Failed to import lead ${lead.name}:`, error);
        errors.push(`${lead.name}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { error: "Import failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Parse address string into city, state, zip
 * Example: "123 Main St, Austin, TX 78701, USA"
 */
function parseAddress(address: string): {
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  if (!address) {
    return { city: null, state: null, zip: null };
  }

  const parts = address.split(",").map((p) => p.trim());

  let city: string | null = null;
  let state: string | null = null;
  let zip: string | null = null;

  // Common format: "Street, City, State Zip, Country"
  if (parts.length >= 3) {
    city = parts[parts.length - 3] || null;

    // Extract state and zip from "State Zip" format
    const stateZipPart = parts[parts.length - 2];
    const stateZipMatch = stateZipPart?.match(/([A-Z]{2})\s+(\d{5})/);
    if (stateZipMatch) {
      state = stateZipMatch[1];
      zip = stateZipMatch[2];
    } else {
      // Try just state
      state = stateZipPart || null;
    }
  }

  return { city, state, zip };
}
