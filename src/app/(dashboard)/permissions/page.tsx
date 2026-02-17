import { requirePermission } from "@/lib/auth/permissions";
import { PermissionManager } from "@/components/permissions/permission-manager";

export default async function PermissionsPage() {
  await requirePermission("manage_team");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Permission Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user access levels, permissions, and roles across the platform
        </p>
      </div>

      <PermissionManager />
    </div>
  );
}
