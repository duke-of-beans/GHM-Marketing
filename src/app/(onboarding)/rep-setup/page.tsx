import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { RepOnboardingWizard } from "@/components/onboarding/rep-onboarding-wizard";

export default async function RepSetupPage() {
  const user = await getCurrentUser();

  // Only sales reps go through this flow
  if (user.role !== "sales") redirect("/master");

  // Already completed? Go to dashboard
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(user.id) },
    select: {
      repOnboardingCompletedAt: true,
      repOnboardingStep: true,
      name: true,
      territoryId: true,
      territory: { select: { id: true, name: true } },
    },
  });

  if (dbUser?.repOnboardingCompletedAt) redirect("/sales");

  const territory = dbUser?.territory ?? null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <RepOnboardingWizard
        userName={dbUser?.name ?? user.name}
        currentStep={dbUser?.repOnboardingStep ?? 0}
        territory={territory ? { id: territory.id, name: territory.name } : null}
      />
    </div>
  );
}
