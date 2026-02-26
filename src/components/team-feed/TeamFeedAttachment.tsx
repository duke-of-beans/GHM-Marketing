"use client";

/**
 * TeamFeedAttachment — shared between TeamFeed.tsx and TeamFeedSidebar.tsx
 * Extracts the AttachmentBlock component to eliminate duplication.
 */

import { useState } from "react";
import { Paperclip, HardDriveDownload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { voice, pick } from "@/lib/voice";

interface AttachmentMsg {
  id: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentVaultId?: number | null;
}

export function AttachmentBlock({ msg }: { msg: AttachmentMsg }) {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(msg.attachmentVaultId ?? null);

  if (!msg.attachmentUrl) return null;

  const name = msg.attachmentName ?? "attachment";
  const size = msg.attachmentSize
    ? msg.attachmentSize < 1024 * 1024
      ? `${(msg.attachmentSize / 1024).toFixed(1)} KB`
      : `${(msg.attachmentSize / (1024 * 1024)).toFixed(1)} MB`
    : null;

  async function saveToVault(e: React.MouseEvent) {
    e.stopPropagation();
    if (savedId) { toast.info(voice.messages.alreadyInVault); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/vault/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, targetSpace: "private" }),
      });
      const json = await res.json();
      if (json.success) { setSavedId(json.file.id); toast.success(pick(voice.messages.savedToVault)); }
      else toast.error(voice.messages.saveFailed);
    } catch { toast.error(voice.messages.saveFailed); }
    finally { setSaving(false); }
  }

  return (
    <div
      className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <a href={msg.attachmentUrl!} target="_blank" rel="noopener noreferrer"
          className="text-xs font-medium truncate hover:underline block" title={name}>
          {name}
        </a>
        {size && <p className="text-[11px] text-muted-foreground">{size}</p>}
      </div>
      <button onClick={saveToVault} disabled={saving || !!savedId}
        title={savedId ? "Saved to Vault" : "Save to Vault"}
        className="flex-shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors">
        {savedId
          ? <CheckCircle className="h-4 w-4 text-status-success" />
          : saving ? <span className="text-[10px]">…</span>
          : <HardDriveDownload className="h-4 w-4" />}
      </button>
    </div>
  );
}
