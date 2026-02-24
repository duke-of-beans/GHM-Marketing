// GET  — load current admin onboarding state + branding settings
// PATCH — update completion flag or branding fields

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requirePermission("manage_settings");

  const [dbUser, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: { adminOnboardingCompletedAt: true },
    }),
    prisma.globalSettings.findFirst({
      select: {
        companyName: true,
        companyTagline: true,
        logoUrl: true,
        brandColor: true,
      },
    }),
  ]);

  return NextResponse.json({
    completed: !!dbUser?.adminOnboardingCompletedAt,
    completedAt: dbUser?.adminOnboardingCompletedAt ?? null,
    branding: {
      companyName: settings?.companyName ?? null,
      companyTagline: settings?.companyTagline ?? null,
      logoUrl: settings?.logoUrl ?? null,
      brandColor: settings?.brandColor ?? null,
    },
  });
}

export async function PATCH(req: Request) {
  const user = await requirePermission("manage_settings");
  const body = await req.json();

  const updates: Record<string, unknown> = {};

  if (body.complete === true) {
    await prisma.user.update({
      where: { id: Number(user.id) },
      data: { adminOnboardingCompletedAt: new Date() },
    });
  }

  if (body.companyName !== undefined) updates.companyName = body.companyName;
  if (body.companyTagline !== undefined) updates.companyTagline = body.companyTagline;
  if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
  if (body.brandColor !== undefined) updates.brandColor = body.brandColor;

  if (Object.keys(updates).length > 0) {
    const existing = await prisma.globalSettings.findFirst({ select: { id: true } });
    if (existing) {
      await prisma.globalSettings.update({
        where: { id: existing.id },
        data: updates,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
