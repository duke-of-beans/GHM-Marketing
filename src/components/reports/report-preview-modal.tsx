"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Send } from "lucide-react";

export function ReportPreviewModal({
  open,
  onClose,
  reportHtml,
  reportId,
}: {
  open: boolean;
  onClose: () => void;
  reportHtml: string;
  reportId: number;
}) {
  const handleDownload = () => {
    // Create a blob from the HTML
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `client-report-${reportId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border rounded-lg bg-card">
          <iframe
            srcDoc={reportHtml}
            className="w-full h-full min-h-[600px]"
            title="Report Preview"
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download HTML
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              Print / Save as PDF
            </Button>
            <Button variant="default">
              <Send className="h-4 w-4 mr-1" />
              Send to Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
