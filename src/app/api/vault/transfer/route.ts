import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";
import { VaultSpace } from "@prisma/client";

/**
 * POST /api/vault/transfer
 * Body: { fileId?, messageId?, targetSpace, category? }
 *
 * Two modes:
 * 1. fileId — move an existing vault file from private → shared (or between spaces)
 * 2. messageId — promote a TeamFeed attachment into the vault as a new VaultFile
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userRole = (session.user as { role: string }).role;
  const body = await req.json().catch(() => ({}));
  const { fileId, messageId, targetSpace, category } = body as {
    fileId?: number;
    messageId?: number;
    targetSpace?: VaultSpace;
    category?: string;
  };

  if (!targetSpace) return NextResponse.json({ error: "targetSpace required" }, { status: 400 });

  // Moving to a shared/managed space requires elevated role
  if (targetSpace !== "private" && !isElevated(userRole as never)) {
    return NextResponse.json({ error: "Only managers can promote files to shared spaces" }, { status: 403 });
  }

  // MODE 1: Move an existing vault file
  if (fileId) {
    const file = await prisma.vaultFile.findUnique({ where: { id: fileId, deletedAt: null } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Owner can transfer their private file; elevated can move anything
    const canMove = isElevated(userRole as never) || (file.ownerId === userId && file.space === "private");
    if (!canMove) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.vaultFile.update({
      where: { id: fileId },
      data: {
        space: targetSpace,
        category: category ?? file.category,
        ownerId: targetSpace === "private" ? userId : null,
        isLatest: true,
      },
    });

    return NextResponse.json({ success: true, file: updated });
  }

  // MODE 2: Promote a TeamFeed message attachment into the vault
  if (messageId) {
    const msg = await prisma.teamMessage.findUnique({ where: { id: messageId } });
    if (!msg?.attachmentUrl) return NextResponse.json({ error: "Message has no attachment" }, { status: 404 });

    // Fetch the blob and re-upload under vault path (so it's tracked as a vault asset)
    const response = await fetch(msg.attachmentUrl);
    const buffer = await response.arrayBuffer();
    const file = new File([buffer], msg.attachmentName ?? "attachment", {
      type: msg.attachmentMimeType ?? "application/octet-stream",
    });

    const blob = await put(`vault/${targetSpace}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });

    const record = await prisma.vaultFile.create({
      data: {
        name: msg.attachmentName ?? "attachment",
        originalName: msg.attachmentName ?? "attachment",
        mimeType: msg.attachmentMimeType ?? "application/octet-stream",
        size: msg.attachmentSize ?? 0,
        blobUrl: blob.url,
        space: targetSpace,
        category: category ?? null,
        uploadedBy: userId,
        ownerId: targetSpace === "private" ? userId : null,
        isLatest: true,
      },
    });

    // Link the message back to the vault file
    await prisma.teamMessage.update({
      where: { id: messageId },
      data: { attachmentVaultId: record.id },
    });

    return NextResponse.json({ success: true, file: record });
  }

  return NextResponse.json({ error: "fileId or messageId required" }, { status: 400 });
}
