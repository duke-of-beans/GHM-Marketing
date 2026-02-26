"use client";
// BulkImportDialog — reusable CSV/XLSX upload dialog for clients and users
// Handles file selection, column preview, upload, and results display.
import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ImportResult = {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
  summary: string;
  // user import only
  credentials?: { email: string; tempPassword: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  endpoint: string;           // "/api/clients/import" | "/api/users/import"
  title: string;
  description: string;
  templateColumns: string[];  // shown as helper text
  templateFilename: string;
  maxRows: number;
};

export function BulkImportDialog({ open, onClose, onSuccess, endpoint, title, description, templateColumns, templateFilename, maxRows }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) { toast.error("CSV or Excel files only"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Max file size 10MB"); return; }
    setFile(f);
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data: ImportResult = await res.json();
      setResult(data);
      if (data.created > 0) onSuccess();
    } catch (e) {
      toast.error(`Upload failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const header = templateColumns.join(",");
    const example = templateColumns.map(() => "").join(",");
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = templateFilename; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() { setFile(null); setResult(null); }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Template download */}
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              <span>Need a template?</span>
              <Button size="sm" variant="ghost" className="gap-1.5 h-7" onClick={downloadTemplate}>
                <Download className="h-3.5 w-3.5" /> Download CSV template
              </Button>
            </div>

            {/* Column list */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supported columns:</p>
              <div className="flex flex-wrap gap-1">
                {templateColumns.map(col => (
                  <Badge key={col} variant="secondary" className="text-xs font-mono">{col}</Badge>
                ))}
              </div>
              <p className="pt-1">Max {maxRows} rows per import. CSV or XLSX accepted.</p>
            </div>

            {/* Drop zone */}
            <div
              className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              {file ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium">Drop file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">CSV or Excel (.xlsx)</p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || loading} className="gap-1.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {loading ? "Importing…" : "Import"}
              </Button>
            </div>
          </div>
        ) : (
          /* Results view */
          <div className="space-y-4">
            <div className={`flex items-center gap-3 rounded-lg p-4 ${result.failed === 0 ? "bg-status-success-bg" : "bg-status-warning-bg"}`}>
              {result.failed === 0
                ? <CheckCircle2 className="h-5 w-5 text-status-success shrink-0" />
                : <AlertCircle className="h-5 w-5 text-status-warning shrink-0" />}
              <div>
                <p className="text-sm font-medium">{result.summary}</p>
                {result.failed > 0 && <p className="text-xs text-muted-foreground mt-0.5">{result.failed} rows had errors (see below)</p>}
              </div>
            </div>

            {/* Credentials — user import only */}
            {result.credentials && result.credentials.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Temp passwords — copy now, not stored:</p>
                <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                  {result.credentials.map(c => (
                    <div key={c.email}><span className="text-muted-foreground">{c.email}</span> → <span className="font-semibold">{c.tempPassword}</span></div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-destructive">Errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { reset(); }}>Import another</Button>
              <Button onClick={() => { reset(); onClose(); }}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
