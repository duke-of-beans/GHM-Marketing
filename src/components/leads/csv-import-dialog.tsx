"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ImportResult = {
  total: number;
  imported: number;
  duplicates: number;
  failed: number;
  validationErrors: { row: number; message: string }[];
};

type CSVImportDialogProps = {
  onComplete: () => void;
};

export function CSVImportDialog({ onComplete }: CSVImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        toast.error("Please select a CSV or Excel file");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File too large (max 10MB)");
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        toast.success(`Imported ${data.data.imported} leads`);
        onComplete();
      } else {
        toast.error(data.error || "Import failed");
        if (data.details) {
          console.error("Import error details:", data.details);
        }
        if (data.details?.errors) {
          setResult({
            total: 0,
            imported: 0,
            duplicates: 0,
            failed: 0,
            validationErrors: data.details.errors,
          });
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed — check your connection");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Import Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* File requirements */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Accepts CSV or Excel (.xlsx) files</p>
            <p>Auto-detects columns: Business Name, Phone, Address, etc.</p>
            <p>Addresses are auto-parsed into City / State / Zip</p>
            <p>Scoring data (Impact Score, Priority Tier, etc.) preserved</p>
            <p>Max 1,000 leads per import, 10MB file limit</p>
          </div>

          {/* File input */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground truncate">
              {file ? file.name : "No file selected"}
            </span>
          </div>

          {/* Upload button */}
          {file && !result && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? "Importing..." : `Import ${file.name}`}
            </Button>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded p-2">
                  <p className="text-muted-foreground">Total rows</p>
                  <p className="font-semibold">{result.total}</p>
                </div>
                <div className="bg-status-success-bg rounded p-2">
                  <p className="text-status-success">Imported</p>
                  <p className="font-semibold text-status-success">{result.imported}</p>
                </div>
                <div className="bg-status-warning-bg rounded p-2">
                  <p className="text-status-warning">Duplicates</p>
                  <p className="font-semibold text-status-warning">{result.duplicates}</p>
                </div>
                <div className="bg-status-danger-bg rounded p-2">
                  <p className="text-status-danger">Failed</p>
                  <p className="font-semibold text-status-danger">{result.failed}</p>
                </div>
              </div>

              {result.validationErrors.length > 0 && (
                <div className="max-h-40 overflow-y-auto text-xs space-y-1 border rounded p-2">
                  {result.validationErrors.map((err, i) => (
                    <p key={i} className="text-status-danger">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              <Button onClick={handleClose} className="w-full" variant="outline">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
