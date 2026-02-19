import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_leads");
  if (permissionError) return permissionError;

  try {
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
        const existing = lead.phone
          ? await prisma.lead.findFirst({
              where: { phone: lead.phone },
            })
          : null;

        if (existing) {
          skipped++;
          continue;
        }

        const addressParts = parseAddress(lead.address);

        await prisma.lead.create({
          data: {
            businessName: lead.name,
            phone: lead.phone || "",
            email: null,
            website: lead.website || null,
            city: addressParts.city || "Unknown",
            state: addressParts.state || "Unknown",
            zipCode: addressParts.zip || "00000",
            reviewCount: lead.reviewCount,
            reviewAvg: lead.rating,
            status: "available",
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

  if (parts.length >= 3) {
    city = parts[parts.length - 3] || null;

    const stateZipPart = parts[parts.length - 2];
    const stateZipMatch = stateZipPart?.match(/([A-Z]{2})\s+(\d{5})/);
    if (stateZipMatch) {
      state = stateZipMatch[1];
      zip = stateZipMatch[2];
    } else {
      state = stateZipPart || null;
    }
  }

  return { city, state, zip };
}
