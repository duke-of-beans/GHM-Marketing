"use client";

import { useState } from "react";
import { VaultFileRecord } from "./vault-client";
import { VaultFileTile } from "./vault-file-tile";
import { FileX } from "lucide-react";

interface Props {
  files: VaultFileRecord[];
  space: string;
  currentUserId: number;
  isElevated: boolean;
  onDelete: (id: number) => void;
  onTransfer: (fileId: number, targetSpace: string, updated: VaultFileRecord) => void;
  canTransferToShared?: boolean;
  emptyMessage?: string;
}

export function VaultFileGrid({
  files,
  space,
  currentUserId,
  isElevated,
  onDelete,
  onTransfer,
  canTransferToShared = false,
  emptyMessage,
}: Props) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileX className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground max-w-xs">
          {emptyMessage ?? "No files here yet."}
        </p>
      </div>
    );
  }

  // Group shared files by category
  if (space === "shared") {
    const grouped: Record<string, VaultFileRecord[]> = {};
    files.forEach((f) => {
      const key = f.category ?? "Uncategorized";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    });

    const categoryOrder = [
      "Sales Resources",
      "Legal",
      "Templates",
      "Onboarding",
      "Misc",
      "Uncategorized",
    ];

    const sorted = Object.entries(grouped).sort(
      ([a], [b]) =>
        (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
        (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
    );

    return (
      <div className="space-y-6">
        {sorted.map(([category, catFiles]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              {category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {catFiles.map((file) => (
                <VaultFileTile
                  key={file.id}
                  file={file}
                  currentUserId={currentUserId}
                  isElevated={isElevated}
                  canTransferToShared={canTransferToShared}
                  onDelete={onDelete}
                  onTransfer={onTransfer}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat grid for private / reports / contracts
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {files.map((file) => (
        <VaultFileTile
          key={file.id}
          file={file}
          currentUserId={currentUserId}
          isElevated={isElevated}
          canTransferToShared={canTransferToShared}
          onDelete={onDelete}
          onTransfer={onTransfer}
        />
      ))}
    </div>
  );
}
