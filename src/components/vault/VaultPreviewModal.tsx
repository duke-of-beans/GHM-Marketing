"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { VaultFileRecord } from "./vault-client";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  file: VaultFileRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultPreviewModal({ file, open, onOpenChange }: Props) {
  const [zoomed, setZoomed] = useState(false);

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const isDocx =
    file.mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isXlsx =
    file.mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimeType === "application/vnd.ms-excel";

  const isShared = file.space === "shared";

  const fileName = file.displayName ?? file.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
        {/* Header: file name + metadata bar */}
        <DialogHeader className="flex flex-row items-start justify-between px-4 py-3 border-b shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-sm font-medium truncate">
              {fileName}
            </DialogTitle>
            {/* Metadata bar */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                Uploaded {formatDate(file.createdAt)}
              </span>
              {file.category && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {file.category}
                  </span>
                </>
              )}
              {isShared && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {file.version ? `Version ${file.version}` : "Current version"}
                </Badge>
              )}
            </div>
          </div>
          {/* Download always in header for easy access */}
          <a
            href={file.blobUrl}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </a>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden">
          {isPdf && (
            <iframe
              src={file.blobUrl}
              className="w-full h-full border-0"
              title={fileName}
            />
          )}

          {isImage && (
            <div
              className={`w-full h-full flex items-center justify-center bg-muted/20 p-4 cursor-pointer relative`}
              onClick={() => setZoomed(!zoomed)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.blobUrl}
                alt={fileName}
                className={`transition-all duration-200 rounded ${
                  zoomed
                    ? "max-w-none max-h-none w-auto h-auto object-none cursor-zoom-out"
                    : "max-w-full max-h-full object-contain cursor-zoom-in"
                }`}
              />
              <div className="absolute top-2 right-2 bg-background/80 rounded p-1">
                {zoomed ? (
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          )}

          {(isDocx || isXlsx) && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {isDocx ? "W" : "X"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isDocx ? "Word Document" : "Excel Spreadsheet"} — preview
                    not available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(file.size)} · Uploaded{" "}
                    {formatDate(file.createdAt)}
                  </p>
                </div>
                <a
                  href={file.blobUrl}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Download {isDocx ? "Document" : "Spreadsheet"}
                  </Button>
                </a>
              </div>
            </div>
          )}

          {!isPdf && !isImage && !isDocx && !isXlsx && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preview not available for this file type
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(file.size)} · Uploaded{" "}
                    {formatDate(file.createdAt)}
                  </p>
                </div>
                <a
                  href={file.blobUrl}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Download File
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer: mime type + download */}
        <div className="border-t px-4 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground">{file.mimeType}</span>
          <a
            href={file.blobUrl}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-7 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
