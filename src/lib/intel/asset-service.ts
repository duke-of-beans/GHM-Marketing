import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateAssetRequest,
  CreateAssetGroupRequest,
  CreateCompetitorRequest,
} from "./types";

// ── Asset CRUD ──────────────────────────────────────────────────────────────

export async function createAsset(tenantId: number, data: CreateAssetRequest) {
  return prisma.intelAsset.create({
    data: {
      tenantId,
      domain: data.domain,
      name: data.name,
      type: data.type,
      assetGroupId: data.assetGroupId ?? null,
      ownershipModel: data.ownershipModel ?? "OWNED",
      clientDomainId: data.clientDomainId ?? null,
      siteId: data.siteId ?? null,
      verticalMeta: (data.verticalMeta ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getAsset(tenantId: number, assetId: number) {
  return prisma.intelAsset.findFirst({
    where: { id: assetId, tenantId },
    include: {
      assetGroup: true,
      competitors: true,
      clientDomain: true,
      site: true,
    },
  });
}
export async function listAssets(
  tenantId: number,
  filters?: {
    type?: string;
    assetGroupId?: number;
    ownershipModel?: string;
  }
) {
  return prisma.intelAsset.findMany({
    where: {
      tenantId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.assetGroupId && { assetGroupId: filters.assetGroupId }),
      ...(filters?.ownershipModel && { ownershipModel: filters.ownershipModel }),
    },
    include: {
      assetGroup: { select: { id: true, name: true, type: true } },
      competitors: { select: { id: true, name: true, domain: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAsset(
  tenantId: number,
  assetId: number,
  data: Partial<CreateAssetRequest>
) {
  // Verify ownership first
  const existing = await prisma.intelAsset.findFirst({
    where: { id: assetId, tenantId },
  });
  if (!existing) throw new Error(`Asset ${assetId} not found for tenant ${tenantId}`);

  const updateData: Prisma.IntelAssetUpdateInput = {};
  if (data.domain !== undefined) updateData.domain = data.domain;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.ownershipModel !== undefined) updateData.ownershipModel = data.ownershipModel;
  if (data.verticalMeta !== undefined) updateData.verticalMeta = data.verticalMeta as Prisma.InputJsonValue;
  if (data.assetGroupId !== undefined) {
    updateData.assetGroup = data.assetGroupId
      ? { connect: { id: data.assetGroupId } }
      : { disconnect: true };
  }

  return prisma.intelAsset.update({
    where: { id: assetId },
    data: updateData,
  });
}

export async function deleteAsset(tenantId: number, assetId: number) {
  const existing = await prisma.intelAsset.findFirst({
    where: { id: assetId, tenantId },
  });
  if (!existing) throw new Error(`Asset ${assetId} not found for tenant ${tenantId}`);

  // Cascade: delete competitors tied to this asset
  await prisma.intelCompetitor.deleteMany({ where: { assetId } });

  return prisma.intelAsset.delete({ where: { id: assetId } });
}

// ── Asset Group CRUD ────────────────────────────────────────────────────────

export async function createAssetGroup(
  tenantId: number,
  data: CreateAssetGroupRequest
) {
  return prisma.intelAssetGroup.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type,
      clientProfileId: data.clientProfileId ?? null,
      verticalMeta: (data.verticalMeta ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getAssetGroup(tenantId: number, groupId: number) {
  return prisma.intelAssetGroup.findFirst({
    where: { id: groupId, tenantId },
    include: {
      assets: {
        include: {
          competitors: { select: { id: true, name: true, domain: true } },
        },
      },
      clientProfile: { select: { id: true, businessName: true } },
    },
  });
}

export async function listAssetGroups(
  tenantId: number,
  filters?: { type?: string; clientProfileId?: number }
) {
  return prisma.intelAssetGroup.findMany({
    where: {
      tenantId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.clientProfileId && { clientProfileId: filters.clientProfileId }),
    },
    include: {
      _count: { select: { assets: true } },
      clientProfile: { select: { id: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteAssetGroup(tenantId: number, groupId: number) {
  const existing = await prisma.intelAssetGroup.findFirst({
    where: { id: groupId, tenantId },
    include: { _count: { select: { assets: true } } },
  });
  if (!existing) throw new Error(`AssetGroup ${groupId} not found for tenant ${tenantId}`);
  if (existing._count.assets > 0) {
    throw new Error(
      `Cannot delete group "${existing.name}" — it still has ${existing._count.assets} assets. Remove or reassign them first.`
    );
  }

  return prisma.intelAssetGroup.delete({ where: { id: groupId } });
}

// ── Competitor CRUD ─────────────────────────────────────────────────────────

export async function createCompetitor(
  tenantId: number,
  data: CreateCompetitorRequest
) {
  // Verify the target asset or group belongs to this tenant
  if (data.assetId) {
    const asset = await prisma.intelAsset.findFirst({
      where: { id: data.assetId, tenantId },
    });
    if (!asset) throw new Error(`Asset ${data.assetId} not found for tenant ${tenantId}`);
  }
  if (data.assetGroupId) {
    const group = await prisma.intelAssetGroup.findFirst({
      where: { id: data.assetGroupId, tenantId },
    });
    if (!group) throw new Error(`AssetGroup ${data.assetGroupId} not found for tenant ${tenantId}`);
  }

  return prisma.intelCompetitor.create({
    data: {
      tenantId,
      name: data.name,
      domain: data.domain ?? null,
      googlePlaceId: data.googlePlaceId ?? null,
      assetGroupId: data.assetGroupId ?? null,
      assetId: data.assetId ?? null,
      source: data.source ?? "MANUAL",
    },
  });
}

export async function listCompetitors(
  tenantId: number,
  filters?: { assetId?: number; assetGroupId?: number; source?: string }
) {
  return prisma.intelCompetitor.findMany({
    where: {
      tenantId,
      ...(filters?.assetId && { assetId: filters.assetId }),
      ...(filters?.assetGroupId && { assetGroupId: filters.assetGroupId }),
      ...(filters?.source && { source: filters.source }),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteCompetitor(tenantId: number, competitorId: number) {
  const existing = await prisma.intelCompetitor.findFirst({
    where: { id: competitorId, tenantId },
  });
  if (!existing) throw new Error(`Competitor ${competitorId} not found for tenant ${tenantId}`);

  return prisma.intelCompetitor.delete({ where: { id: competitorId } });
}

// ── Bridge Queries (Intel ↔ Existing Models) ───────────────────────────────

/**
 * Get all intel assets linked to a specific ClientDomain.
 * This bridges the existing client management system to the intel layer.
 */
export async function getAssetsForClientDomain(
  tenantId: number,
  clientDomainId: number
) {
  return prisma.intelAsset.findMany({
    where: { tenantId, clientDomainId },
    include: {
      assetGroup: { select: { id: true, name: true } },
      competitors: true,
    },
  });
}

/**
 * Get the full intel picture for a client profile:
 * all groups, their assets, and competitors.
 */
export async function getIntelOverviewForClient(
  tenantId: number,
  clientProfileId: number
) {
  const groups = await prisma.intelAssetGroup.findMany({
    where: { tenantId, clientProfileId },
    include: {
      assets: {
        include: {
          competitors: true,
          clientDomain: { select: { id: true, domain: true } },
          site: { select: { id: true, displayName: true } },
        },
      },
    },
  });

  // Also grab ungrouped assets linked to this client's domains
  const clientDomains = await prisma.clientDomain.findMany({
    where: { clientId: clientProfileId },
    select: { id: true },
  });
  const domainIds = clientDomains.map((d) => d.id);

  const ungroupedAssets = await prisma.intelAsset.findMany({
    where: {
      tenantId,
      clientDomainId: { in: domainIds },
      assetGroupId: null,
    },
    include: { competitors: true },
  });

  return { groups, ungroupedAssets };
}
