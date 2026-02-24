import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";
import { VaultSpace } from "@prisma/client";

/**
 * POST /api/vault/upload
 * Multipart form: file, space, category?, clientId?, leadId?
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userRole = (session.user as { role: string }).role;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const space = (formData.get("space") as VaultSpace) ?? "private";
  const category = (formData.get("category") as string) ?? null;
  const clientId = formData.get("clientId") ? parseInt(formData.get("clientId") as string) : null;
  const leadId = formData.get("leadId") ? parseInt(formData.get("leadId") as string) : null;
  const displayName = (formData.get("displayName") as string | null)?.trim() || null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Shared/managed spaces require elevated role
  if (space !== "private" && !isElevated(userRole as never)) {
    return NextResponse.json({ error: "Only managers can upload to shared spaces" }, { status: 403 });
  }

  // Version management: mark previous versions as non-latest for shared files
  if (space === "shared" && category) {
    await prisma.vaultFile.updateMany({
      where: { space, category, name: file.name, isLatest: true, deletedAt: null },
      data: { isLatest: false },
    });
  }

  const blob = await put(`vault/${space}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  const record = await prisma.vaultFile.create({
    data: {
      name: file.name,
      originalName: file.name,
      displayName: displayName ?? null,
      mimeType: file.type,
      size: file.size,
      blobUrl: blob.url,
      space,
      category,
      uploadedBy: userId,
      ownerId: space === "private" ? userId : null,
      clientId,
      leadId,
      isLatest: true,
    },
  });

  return NextResponse.json({ success: true, file: record });
}
