"use client";

import { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VaultFileGrid } from "@/components/vault/vault-file-grid";
import { VaultUploadButton } from "@/components/vault/vault-upload-button";
import { Search, Lock, Globe, FileText, PenLine, AlertTriangle } from "lucide-react";

export interface VaultFileRecord {
  id: number;
  name: string;
  originalName: string;
  displayName: string | null;
  mimeType: string;
  size: number;
  blobUrl: string;
  space: string;
  category: string | null;
  uploadedBy: number;
  uploader: { id: number; name: string };
  ownerId: number | null;
  clientId: number | null;
  client?: { id: number; businessName: string } | null;
  version: number;
  isLatest: boolean;
  createdAt: string;
}

interface Props {
  initialShared: VaultFileRecord[];
  initialPrivate: VaultFileRecord[];
  initialClientReports: VaultFileRecord[];
  initialSignedContracts: VaultFileRecord[];
  currentUserId: number;
  isElevated: boolean;
}

export function VaultClient({
  initialShared,
  initialPrivate,
  initialClientReports,
  initialSignedContracts,
  currentUserId,
  isElevated,
}: Props) {
  const [shared, setShared] = useState(initialShared);
  const [privateFiles, setPrivateFiles] = useState(initialPrivate);
  const [clientReports, setClientReports] = useState(initialClientReports);
  const [signedContracts, setSignedContracts] = useState(initialSignedContracts);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("shared");

  const filter = useCallback(
    (files: VaultFileRecord[]) =>
      search.trim()
        ? files.filter((f) =>
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            (f.displayName ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : files,
    [search]
  );

  // Optimistic add after upload
  function onUpload(file: VaultFileRecord) {
    if (file.space === "shared") setShared((prev) => [file, ...prev]);
    else if (file.space === "private") setPrivateFiles((prev) => [file, ...prev]);
    else if (file.space === "client_reports") setClientReports((prev) => [file, ...prev]);
    else if (file.space === "signed_contracts") setSignedContracts((prev) => [file, ...prev]);
  }

  // Optimistic remove after delete
  function onDelete(id: number) {
    setShared((p) => p.filter((f) => f.id !== id));
    setPrivateFiles((p) => p.filter((f) => f.id !== id));
    setClientReports((p) => p.filter((f) => f.id !== id));
    setSignedContracts((p) => p.filter((f) => f.id !== id));
  }

  // After transfer: remove from current space, add to target (refetch for simplicity)
  function onTransfer(fileId: number, targetSpace: string, updatedFile: VaultFileRecord) {
    onDelete(fileId);
    if (updatedFile.space === "shared") setShared((p) => [updatedFile, ...p]);
    else if (updatedFile.space === "private") setPrivateFiles((p) => [updatedFile, ...p]);
  }

  return (
    <div className="space-y-4">
      {/* Global search + upload */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <VaultUploadButton
          space={activeTab as "shared" | "private" | "client_reports" | "signed_contracts"}
          isElevated={isElevated}
          onUpload={onUpload}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="shared" className="flex-1 gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Shared
          </TabsTrigger>
          <TabsTrigger value="private" className="flex-1 gap-1.5">
            <Lock className="h-3.5 w-3.5" /> My Files
          </TabsTrigger>
          <TabsTrigger value="client_reports" className="flex-1 gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Reports
          </TabsTrigger>
          <TabsTrigger value="signed_contracts" className="flex-1 gap-1.5">
            <PenLine className="h-3.5 w-3.5" /> Contracts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="mt-4">
          {/* Version warning banner — shown to non-elevated users only */}
          {!isElevated && (
            <div className="flex items-start gap-2.5 rounded-lg border border-status-warning-border bg-status-warning-bg px-3.5 py-2.5 mb-4 text-xs text-status-warning">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Always use files from this Shared folder.</strong> Documents saved to your device or private files may become outdated. Contracts, agreements, and comp sheets are only guaranteed current here.
              </span>
            </div>
          )}
          <VaultFileGrid
            files={filter(shared)}
            space="shared"
            currentUserId={currentUserId}
            isElevated={isElevated}
            onDelete={onDelete}
            onTransfer={onTransfer}
            emptyMessage="No shared files yet. Managers can upload contracts, comp sheets, and team resources here."
          />
        </TabsContent>

        <TabsContent value="private" className="mt-4">
          <VaultFileGrid
            files={filter(privateFiles)}
            space="private"
            currentUserId={currentUserId}
            isElevated={isElevated}
            onDelete={onDelete}
            onTransfer={onTransfer}
            canTransferToShared={isElevated}
            emptyMessage="Nothing here yet. Upload prospect notes, drafts, or anything you want to keep handy."
          />
        </TabsContent>

        <TabsContent value="client_reports" className="mt-4">
          <VaultFileGrid
            files={filter(clientReports)}
            space="client_reports"
            currentUserId={currentUserId}
            isElevated={isElevated}
            onDelete={onDelete}
            onTransfer={onTransfer}
            emptyMessage="Generated client reports will appear here automatically."
          />
        </TabsContent>

        <TabsContent value="signed_contracts" className="mt-4">
          <VaultFileGrid
            files={filter(signedContracts)}
            space="signed_contracts"
            currentUserId={currentUserId}
            isElevated={isElevated}
            onDelete={onDelete}
            onTransfer={onTransfer}
            emptyMessage="Signed partner and client agreements live here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
