import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
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

  // Fetch user permissions
  const fullUser = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: {
      permissions: true,
      permissionPreset: true,
    },
  });

  const permissions = fullUser ? getUserPermissions({
    ...session.user,
    permissions: fullUser.permissions,
    permissionPreset: fullUser.permissionPreset,
  }) : {};

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <BugTrackingInit />
      <DashboardNav user={session.user} permissions={permissions} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
