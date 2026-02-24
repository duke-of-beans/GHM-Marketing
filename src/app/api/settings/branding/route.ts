// POST — upload logo to Vercel Blob, store URL in GlobalSettings
// DELETE — remove current logo from Blob + null out DB field

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

async function getSettings() {
  return prisma.globalSettings.findFirst({ select: { id: true, logoUrl: true } });
}

export async function POST(req: NextRequest) {
  await requirePermission("manage_settings");

  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File must be PNG, JPG, SVG, or WebP" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const blob = await put(`branding/logo.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const settings = await getSettings();
  if (settings) {
    // Delete old logo from Blob (non-blocking)
    if (settings.logoUrl) {
      del(settings.logoUrl).catch(() => {});
    }
    await prisma.globalSettings.update({
      where: { id: settings.id },
      data: { logoUrl: blob.url },
    });
  }

  return NextResponse.json({ url: blob.url });
}

export async function DELETE() {
  await requirePermission("manage_settings");

  const settings = await getSettings();
  if (!settings) return NextResponse.json({ ok: true });

  if (settings.logoUrl) {
    await del(settings.logoUrl).catch(() => {});
    await prisma.globalSettings.update({
      where: { id: settings.id },
      data: { logoUrl: null },
    });
  }

  return NextResponse.json({ ok: true });
}
