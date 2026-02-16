"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Mail } from "lucide-react";
import { ReportPreviewModal } from "./report-preview-modal";

type Report = {
  id: number;
  type: string;
  periodStart: Date;
  periodEnd: Date;
  sentToClient: boolean;
  createdAt: Date;
  content: any;
};

export function ReportsList({ reports, clientId }: { reports: Report[]; clientId: number }) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);

  const handleViewReport = async (report: Report) => {
    // Generate HTML from stored content
    try {
      const response = await fetch("/api/reports/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewHtml(data.html);
        setSelectedReport(report);
      }
    } catch (error) {
      console.error("Failed to load report:", error);
    }
  };

  const handleEmailReport = async (reportId: number) => {
    setSendingEmail(reportId);
    try {
      const response = await fetch("/api/email/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (response.ok) {
        alert("Report sent successfully!");
        window.location.reload(); // Refresh to update "sent" status
      } else {
        alert("Failed to send report");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send report");
    } finally {
      setSendingEmail(null);
    }
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No reports generated yet</p>
          <p className="text-sm mt-2">Use the "Generate Report" button to create one</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(report.periodStart).toLocaleDateString()} -{" "}
                    {new Date(report.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={report.sentToClient ? "default" : "secondary"}>
                  {report.sentToClient ? "Sent" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Generated {new Date(report.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {!report.sentToClient && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleEmailReport(report.id)}
                      disabled={sendingEmail === report.id}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {sendingEmail === report.id ? "Sending..." : "Email Client"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedReport && previewHtml && (
        <ReportPreviewModal
          open={!!selectedReport}
          onClose={() => {
            setSelectedReport(null);
            setPreviewHtml(null);
          }}
          reportHtml={previewHtml}
          reportId={selectedReport.id}
        />
      )}
    </>
  );
}
