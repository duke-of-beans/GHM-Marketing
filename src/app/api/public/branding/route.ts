// GET /api/public/branding — no auth required
// Returns just enough for the login screen to render tenant logo + company name.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.globalSettings.findFirst({
    select: {
      companyName: true,
      logoUrl: true,
      brandColor: true,
      brandColorSecondary: true,
      brandColorAccent: true,
    },
  });

  return NextResponse.json({
    companyName: settings?.companyName ?? null,
    logoUrl: settings?.logoUrl ?? null,
    brandColor: settings?.brandColor ?? null,
    brandColorSecondary: settings?.brandColorSecondary ?? null,
    brandColorAccent: settings?.brandColorAccent ?? null,
  });
}
