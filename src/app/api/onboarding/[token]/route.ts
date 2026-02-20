import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/onboarding/[token]
 * Public. Load form state + pre-fill from lead data.
 * Returns 404 if token invalid, 410 if expired, 200 with form data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const onboardingToken = await prisma.onboardingToken.findUnique({
      where: { token: params.token },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            website: true,
            email: true,
          },
        },
        generatedByUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!onboardingToken) {
      return NextResponse.json({ error: "Invalid onboarding link" }, { status: 404 });
    }

    if (new Date() > onboardingToken.expiresAt) {
      // Mark as expired if not already
      if (onboardingToken.status !== "expired") {
        await prisma.onboardingToken.update({
          where: { id: onboardingToken.id },
          data: { status: "expired" },
        });
      }
      return NextResponse.json(
        { error: "This onboarding link has expired. Please contact your GHM representative." },
        { status: 410 }
      );
    }

    if (onboardingToken.status === "completed") {
      return NextResponse.json(
        { error: "This onboarding has already been completed." },
        { status: 409 }
      );
    }

    // Update access tracking
    await prisma.onboardingToken.update({
      where: { id: onboardingToken.id },
      data: {
        lastAccessedAt: new Date(),
        accessCount: { increment: 1 },
        status: onboardingToken.status === "pending" ? "in_progress" : onboardingToken.status,
      },
    });

    return NextResponse.json({
      lead: {
        id: onboardingToken.lead.id,
        businessName: onboardingToken.lead.businessName,
        address: onboardingToken.lead.address,
        city: onboardingToken.lead.city,
        state: onboardingToken.lead.state,
        zipCode: onboardingToken.lead.zipCode,
        phone: onboardingToken.lead.phone,
        website: onboardingToken.lead.website,
        email: onboardingToken.lead.email,
      },
      token: {
        id: onboardingToken.id,
        status: onboardingToken.status,
        currentStep: onboardingToken.currentStep,
        expiresAt: onboardingToken.expiresAt.toISOString(),
      },
      formData: onboardingToken.formData ?? null,
      partnerName: onboardingToken.generatedByUser.name,
    });
  } catch (error) {
    console.error("Onboarding token load error:", error);
    return NextResponse.json({ error: "Failed to load onboarding form" }, { status: 500 });
  }
}

/**
 * PUT /api/onboarding/[token]
 * Public (token-authenticated). Save partial progress for any step.
 * Body: { step: number, data: object }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const onboardingToken = await prisma.onboardingToken.findUnique({
      where: { token: params.token },
      select: { id: true, status: true, expiresAt: true, formData: true },
    });

    if (!onboardingToken) {
      return NextResponse.json({ error: "Invalid onboarding link" }, { status: 404 });
    }
    if (new Date() > onboardingToken.expiresAt) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }
    if (onboardingToken.status === "completed") {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    const body = await req.json();
    const { step, data } = body as { step: number; data: Record<string, unknown> };

    if (!step || !data) {
      return NextResponse.json({ error: "step and data are required" }, { status: 400 });
    }

    // Merge with existing form data — don't overwrite other steps
    const existingFormData = (onboardingToken.formData as Record<string, unknown>) ?? {};
    const updatedFormData = {
      ...existingFormData,
      [`step${step}`]: data,
    };

    const updated = await prisma.onboardingToken.update({
      where: { id: onboardingToken.id },
      data: {
        formData: updatedFormData as object,
        currentStep: Math.max(step, onboardingToken.status === "pending" ? 1 : 1),
        lastAccessedAt: new Date(),
        status: "in_progress",
      },
      select: { currentStep: true },
    });

    return NextResponse.json({ saved: true, currentStep: updated.currentStep });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
