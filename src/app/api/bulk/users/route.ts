// POST /api/bulk/users
// Bulk operations on users/contractors: role, position, territory, deactivate, activate, reset_onboarding
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import type { BulkUserOperation } from "@/lib/bulk/types";
import { bulkResponse } from "@/lib/bulk/types";

const PROTECTED_IDS = [1]; // David — never bulk-modified

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_team");
  if (permErr) return permErr;

  const body = await request.json() as { ids: number[] } & BulkUserOperation;
  const { ids, operation } = body;
  const params = (body as { params?: Record<string, unknown> }).params ?? {};

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  if (ids.length > 100)
    return NextResponse.json({ error: "Maximum 100 users per bulk operation" }, { status: 400 });

  // Never touch protected accounts
  const safeIds = ids.filter(id => !PROTECTED_IDS.includes(id));
  const blocked = ids.filter(id => PROTECTED_IDS.includes(id));

  const users = await prisma.user.findMany({ where: { id: { in: safeIds } }, select: { id: true } });
  const found = new Set(users.map(u => u.id));
  const results: { id: number; error?: string }[] = [
    ...blocked.map(id => ({ id, error: "Cannot modify owner account" })),
  ];

  switch (operation) {
    case "role": {
      const role = params.role as "admin" | "master" | "sales";
      if (!["admin", "master", "sales"].includes(role))
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      for (const id of safeIds) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.user.update({ where: { id }, data: { role } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "position": {
      const positionId = params.positionId as number | null;
      if (positionId !== null) {
        const pos = await prisma.position.findUnique({ where: { id: positionId }, select: { id: true } });
        if (!pos) return NextResponse.json({ error: "Position not found" }, { status: 400 });
      }
      for (const id of safeIds) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.user.update({ where: { id }, data: { positionId } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "territory": {
      const territoryId = params.territoryId as number | null;
      if (territoryId !== null) {
        const t = await prisma.territory.findUnique({ where: { id: territoryId }, select: { id: true } });
        if (!t) return NextResponse.json({ error: "Territory not found" }, { status: 400 });
      }
      for (const id of safeIds) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.user.update({ where: { id }, data: { territoryId } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "deactivate": {
      for (const id of safeIds) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.user.update({ where: { id }, data: { isActive: false } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "activate": {
      for (const id of safeIds) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.user.update({ where: { id }, data: { isActive: true } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "reset_onboarding": {
      for (const id of safeIds) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.user.update({ where: { id }, data: { repOnboardingCompletedAt: null, repOnboardingStep: 0 } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    default:
      return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  }

  return bulkResponse(results);
}
