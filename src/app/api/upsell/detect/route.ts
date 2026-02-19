import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { detectUpsellOpportunities, saveUpsellOpportunities } from "@/lib/upsell/detector";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { clientId, scanId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    const opportunities = await detectUpsellOpportunities(clientId, scanId);

    let savedOpportunities: unknown[] = [];
    if (scanId && opportunities.length > 0) {
      savedOpportunities = await saveUpsellOpportunities(clientId, scanId, opportunities);
    }

    return NextResponse.json({
      success: true,
      opportunities,
      savedCount: savedOpportunities.length,
    });
  } catch (error) {
    console.error("Failed to detect upsell opportunities:", error);
    return NextResponse.json(
      { error: "Failed to detect opportunities", details: (error as Error).message },
      { status: 500 }
    );
  }
}
