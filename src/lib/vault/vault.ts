import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { VaultSpace } from "@prisma/client";

export const SHARED_CATEGORIES = [
  "Sales Resources",
  "Legal",
  "Templates",
  "Client Reports",
  "Signed Contracts",
  "Misc",
] as const;

export type SharedCategory = (typeof SHARED_CATEGORIES)[number];

export interface UploadVaultFileOptions {
  file: File;
  space: VaultSpace;
  uploadedBy: number;
  category?: string;
  clientId?: number;
  leadId?: number;
  displayName?: string;
}

/**
 * Upload a file to Vercel Blob and record it in the vault DB.
 * For shared space: marks any previous version of same name as not latest.
 */
export async function uploadVaultFile(opts: UploadVaultFileOptions) {
  const {
    file,
    space,
    uploadedBy,
    category,
    clientId,
    leadId,
    displayName,
  } = opts;

  const name = displayName || file.name;
  const path = `vault/${space}/${Date.now()}-${file.name}`;

  // Upload to Vercel Blob
  const blob = await put(path, file, {
    access: "public", // access controlled at app level via signed URLs
    addRandomSuffix: false,
  });

  // For shared space: supersede previous latest version with same name
  let version = 1;
  if (space === "shared" || space === "client_reports" || space === "signed_contracts") {
    const previous = await prisma.vaultFile.findFirst({
      where: { name, space, isLatest: true, deletedAt: null },
      orderBy: { version: "desc" },
    });
    if (previous) {
      version = previous.version + 1;
      await prisma.vaultFile.update({
        where: { id: previous.id },
        data: { isLatest: false },
      });
    }
  }

  // For private files: ownerId = uploader
  const ownerId = space === "private" ? uploadedBy : undefined;

  const record = await prisma.vaultFile.create({
    data: {
      name,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      blobUrl: blob.url,
      space,
      category: category ?? null,
      uploadedBy,
      ownerId: ownerId ?? null,
      clientId: clientId ?? null,
      leadId: leadId ?? null,
      version,
      isLatest: true,
    },
    include: { uploader: { select: { id: true, name: true } } },
  });

  return record;
}

/**
 * Soft-delete a vault file and remove from Blob storage.
 */
export async function deleteVaultFile(fileId: number, requesterId: number, isElevated: boolean) {
  const file = await prisma.vaultFile.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found");

  // Permission: elevated can delete shared/reports/contracts; owner can delete private
  if (file.space === "private" && file.ownerId !== requesterId) {
    throw new Error("Unauthorized");
  }
  if (file.space !== "private" && !isElevated) {
    throw new Error("Unauthorized — only managers can delete shared files");
  }

  // Remove from Blob
  await del(file.blobUrl);

  // Soft delete in DB
  await prisma.vaultFile.update({
    where: { id: fileId },
    data: { deletedAt: new Date(), isLatest: false },
  });
}

/**
 * Transfer a file between spaces.
 * private → shared requires elevated permission.
 */
export async function transferVaultFile(
  fileId: number,
  toSpace: VaultSpace,
  toCategory: string | undefined,
  requesterId: number,
  isElevated: boolean
) {
  const file = await prisma.vaultFile.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found");

  if (file.space === "private" && file.ownerId !== requesterId) throw new Error("Unauthorized");
  if (toSpace === "shared" && !isElevated) throw new Error("Only managers can publish to shared space");

  return prisma.vaultFile.update({
    where: { id: fileId },
    data: {
      space: toSpace,
      category: toCategory ?? file.category,
      ownerId: toSpace === "private" ? requesterId : null,
    },
  });
}
