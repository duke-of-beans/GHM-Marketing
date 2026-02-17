import { requirePermission } from "@/lib/auth/permissions";
import { AuditLogsViewer } from "@/components/audit/audit-logs-viewer";

export default async function AuditLogsPage() {
  await requirePermission("manage_settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track user activity, permission checks, and system access for compliance and security
        </p>
      </div>

      <AuditLogsViewer />
    </div>
  );
}
