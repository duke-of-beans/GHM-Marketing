import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import {
  getActiveDnaCapture,
  createDnaCapture,
  addDnaTokenOverride,
} from "@/lib/db/website-studio";
import { prisma } from "@/lib/db";
import type { DnaTokenBlob } from "@/types/website-studio";

// GET /api/website-studio/[clientId]/dna?propertyId=N
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const propertyId = request.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ success: false, error: "propertyId required" }, { status: 400 });
  }

  const capture = await getActiveDnaCapture(parseInt(propertyId));
  return NextResponse.json({ success: true, data: capture ?? null });
}

// POST /api/website-studio/[clientId]/dna
// Create a new DNA capture (replaces current).
// Body: { propertyId, sourceUrl, tokenBlob, capturedBy? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const { propertyId, sourceUrl, tokenBlob, capturedBy } = body;

    if (!propertyId || !sourceUrl || !tokenBlob) {
      return NextResponse.json(
        { success: false, error: "propertyId, sourceUrl, and tokenBlob are required" },
        { status: 400 }
      );
    }

    const capture = await createDnaCapture(
      propertyId,
      sourceUrl,
      tokenBlob as DnaTokenBlob,
      capturedBy
    );

    return NextResponse.json({ success: true, data: capture }, { status: 201 });
  } catch (err) {
    console.error("[website-studio/dna] POST failed", err);
    return NextResponse.json({ success: false, error: "Failed to save DNA capture" }, { status: 500 });
  }
}

// PATCH /api/website-studio/[clientId]/dna
// Add or update a token override.
// Body: { captureId, tokenKey, originalValue, overrideValue, note, operatorName, isLocked? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const { captureId, tokenKey, originalValue, overrideValue, note, operatorName, isLocked } = body;

    if (!captureId || !tokenKey || originalValue === undefined || overrideValue === undefined || !note || !operatorName) {
      return NextResponse.json(
        { success: false, error: "captureId, tokenKey, originalValue, overrideValue, note, and operatorName are required" },
        { status: 400 }
      );
    }

    const override = await addDnaTokenOverride(
      captureId,
      tokenKey,
      originalValue,
      overrideValue,
      note,
      operatorName,
      isLocked ?? false
    );

    return NextResponse.json({ success: true, data: override });
  } catch (err) {
    console.error("[website-studio/dna] PATCH failed", err);
    return NextResponse.json({ success: false, error: "Failed to save token override" }, { status: 500 });
  }
}
