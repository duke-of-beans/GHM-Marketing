"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";

type ClientOption = {
  id: number;
  businessName: string;
};

type SendForSignatureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Pre-filled from the vault file when launched from vault-file-tile.
   * Pass empty string + vaultFileId=0 when launching from Signatures tab —
   * the dialog will switch to editable mode and show a documentUrl field.
   */
  documentName: string;
  documentUrl: string;
  /**
   * 0 = no vault file (launched from Signatures tab — freeform entry mode).
   * >0 = linked vault file (launched from vault — document fields read-only).
   */
  vaultFileId: number;
  /** Optional — pre-select a client (used from Signatures tab on client detail) */
  defaultClientId?: number;
};

export function SendForSignatureDialog({
  open,
  onOpenChange,
  documentName,
  documentUrl,
  vaultFileId,
  defaultClientId,
}: SendForSignatureDialogProps) {
  const isFreeform = vaultFileId === 0; // launched from Signatures tab, no vault file
  const [docName, setDocName] = useState(documentName);
  const [docUrl, setDocUrl] = useState(documentUrl);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [clientId, setClientId] = useState<number | undefined>(defaultClientId);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load active clients for the optional link dropdown
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    fetch("/api/clients?active=true&limit=20")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setClients(data.data.map((c: any) => ({ id: c.id, businessName: c.businessName })));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingClients(false));
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setDocName(documentName);
      setDocUrl(documentUrl);
      setRecipientEmail("");
      setRecipientName("");
      setClientId(defaultClientId);
    }
  }, [open, documentName, documentUrl, defaultClientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isFreeform && !docName.trim()) {
      toast.error("Document name is required");
      return;
    }
    if (isFreeform && !docUrl.trim()) {
      toast.error("Document URL is required");
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error("Recipient email is required");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentUrl: isFreeform ? docUrl.trim() : documentUrl,
          documentName: isFreeform ? docName.trim() : documentName,
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          ...(vaultFileId > 0 ? { vaultFileId } : {}),
          ...(clientId != null ? { clientId } : {}),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Envelope sent to ${recipientEmail.trim()}`);
        onOpenChange(false);
      } else {
        toast.error(data.error ?? "Failed to send envelope");
      }
    } catch {
      toast.error("Failed to send envelope");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Send for Signature
          </DialogTitle>
          <DialogDescription>
            Send this document to a recipient via DocuSign. They&apos;ll receive an email with a
            signing link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document — read-only from vault, editable in freeform mode */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Document</h3>
            <div className="space-y-2">
              <Label htmlFor="sig-document-name">Document Name *</Label>
              <Input
                id="sig-document-name"
                value={isFreeform ? docName : documentName}
                onChange={isFreeform ? (e) => setDocName(e.target.value) : undefined}
                readOnly={!isFreeform}
                className={!isFreeform ? "bg-muted text-muted-foreground cursor-default" : ""}
                placeholder={isFreeform ? "e.g. Service Agreement — Acme Plumbing" : undefined}
                required={isFreeform}
              />
            </div>
            {isFreeform && (
              <div className="space-y-2">
                <Label htmlFor="sig-document-url">Document URL *</Label>
                <Input
                  id="sig-document-url"
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste the direct URL to the PDF. To send a file from the vault, use the
                  three-dot menu on the file tile instead.
                </p>
              </div>
            )}
          </div>

          {/* Recipient details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Recipient</h3>

            <div className="space-y-2">
              <Label htmlFor="sig-recipient-email">Email *</Label>
              <Input
                id="sig-recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sig-recipient-name">Full Name *</Label>
              <Input
                id="sig-recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
          </div>

          {/* Optional client link */}
          <div className="space-y-2">
            <Label htmlFor="sig-client">Link to Client (optional)</Label>
            <Select
              value={clientId != null ? String(clientId) : "none"}
              onValueChange={(v) => setClientId(v === "none" ? undefined : parseInt(v))}
              disabled={loadingClients}
            >
              <SelectTrigger id="sig-client">
                <SelectValue placeholder={loadingClients ? "Loading…" : "Select a client"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Linking a client makes this envelope visible on their Signatures tab.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4 mr-2" />
                  Send for Signature
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
