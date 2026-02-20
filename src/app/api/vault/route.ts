import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";
import { uploadVaultFile, SHARED_CATEGORIES } from "@/lib/vault/vault";
import { VaultSpace } from "@prisma/client";

/** GET /api/vault — list files visible to current user */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const elevated = isElevated(session.user.role as string);
  const { searchParams } = new URL(req.url);

  const space = searchParams.get("space") as VaultSpace | null;
  const category = searchParams.get("category") || undefined;
  const clientId = searchParams.get("clientId") ? parseInt(searchParams.get("clientId")!) : undefined;
  const leadId = searchParams.get("leadId") ? parseInt(searchParams.get("leadId")!) : undefined;
  const search = searchParams.get("search") || undefined;

  // Build space filter based on who's asking
  const spaceFilter = space
    ? [space]
    : elevated
    ? ["shared", "client_reports", "signed_contracts"] as VaultSpace[]
    : ["shared", "client_reports", "signed_contracts"] as VaultSpace[];

  const files = await prisma.vaultFile.findMany({
    where: {
      deletedAt: null,
      isLatest: true,
      OR: [
        // Shared / reports / contracts — visible to all
        { space: { in: spaceFilter } },
        // Private — only owner
        { space: "private", ownerId: userId },
      ],
      ...(category && { category }),
      ...(clientId && { clientId }),
      ...(leadId && { leadId }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    include: {
      uploader: { select: { id: true, name: true } },
      client: { select: { id: true, businessName: true } },
      lead: { select: { id: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ files, categories: SHARED_CATEGORIES });
}

/** POST /api/vault — upload a file */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const elevated = isElevated(session.user.role as string);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const space = (formData.get("space") as VaultSpace) || "private";
  const category = (formData.get("category") as string) || undefined;
  const displayName = (formData.get("displayName") as string) || undefined;
  const clientId = formData.get("clientId") ? parseInt(formData.get("clientId") as string) : undefined;
  const leadId = formData.get("leadId") ? parseInt(formData.get("leadId") as string) : undefined;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Only elevated users can upload to shared / reports / contracts
  if (space !== "private" && !elevated) {
    return NextResponse.json({ error: "Only managers can upload to shared spaces" }, { status: 403 });
  }

  // 25MB limit
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
  }

  try {
    const record = await uploadVaultFile({
      file,
      space,
      uploadedBy: userId,
      category,
      clientId,
      leadId,
      displayName,
    });
    return NextResponse.json({ file: record });
  } catch (err) {
    console.error("Vault upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
