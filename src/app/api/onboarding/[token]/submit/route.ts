import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_OPS_CHECKLIST } from "@/lib/onboarding/types";
import type { TechnicalAccess, Step1Data, Step2Data, Step3Data, Step4Data, Step5Data } from "@/lib/onboarding/types";
import { sendOpsOnboardingNotification, sendPartnerOnboardingNotification } from "@/lib/email/index";
import { sendPushToUser } from "@/lib/push";

/**
 * POST /api/onboarding/[token]/submit
 * Public (token-authenticated). Final submission.
 * Creates OnboardingSubmission, creates/updates ClientProfile,
 * populates opsChecklist, notifies ops + partner.
 */
export async function POST(
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
            status: true,
            businessName: true,
            assignedTo: true,
          },
        },
        generatedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
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
    const { finalData } = body as {
      finalData: {
        step1: Step1Data;
        step2: Step2Data;
        step3: Step3Data;
        step4: Step4Data;
        step5: Step5Data;
      };
    };

    if (!finalData?.step1 || !finalData?.step2 || !finalData?.step3 || !finalData?.step4) {
      return NextResponse.json({ error: "Incomplete submission — all steps required" }, { status: 400 });
    }

    const { step1, step2, step3, step4, step5 } = finalData;
    const technicalAccess = step3.technicalAccess as TechnicalAccess;

    // Build initial opsChecklist from what client told us
    const opsChecklist = { ...DEFAULT_OPS_CHECKLIST };
    // Pre-populate status notes from technical access answers
    if (technicalAccess.dns?.method === "invite") {
      opsChecklist.dnsReceived.notes = "Client will send invite";
    } else if (technicalAccess.dns?.method === "help") {
      opsChecklist.dnsReceived.notes = "Client needs help — schedule walkthrough";
    }
    if (technicalAccess.gbp?.hasProfile === false) {
      opsChecklist.gbpReceived.notes = "No GBP exists — needs creation";
    }
    if (technicalAccess.analytics?.hasGA4 === false) {
      opsChecklist.analyticsReceived.notes = "No GA4 — set up for client";
    }
    if (technicalAccess.cms?.method === "not_now") {
      opsChecklist.cmsReceived.notes = "Client not ready — follow up";
    }

    // Upsert ClientProfile if this lead won
    const existingProfile = await prisma.clientProfile.findUnique({
      where: { leadId: onboardingToken.leadId },
    });

    // Run everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the submission record
      const submission = await tx.onboardingSubmission.create({
        data: {
          tokenId: onboardingToken.id,
          leadId: onboardingToken.leadId,

          // Step 1
          businessName: step1.businessName,
          address: step1.address,
          city: step1.city,
          state: step1.state,
          zipCode: step1.zipCode,
          phone: step1.phone,
          website: step1.website || null,
          businessDescription: step1.businessDescription || null,
          primaryServices: step1.primaryServices ?? [],
          serviceAreas: step1.serviceAreas || null,
          multiLocation: step1.multiLocation,
          locationCount: step1.multiLocation ? (step1.locationCount ?? null) : null,

          // Step 2
          primaryContactName: step2.primaryContactName,
          primaryContactTitle: step2.primaryContactTitle || null,
          primaryContactEmail: step2.primaryContactEmail,
          primaryContactPhone: step2.primaryContactPhone,
          preferredContactMethod: step2.preferredContactMethod || null,
          billingSameAsPrimary: step2.billingSameAsPrimary,
          billingContactName: step2.billingSameAsPrimary ? null : (step2.billingContactName ?? null),
          billingContactEmail: step2.billingSameAsPrimary ? null : (step2.billingContactEmail ?? null),
          billingContactPhone: step2.billingSameAsPrimary ? null : (step2.billingContactPhone ?? null),
          paymentMethod: step2.paymentMethod || null,
          requiresPO: step2.requiresPO,
          poNumber: step2.requiresPO ? (step2.poNumber ?? null) : null,

          // Step 3
          technicalAccess: technicalAccess as object,

          // Step 4
          competitors: step4.competitors ?? [],
          competitorPains: step4.competitorPains ?? [],
          competitorNotes: step4.competitorNotes || null,
          contentFocusTopics: step4.contentFocusTopics || null,
          contentAvoidTopics: step4.contentAvoidTopics || null,
          tonePreference: step4.tonePreference || null,
          contentReviewPref: step4.contentReviewPref || null,

          // Step 5 (optional, may be partial)
          hasLogo: step5?.hasLogo ?? false,
          hasBrandGuidelines: step5?.hasBrandGuidelines ?? false,
          hasPhotography: step5?.hasPhotography ?? false,
          socialProfiles: step5?.socialProfiles ?? [],
          directoryListings: step5?.directoryListings || null,
          previousSEO: step5?.previousSEO ?? false,
          previousSEONotes: step5?.previousSEO ? (step5?.previousSEONotes ?? null) : null,
          additionalNotes: step5?.additionalNotes || null,

          opsChecklist: opsChecklist as object,
        },
      });

      // Mark token completed
      await tx.onboardingToken.update({
        where: { id: onboardingToken.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          submittedData: finalData as object,
        },
      });

      // Transition lead to "won" if not already
      if (onboardingToken.lead.status !== "won") {
        await tx.lead.update({
          where: { id: onboardingToken.leadId },
          data: {
            status: "won",
            statusChangedAt: new Date(),
          },
        });

        await tx.leadHistory.create({
          data: {
            leadId: onboardingToken.leadId,
            oldStatus: onboardingToken.lead.status,
            newStatus: "won",
            notes: "Onboarding form submitted by client",
          },
        });
      }

      // Upsert ClientProfile
      if (!existingProfile) {
        await tx.clientProfile.create({
          data: {
            leadId: onboardingToken.leadId,
            businessName: step1.businessName,
            status: "active",
            onboardedAt: new Date(),
            salesRepId: onboardingToken.lead.assignedTo ?? null,
          },
        });
      } else {
        await tx.clientProfile.update({
          where: { leadId: onboardingToken.leadId },
          data: {
            businessName: step1.businessName,
            onboardedAt: new Date(),
          },
        });
      }

      return submission;
    });

    // Fire notifications — non-blocking, failures logged but don't break the response
    void (async () => {
      try {
        // Find all admin/master users to notify ops team
        const opsUsers = await prisma.user.findMany({
          where: { role: { in: ["admin", "master"] } },
          select: { id: true, email: true },
        });

        const opsEmails = opsUsers.map((u) => u.email).filter(Boolean) as string[];

        // Email ops team
        await sendOpsOnboardingNotification({
          submissionId: result.id,
          businessName: step1.businessName,
          partnerName: onboardingToken.generatedByUser.name,
          opsEmails,
        });

        // Push notification to each ops user
        for (const opsUser of opsUsers) {
          await sendPushToUser(opsUser.id, {
            title: "New onboarding completed",
            body: `${step1.businessName} just submitted their onboarding form.`,
            url: `/clients/onboarding/${result.id}`,
          });
        }

        // Email partner
        if (onboardingToken.generatedByUser.email) {
          await sendPartnerOnboardingNotification({
            partnerEmail: onboardingToken.generatedByUser.email,
            partnerName: onboardingToken.generatedByUser.name,
            businessName: step1.businessName,
            submissionId: result.id,
          });
        }

        // Push notification to partner
        await sendPushToUser(onboardingToken.generatedBy, {
          title: `🎉 ${step1.businessName} completed onboarding!`,
          body: "The ops team has been notified and will begin setup.",
          url: `/clients/onboarding/${result.id}`,
        });
      } catch (notifyErr) {
        console.error("Onboarding notification error (non-fatal):", notifyErr);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Welcome to GHM Digital! Your onboarding is complete.",
      submissionId: result.id,
      partnerName: onboardingToken.generatedByUser.name,
    });
  } catch (error) {
    console.error("Onboarding submit error:", error);
    return NextResponse.json({ error: "Failed to submit onboarding" }, { status: 500 });
  }
}
