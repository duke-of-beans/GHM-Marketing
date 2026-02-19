import { requirePermission } from "@/lib/auth/permissions";
import { AuditLogsViewer } from "@/components/audit/audit-logs-viewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AuditLogsPage() {
  await requirePermission("manage_settings");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings?tab=audit"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track user activity, permission checks, and system access for compliance and security
        </p>
      </div>

      <AuditLogsViewer />
    </div>
  );
}
