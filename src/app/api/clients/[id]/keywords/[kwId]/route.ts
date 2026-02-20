/**
 * PATCH /api/clients/[id]/keywords/[kwId] — update keyword (category, active state, etc.)
 * DELETE /api/clients/[id]/keywords/[kwId] — deactivate keyword
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kwId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { id, kwId } = await params;
  const clientId = parseInt(id);
  const keywordId = parseInt(kwId);
  if (isNaN(clientId) || isNaN(keywordId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();
  const allowed = ["category", "isActive", "searchVolume", "difficulty", "targetUrl"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const kw = await prisma.keywordTracker.update({
    where: { id: keywordId, clientId },
    data: update,
  });

  return NextResponse.json(kw);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kwId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { id, kwId } = await params;
  const clientId = parseInt(id);
  const keywordId = parseInt(kwId);
  if (isNaN(clientId) || isNaN(keywordId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Soft delete — deactivate rather than destroy (preserve historical snapshots)
  await prisma.keywordTracker.update({
    where: { id: keywordId, clientId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
