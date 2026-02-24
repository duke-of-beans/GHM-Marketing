import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { addDays } from "date-fns";

/**
 * POST /api/onboarding/refresh-token
 * Public. Given an expired token string, issues a replacement if the original
 * was legitimately expired (not completed, not invalid).
 * Rate-limited: max 2 refreshes per lead.
 * Body: { expiredToken: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { expiredToken } = await req.json() as { expiredToken: string };

    if (!expiredToken || typeof expiredToken !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const existing = await prisma.onboardingToken.findUnique({
      where: { token: expiredToken },
      include: {
        lead: { select: { id: true, businessName: true } },
        generatedByUser: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (existing.status === "completed") {
      return NextResponse.json({ error: "Already submitted — no refresh needed" }, { status: 409 });
    }

    if (existing.status !== "expired" && new Date() <= existing.expiresAt) {
      // Token is actually still valid — return it
      return NextResponse.json({
        message: "Token is still valid",
        token: existing.token,
      });
    }

    // Check how many refreshes already exist for this lead
    const refreshCount = await prisma.onboardingToken.count({
      where: {
        leadId: existing.leadId,
        id: { not: existing.id },
        status: { not: "completed" },
      },
    });

    if (refreshCount >= 2) {
      return NextResponse.json({
        error: "Too many refresh attempts. Please contact your GHM representative directly.",
      }, { status: 429 });
    }

    // Mark old token expired
    await prisma.onboardingToken.update({
      where: { id: existing.id },
      data: { status: "expired" },
    });

    // Create new token
    const newToken = await prisma.onboardingToken.create({
      data: {
        token: randomUUID(),
        leadId: existing.leadId,
        generatedBy: existing.generatedBy,
        status: "pending",
        expiresAt: addDays(new Date(), 30),
        currentStep: 1,
        formData: existing.formData ?? undefined, // carry forward any partial saves
      },
    });

    return NextResponse.json({
      success: true,
      token: newToken.token,
      message: "A fresh link has been generated. Redirecting...",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
