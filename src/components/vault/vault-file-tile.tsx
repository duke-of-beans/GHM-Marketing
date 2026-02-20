"use client";

import { useState } from "react";
import { VaultFileRecord } from "./vault-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText, FileImage, FileVideo, FileArchive, File,
  Download, Trash2, ArrowUpRight, MoreVertical, Globe,
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
  const Icon = fileIcon(file.mimeType);

  const canDelete =
    isElevated ||
    (file.space === "private" && file.ownerId === currentUserId);

  const showTransferToShared =
    canTransferToShared && file.space === "private";

  async function handleDelete() {
    if (!confirm(`Delete "${file.name}"?`)) return;
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
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 hover:border-primary/40 transition-colors",
        loading && "opacity-50 pointer-events-none"
      )}
    >
      {/* File icon */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        {(canDelete || showTransferToShared) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={file.blobUrl} download={file.name} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3.5 w-3.5 mr-2" /> Download
                </a>
              </DropdownMenuItem>
              {showTransferToShared && (
                <DropdownMenuItem onClick={handleTransferToShared}>
                  <Globe className="h-3.5 w-3.5 mr-2" /> Move to Shared
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
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
        <p className="text-xs font-medium truncate leading-tight" title={file.name}>
          {file.name}
        </p>
        {file.client && (
          <p className="text-[11px] text-muted-foreground truncate">{file.client.businessName}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatBytes(file.size)} · {formatDate(file.createdAt)}
        </p>
      </div>

      {/* Quick download tap on the whole tile (mobile friendly) */}
      <a
        href={file.blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 rounded-xl"
        aria-label={`Open ${file.name}`}
        onClick={(e) => {
          // Don't fire if dropdown was clicked
          if ((e.target as HTMLElement).closest('[role="menuitem"]')) e.preventDefault();
        }}
      />
    </div>
  );
}
