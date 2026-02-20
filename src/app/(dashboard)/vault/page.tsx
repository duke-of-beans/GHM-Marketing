import { getCurrentUser } from "@/lib/auth/session";
import { isElevated } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { VaultClient } from "@/components/vault/vault-client";

export default async function VaultPage() {
  const user = await getCurrentUser();
  const elevated = isElevated(user.role);
  const userId = Number(user.id);

  // Load shared files and private files in parallel
  const [sharedFiles, privateFiles, clientReportFiles, signedContractFiles] =
    await Promise.all([
      prisma.vaultFile.findMany({
        where: { space: "shared", isLatest: true, deletedAt: null },
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vaultFile.findMany({
        where: { space: "private", ownerId: userId, isLatest: true, deletedAt: null },
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vaultFile.findMany({
        where: { space: "client_reports", isLatest: true, deletedAt: null },
        include: {
          uploader: { select: { id: true, name: true } },
          client: { select: { id: true, businessName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.vaultFile.findMany({
        where: { space: "signed_contracts", isLatest: true, deletedAt: null },
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Document Vault</h1>
        <p className="text-sm text-muted-foreground">
          Contracts, resources, reports, and personal files — all in one place.
        </p>
      </div>
      <VaultClient
        initialShared={JSON.parse(JSON.stringify(sharedFiles))}
        initialPrivate={JSON.parse(JSON.stringify(privateFiles))}
        initialClientReports={JSON.parse(JSON.stringify(clientReportFiles))}
        initialSignedContracts={JSON.parse(JSON.stringify(signedContractFiles))}
        currentUserId={userId}
        isElevated={elevated}
      />
    </div>
  );
}
