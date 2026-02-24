"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, CloudUpload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VaultFileRecord } from "./vault-client";

type Space = "shared" | "private" | "client_reports" | "signed_contracts";

const SHARED_CATEGORIES = [
  "Sales Resources",
  "Legal",
  "Templates",
  "Onboarding",
  "Misc",
];

interface Props {
  space: Space;
  isElevated: boolean;
  onUpload: (file: VaultFileRecord) => void;
}

export function VaultUploadButton({ space: defaultSpace, isElevated, onUpload }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space>(defaultSpace);
  const [category, setCategory] = useState("Sales Resources");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("space", selectedSpace);
      if (selectedSpace === "shared") form.append("category", category);
      if (displayName.trim()) form.append("displayName", displayName.trim());
      if (displayName.trim()) form.append("displayName", displayName.trim());

      const res = await fetch("/api/vault/upload", { method: "POST", body: form });
      const json = await res.json();

      if (json.success) {
        onUpload(json.file as VaultFileRecord);
        toast.success(`"${displayName.trim() || file.name}" uploaded`);
        setPendingFile(null);
        setDisplayName("");
        setOpen(false);
      } else {
        toast.error(json.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    setPendingFile(file);
    // Pre-fill display name with filename minus extension
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
    setDisplayName(nameWithoutExt);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Space selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Upload to</label>
            <Select
              value={selectedSpace}
              onValueChange={(v) => setSelectedSpace(v as Space)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isElevated && (
                  <>
                    <SelectItem value="shared">Shared (everyone)</SelectItem>
                    <SelectItem value="signed_contracts">Signed Contracts</SelectItem>
                  </>
                )}
                <SelectItem value="private">My Files (private)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category (shared only) */}
          {selectedSpace === "shared" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHARED_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Drop zone */}
          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              pendingFile && "border-green-500 bg-green-50 dark:bg-green-950/20"
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <CloudUpload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            {pendingFile ? (
              <div>
                <p className="text-sm font-medium">{pendingFile.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(pendingFile.size / 1024).toFixed(1)} KB · Ready to upload
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Drop a file or click to browse</p>
                <p className="text-xs text-muted-foreground mt-0.5">Any file type</p>
              </div>
            )}
          </div>

          {/* Optional display name */}
          {pendingFile && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Display name <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                placeholder={pendingFile.name}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Leave blank to use the filename</p>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!pendingFile || uploading}
            onClick={() => pendingFile && upload(pendingFile)}
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
