import { requirePermission } from "@/lib/auth/permissions";
import { PermissionManager } from "@/components/permissions/permission-manager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PermissionsPage() {
  await requirePermission("manage_team");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings?tab=permissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-bold">Permission Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user access levels, permissions, and roles across the platform
        </p>
      </div>

      <PermissionManager />
    </div>
  );
}
