"use client";

import { useState } from "react";
import { VaultFileRecord } from "./vault-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText, FileImage, FileVideo, FileArchive, File,
  Download, Trash2, Globe, MoreVertical, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("zip") || mimeType.includes("tar")) return FileArchive;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPreviewable(mimeType: string) {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

interface Props {
  file: VaultFileRecord;
  currentUserId: number;
  isElevated: boolean;
  canTransferToShared: boolean;
  onDelete: (id: number) => void;
  onTransfer: (fileId: number, targetSpace: string, updated: VaultFileRecord) => void;
}

export function VaultFileTile({
  file,
  currentUserId,
  isElevated,
  canTransferToShared,
  onDelete,
  onTransfer,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = fileIcon(file.mimeType);

  const canDelete =
    isElevated ||
    (file.space === "private" && file.ownerId === currentUserId);

  const showTransferToShared =
    canTransferToShared && file.space === "private";

  const previewable = isPreviewable(file.mimeType);

  function handleTileClick(e: React.MouseEvent) {
    // Don't open preview if clicking the dropdown trigger
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) return;
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) return;
    if (previewable) {
      setPreviewOpen(true);
    } else {
      // Non-previewable: trigger download directly
      window.open(file.blobUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${file.displayName ?? file.name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vault/files?id=${file.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        onDelete(file.id);
        toast.success("File deleted");
      } else {
        toast.error(json.error ?? "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransferToShared() {
    const category = prompt("Category (e.g. Sales Resources, Legal, Templates):", "Sales Resources");
    if (!category) return;
    setLoading(true);
    try {
      const res = await fetch("/api/vault/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, targetSpace: "shared", category }),
      });
      const json = await res.json();
      if (json.success) {
        onTransfer(file.id, "shared", json.file);
        toast.success("Moved to Shared");
      } else {
        toast.error(json.error ?? "Transfer failed");
      }
    } catch {
      toast.error("Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* File tile */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTileClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleTileClick(e as any); }}
        className={cn(
          "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 cursor-pointer",
          "hover:border-primary/40 hover:bg-muted/30 transition-colors",
          loading && "opacity-50 pointer-events-none"
        )}
      >
        {/* Icon row + dropdown */}
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          {(canDelete || showTransferToShared) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a
                    href={file.blobUrl}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-3.5 w-3.5 mr-2" /> Download
                  </a>
                </DropdownMenuItem>
                {showTransferToShared && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTransferToShared(); }}>
                    <Globe className="h-3.5 w-3.5 mr-2" /> Move to Shared
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate leading-tight" title={file.displayName ?? file.name}>
            {file.displayName ?? file.name}
          </p>
          {file.client && (
            <p className="text-[11px] text-muted-foreground truncate">{file.client.businessName}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatBytes(file.size)} · {formatDate(file.createdAt)}
          </p>
          {previewable && (
            <p className="text-[10px] text-primary/60 mt-0.5">Click to preview</p>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewable && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
              <DialogTitle className="text-sm font-medium truncate pr-4">
                {file.displayName ?? file.name}
              </DialogTitle>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={file.blobUrl}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </a>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {file.mimeType === "application/pdf" ? (
                <iframe
                  src={file.blobUrl}
                  className="w-full h-full border-0"
                  title={file.displayName ?? file.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/20 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.blobUrl}
                    alt={file.displayName ?? file.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
