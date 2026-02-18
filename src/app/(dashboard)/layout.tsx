import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { BugTrackingInit } from "@/components/bug-report/BugTrackingInit";
import { prisma } from "@/lib/db";
import { getUserPermissions } from "@/lib/auth/permissions";

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
      select: { permissions: true, permissionPreset: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.globalSettings.findFirst({
      select: { pushMessagesEnabled: true, pushTasksEnabled: true },
    }),
  ]);

  const permissions = fullUser
    ? getUserPermissions({
        ...session.user,
        permissions: fullUser.permissions,
        permissionPreset: fullUser.permissionPreset,
      })
    : {};

  const isMaster = session.user.role === "master";
  const currentUserId = parseInt(session.user.id);
  const pushEnabled = (settings?.pushMessagesEnabled ?? true) || (settings?.pushTasksEnabled ?? true);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <BugTrackingInit />
      <DashboardNav user={session.user} permissions={permissions} />
      <DashboardLayoutClient
        users={teamUsers}
        isMaster={isMaster}
        currentUserId={currentUserId}
        pushEnabled={pushEnabled}
      >
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
