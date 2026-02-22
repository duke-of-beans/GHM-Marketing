import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingSetupPage() {
  const user = await getCurrentUser();

  // Admins don't go through onboarding
  if (user.role === "admin") redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: Number(user.id) },
    select: {
      repOnboardingCompletedAt: true,
      repOnboardingStep: true,
      name: true,
      role: true,
      territoryId: true,
      contractorEntityName: true,
      contractorVendorId: true,
      contractorEmail: true,
      territory: { select: { id: true, name: true } },
      position: { select: { id: true, name: true, type: true } },
    },
  });

  if (!dbUser) redirect("/");

  // Already completed? Go to appropriate dashboard
  if (dbUser.repOnboardingCompletedAt) {
    if (dbUser.role === "sales") redirect("/sales");
    redirect("/master");
  }

  const territory = dbUser.territory ?? null;
  const positionType = dbUser.position?.type ?? (dbUser.role === "sales" ? "sales" : "operations");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OnboardingWizard
        userName={dbUser.name}
        currentStep={dbUser.repOnboardingStep ?? 0}
        territory={territory ? { id: territory.id, name: territory.name } : null}
        positionType={positionType}
        positionName={dbUser.position?.name ?? null}
        role={dbUser.role}
        hasContractorEntity={!!dbUser.contractorVendorId}
      />
    </div>
  );
}
