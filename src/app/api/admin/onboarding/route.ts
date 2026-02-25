// GET  — load current admin onboarding state + branding settings
// PATCH — update step, completion flag, or branding fields

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requirePermission("manage_settings");

  const [dbUser, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: {
        adminOnboardingCompletedAt: true,
        adminOnboardingStep: true,
      },
    }),
    prisma.globalSettings.findFirst({
      select: {
        companyName: true,
        companyTagline: true,
        logoUrl: true,
        brandColor: true,
        brandColorSecondary: true,
        brandColorAccent: true,
        // FEAT-016: Voice + style fields
        voiceTone: true,
        voiceKeywords: true,
        voiceAntiKeywords: true,
        voiceSampleCopy: true,
        voiceIndustry: true,
        voiceAudience: true,
        styleFontHeading: true,
        styleFontBody: true,
        styleCornerRadius: true,
        styleDensity: true,
      },
    }),
  ]);

  return NextResponse.json({
    completed: !!dbUser?.adminOnboardingCompletedAt,
    completedAt: dbUser?.adminOnboardingCompletedAt ?? null,
    currentStep: dbUser?.adminOnboardingStep ?? 0,
    branding: {
      companyName: settings?.companyName ?? null,
      companyTagline: settings?.companyTagline ?? null,
      logoUrl: settings?.logoUrl ?? null,
      brandColor: settings?.brandColor ?? null,
      brandColorSecondary: settings?.brandColorSecondary ?? null,
      brandColorAccent: settings?.brandColorAccent ?? null,
    },
    voice: {
      voiceTone: settings?.voiceTone ?? null,
      voiceKeywords: settings?.voiceKeywords ?? null,
      voiceAntiKeywords: settings?.voiceAntiKeywords ?? null,
      voiceSampleCopy: settings?.voiceSampleCopy ?? null,
      voiceIndustry: settings?.voiceIndustry ?? null,
      voiceAudience: settings?.voiceAudience ?? null,
    },
    style: {
      styleFontHeading: settings?.styleFontHeading ?? null,
      styleFontBody: settings?.styleFontBody ?? null,
      styleCornerRadius: settings?.styleCornerRadius ?? null,
      styleDensity: settings?.styleDensity ?? null,
    },
  });
}

export async function PATCH(req: Request) {
  const user = await requirePermission("manage_settings");
  const body = await req.json();

  // ── Wizard step progress ─────────────────────────────────────────────────
  if (typeof body.step === "number") {
    await prisma.user.update({
      where: { id: Number(user.id) },
      data: { adminOnboardingStep: body.step },
    });
  }

  // ── Completion flag ──────────────────────────────────────────────────────
  if (body.complete === true) {
    await prisma.user.update({
      where: { id: Number(user.id) },
      data: {
        adminOnboardingCompletedAt: new Date(),
        adminOnboardingStep: 99,
      },
    });
  }

  // ── Branding fields ──────────────────────────────────────────────────────
  const settingsUpdates: Record<string, unknown> = {};
  if (body.companyName !== undefined) settingsUpdates.companyName = body.companyName;
  if (body.companyTagline !== undefined) settingsUpdates.companyTagline = body.companyTagline;
  if (body.logoUrl !== undefined) settingsUpdates.logoUrl = body.logoUrl;
  if (body.brandColor !== undefined) settingsUpdates.brandColor = body.brandColor;
  if (body.brandColorSecondary !== undefined)
    settingsUpdates.brandColorSecondary = body.brandColorSecondary;
  if (body.brandColorAccent !== undefined)
    settingsUpdates.brandColorAccent = body.brandColorAccent;

  // FEAT-016: Voice profile fields
  if (body.voiceTone !== undefined) settingsUpdates.voiceTone = body.voiceTone;
  if (body.voiceKeywords !== undefined) settingsUpdates.voiceKeywords = body.voiceKeywords;
  if (body.voiceAntiKeywords !== undefined) settingsUpdates.voiceAntiKeywords = body.voiceAntiKeywords;
  if (body.voiceSampleCopy !== undefined) settingsUpdates.voiceSampleCopy = body.voiceSampleCopy;
  if (body.voiceIndustry !== undefined) settingsUpdates.voiceIndustry = body.voiceIndustry;
  if (body.voiceAudience !== undefined) settingsUpdates.voiceAudience = body.voiceAudience;

  // FEAT-016: Visual style fields
  if (body.styleFontHeading !== undefined) settingsUpdates.styleFontHeading = body.styleFontHeading;
  if (body.styleFontBody !== undefined) settingsUpdates.styleFontBody = body.styleFontBody;
  if (body.styleCornerRadius !== undefined) settingsUpdates.styleCornerRadius = body.styleCornerRadius;
  if (body.styleDensity !== undefined) settingsUpdates.styleDensity = body.styleDensity;

  if (Object.keys(settingsUpdates).length > 0) {
    const existing = await prisma.globalSettings.findFirst({ select: { id: true } });
    if (existing) {
      await prisma.globalSettings.update({
        where: { id: existing.id },
        data: settingsUpdates,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
