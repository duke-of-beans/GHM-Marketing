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
      if (!selected.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        toast.error("File too large (max 5MB)");
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
    } catch {
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
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* File requirements */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Required columns: business_name, phone, city, state, zip_code</p>
            <p>Optional: website, email, address</p>
            <p>Max 500 leads per import, 5MB file limit</p>
          </div>

          {/* File input */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
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
                <div className="bg-green-50 rounded p-2">
                  <p className="text-green-700">Imported</p>
                  <p className="font-semibold text-green-700">{result.imported}</p>
                </div>
                <div className="bg-yellow-50 rounded p-2">
                  <p className="text-yellow-700">Duplicates</p>
                  <p className="font-semibold text-yellow-700">{result.duplicates}</p>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <p className="text-red-700">Failed</p>
                  <p className="font-semibold text-red-700">{result.failed}</p>
                </div>
              </div>

              {result.validationErrors.length > 0 && (
                <div className="max-h-40 overflow-y-auto text-xs space-y-1 border rounded p-2">
                  {result.validationErrors.map((err, i) => (
                    <p key={i} className="text-red-600">
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
