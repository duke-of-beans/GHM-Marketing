import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminSetupWizard } from "@/components/onboarding/AdminSetupWizard";

export default async function AdminSetupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/manager");

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { adminOnboardingCompletedAt: true, adminOnboardingStep: true },
    }),
    prisma.globalSettings.findFirst({
      select: {
        companyName: true,
        companyTagline: true,
        logoUrl: true,
        brandColor: true,
        brandColorSecondary: true,
        brandColorAccent: true,
      },
    }),
  ]);

  if (user?.adminOnboardingCompletedAt) redirect("/manager");

  return (
    <AdminSetupWizard
      initialBranding={{
        companyName:          settings?.companyName          ?? "",
        companyTagline:       settings?.companyTagline       ?? "",
        logoUrl:              settings?.logoUrl              ?? null,
        brandColor:           settings?.brandColor           ?? "#2563eb",
        brandColorSecondary:  settings?.brandColorSecondary  ?? "#64748b",
        brandColorAccent:     settings?.brandColorAccent     ?? "#f59e0b",
      }}
      initialStep={user?.adminOnboardingStep ?? 0}
    />
  );
}
