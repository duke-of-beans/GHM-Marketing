import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminSetupWizard } from "@/components/onboarding/AdminSetupWizard";

export default async function AdminSetupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/manager");

  // If already completed, skip to dashboard
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { adminOnboardingCompletedAt: true },
  });
  if (user?.adminOnboardingCompletedAt) redirect("/manager");

  const settings = await prisma.globalSettings.findFirst({
    select: { companyName: true, companyTagline: true, logoUrl: true, brandColor: true },
  });

  return (
    <AdminSetupWizard
      initialBranding={{
        companyName: settings?.companyName ?? "",
        companyTagline: settings?.companyTagline ?? "",
        logoUrl: settings?.logoUrl ?? null,
        brandColor: settings?.brandColor ?? "#2563eb",
      }}
    />
  );
}
