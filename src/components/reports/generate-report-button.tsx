"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { ReportPreviewModal } from "./report-preview-modal";

const ALL_SECTIONS = [
  { id: "rankings",    label: "Keyword Rankings" },
  { id: "citations",   label: "Citations & Directories" },
  { id: "content",     label: "Content Performance" },
  { id: "backlinks",   label: "Backlinks" },
  { id: "traffic",     label: "Traffic Overview" },
  { id: "competitive", label: "Competitive Analysis" },
  { id: "tasks",       label: "Completed Tasks" },
  { id: "health",      label: "Site Health" },
] as const;

type SectionId = typeof ALL_SECTIONS[number]["id"];

export function GenerateReportButton({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [sections, setSections] = useState<Set<SectionId>>(
    new Set(ALL_SECTIONS.map(s => s.id))
  );
  const [includeAISummary, setIncludeAISummary] = useState(true);
  const [clientFacing, setClientFacing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const toggleSection = (id: SectionId) =>
    setSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next;
    });

  const toggleAll = () =>
    setSections(sections.size === ALL_SECTIONS.length
      ? new Set()
      : new Set(ALL_SECTIONS.map(s => s.id)));

  const handleGenerate = async () => {
    if (sections.size === 0) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: reportType,
          sections: Array.from(sections),
          includeAISummary,
          clientFacing,
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
            <FileText className="h-4 w-4 mr-1" />Generate Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Client Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Report type */}
            <div className="space-y-1.5">
              <Label>Report Period</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (Last 30 Days)</SelectItem>
                  <SelectItem value="quarterly">Quarterly (Last 90 Days)</SelectItem>
                  <SelectItem value="annual">Annual (Last Year)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sections</Label>
                <button
                  onClick={toggleAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {sections.size === ALL_SECTIONS.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SECTIONS.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`section-${s.id}`}
                      checked={sections.has(s.id)}
                      onCheckedChange={() => toggleSection(s.id)}
                    />
                    <label
                      htmlFor={`section-${s.id}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      {s.label}
                    </label>
                  </div>
                ))}
              </div>
              {sections.size === 0 && (
                <p className="text-xs text-status-danger">Select at least one section.</p>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    AI Executive Summary
                  </p>
                  <p className="text-xs text-muted-foreground">Natural language summary of key insights</p>
                </div>
                <Switch checked={includeAISummary} onCheckedChange={setIncludeAISummary} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Client-Facing Mode</p>
                  <p className="text-xs text-muted-foreground">Hides internal notes and scoring details</p>
                </div>
                <Switch checked={clientFacing} onCheckedChange={setClientFacing} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={isGenerating || sections.size === 0}>
                {isGenerating
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Generating...</>
                  : "Generate"}
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
            window.location.reload();
          }}
          reportHtml={generatedReport.html}
          reportId={generatedReport.reportId}
        />
      )}
    </>
  );
}
