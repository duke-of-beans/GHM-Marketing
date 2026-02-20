import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";
import { VaultSpace, Prisma } from "@prisma/client";

/**
 * GET /api/vault/files?space=shared&category=Sales+Resources&search=contract&clientId=1
 * Returns files the current user can access.
 * - shared / client_reports / signed_contracts: all authenticated users (read)
 * - private: only owner
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);

  const space = searchParams.get("space") as VaultSpace | null;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const clientId = searchParams.get("clientId") ? parseInt(searchParams.get("clientId")!) : undefined;
  const leadId = searchParams.get("leadId") ? parseInt(searchParams.get("leadId")!) : undefined;
  const allVersions = searchParams.get("allVersions") === "true";

  const where: Prisma.VaultFileWhereInput = {
    deletedAt: null,
    ...(space ? { space } : {}),
    ...(category ? { category } : {}),
    ...(clientId ? { clientId } : {}),
    ...(leadId ? { leadId } : {}),
    ...(!allVersions ? { isLatest: true } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  // Private space: only own files
  if (space === "private") {
    where.ownerId = userId;
  }

  const files = await prisma.vaultFile.findMany({
    where,
    include: {
      uploader: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, files });
}

/**
 * DELETE /api/vault/files?id=123
 * Soft-delete. Owner can delete their private files; elevated can delete any.
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userRole = (session.user as { role: string }).role;
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const file = await prisma.vaultFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete =
    isElevated(userRole as never) ||
    (file.space === "private" && file.ownerId === userId);

  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.vaultFile.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
