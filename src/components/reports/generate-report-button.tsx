"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { ReportPreviewModal } from "./report-preview-modal";

export function GenerateReportButton({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: reportType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedReport(data);
        setOpen(false);
        setShowPreview(true);
      } else {
        alert("Failed to generate report");
      }
    } catch (error) {
      console.error("Report generation error:", error);
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" />
            Generate Report
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Client Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (Last 30 Days)</SelectItem>
                  <SelectItem value="quarterly">Quarterly (Last 90 Days)</SelectItem>
                  <SelectItem value="annual">Annual (Last Year)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {generatedReport && (
        <ReportPreviewModal
          open={showPreview}
          onClose={() => {
            setShowPreview(false);
            setGeneratedReport(null);
            window.location.reload(); // Refresh to show new report in list
          }}
          reportHtml={generatedReport.html}
          reportId={generatedReport.reportId}
        />
      )}
    </>
  );
}
