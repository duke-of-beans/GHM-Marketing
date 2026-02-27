// GET /api/public/branding — no auth required
// Returns just enough for the login screen to render tenant logo + company name.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenant } from "@/lib/tenant/server";

export async function GET() {
  const [settings, tenant] = await Promise.all([
    prisma.globalSettings.findFirst({
      select: {
        companyName: true,
        logoUrl: true,
        brandColor: true,
        brandColorSecondary: true,
        brandColorAccent: true,
      },
    }),
    getTenant(),
  ]);

  return NextResponse.json({
    companyName: settings?.companyName ?? null,
    supportEmail: tenant?.supportEmail ?? "support@covos.app",
    logoUrl: settings?.logoUrl ?? null,
    brandColor: settings?.brandColor ?? null,
    brandColorSecondary: settings?.brandColorSecondary ?? null,
    brandColorAccent: settings?.brandColorAccent ?? null,
  });
}
