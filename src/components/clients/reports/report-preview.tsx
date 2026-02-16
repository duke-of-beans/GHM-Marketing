"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Send, Loader2 } from "lucide-react";

export function ReportPreview({
  reportId,
  open,
  onClose,
}: {
  reportId: number;
  open: boolean;
  onClose: () => void;
}) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && reportId) {
      fetchReportHTML();
    }
  }, [open, reportId]);

  const fetchReportHTML = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/html`);
      if (response.ok) {
        const data = await response.json();
        setHtml(data.html);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    // TODO: Implement PDF download
    alert("PDF download coming soon!");
  };

  const handleSendEmail = async () => {
    // TODO: Implement email send
    alert("Email delivery coming soon!");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail}>
                <Send className="h-4 w-4 mr-1" />
                Email to Client
              </Button>
            </div>

            <div
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
