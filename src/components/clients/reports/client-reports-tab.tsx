"use client";

import { ReportsList } from "@/components/reports/reports-list";
import { GenerateReportButton } from "@/components/reports/generate-report-button";

type Report = {
  id: number;
  type: string;
  periodStart: Date;
  periodEnd: Date;
  sentToClient: boolean;
  createdAt: Date;
  content: any;
};

export function ClientReportsTab({
  clientId,
  reports,
}: {
  clientId: number;
  reports: Report[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Client Reports</h3>
          <p className="text-sm text-muted-foreground">
            Monthly performance reports for client delivery
          </p>
        </div>
        <GenerateReportButton clientId={clientId} />
      </div>

      <ReportsList reports={reports} />
    </div>
  );
}
