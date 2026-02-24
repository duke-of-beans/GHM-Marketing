import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { BugTrackingInit } from "@/components/bug-report/BugTrackingInit";
import { BrandThemeInjector } from "@/components/branding/BrandThemeInjector";
import { prisma } from "@/lib/db";
import { getUserPermissions } from "@/lib/auth/permissions";
import { isElevated } from "@/lib/auth/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [fullUser, teamUsers, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { permissions: true, permissionPreset: true, adminOnboardingCompletedAt: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.globalSettings.findFirst({
      select: { pushMessagesEnabled: true, pushTasksEnabled: true, logoUrl: true, companyName: true, brandColor: true, brandColorSecondary: true, brandColorAccent: true },
    }),
  ]);

  // Admin first-run: redirect to setup wizard until completed
  if (session.user.role === "admin" && !fullUser?.adminOnboardingCompletedAt) {
    redirect("/admin-setup");
  }

  const permissions = fullUser
    ? getUserPermissions({
        ...session.user,
        permissions: fullUser.permissions,
        permissionPreset: fullUser.permissionPreset,
      })
    : {};

  const elevated = isElevated(session.user.role);
  const currentUserId = parseInt(session.user.id);
  const pushEnabled = (settings?.pushMessagesEnabled ?? true) || (settings?.pushTasksEnabled ?? true);
  const logoUrl = settings?.logoUrl ?? null;
  const companyName = settings?.companyName ?? null;
  const brandColors = {
    primary: settings?.brandColor ?? null,
    secondary: settings?.brandColorSecondary ?? null,
    accent: settings?.brandColorAccent ?? null,
  };

  // Normalise role for OnboardingTutorial — "admin" maps to the master/manager tutorial
  const tutorialRole: "sales" | "manager" | "owner" =
    session.user.role === "sales" ? "sales" : "manager";

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <BugTrackingInit />
      <BrandThemeInjector colors={brandColors} />
      <DashboardNav user={session.user} permissions={permissions} logoUrl={logoUrl} companyName={companyName} />
      <DashboardLayoutClient
        users={teamUsers}
        isMaster={elevated}
        currentUserId={currentUserId}
        pushEnabled={pushEnabled}
        userRole={tutorialRole}
        userName={session.user.name ?? ""}
      >
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
