// POST /api/users/import
// Bulk user/contractor import from CSV/XLSX
// Required: name, email, role (admin|master|sales)
// Optional: position_name, territory_id, contractor_entity, contractor_email, temp_password
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import * as XLSX from "xlsx";

const COL: Record<string, string> = {
  "name": "name", "full_name": "name", "full name": "name",
  "email": "email", "email_address": "email",
  "role": "role",
  "position": "positionName", "position_name": "positionName", "job_title": "positionName",
  "territory": "territoryId", "territory_id": "territoryId",
  "contractor_entity": "contractorEntityName", "entity_name": "contractorEntityName", "llc": "contractorEntityName",
  "contractor_email": "contractorEmail", "billing_email": "contractorEmail",
  "temp_password": "tempPassword", "password": "tempPassword", "initial_password": "tempPassword",
};

const VALID_ROLES = ["admin", "master", "sales"];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

function mapRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const field = COL[k.toLowerCase().trim()];
    if (field && v !== undefined && v !== null && v !== "") out[field] = v;
  }
  return out;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_team");
  if (permErr) return permErr;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const isCSV = file.name.endsWith(".csv");
  const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
  if (!isCSV && !isXLSX) return NextResponse.json({ error: "CSV or XLSX only" }, { status: 400 });

  let rawRows: Record<string, unknown>[];
  if (isXLSX) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
  } else {
    rawRows = parseCSV(await file.text()) as Record<string, unknown>[];
  }

  if (rawRows.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (rawRows.length > 100) return NextResponse.json({ error: "Max 100 users per import" }, { status: 400 });

  // Pre-load positions and territories for name→id lookup
  const [positions, territories] = await Promise.all([
    prisma.position.findMany({ select: { id: true, name: true } }),
    prisma.territory.findMany({ select: { id: true, name: true } }),
  ]);
  const positionByName = new Map(positions.map(p => [p.name.toLowerCase(), p.id]));
  const territoryByName = new Map(territories.map(t => [t.name.toLowerCase(), t.id]));

  const created: Array<{ email: string; tempPassword: string }> = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const mapped = mapRow(rawRows[i]);
    const rowNum = i + 2;

    const name = String(mapped.name ?? "").trim();
    const email = String(mapped.email ?? "").trim().toLowerCase();
    const role = String(mapped.role ?? "sales").trim().toLowerCase();

    if (!name) { errors.push({ row: rowNum, message: "Missing name" }); continue; }
    if (!email || !email.includes("@")) { errors.push({ row: rowNum, message: "Missing or invalid email" }); continue; }
    if (!VALID_ROLES.includes(role)) { errors.push({ row: rowNum, message: `Invalid role: ${role}` }); continue; }

    // Resolve position
    const positionName = mapped.positionName ? String(mapped.positionName).toLowerCase() : null;
    const positionId = positionName ? positionByName.get(positionName) ?? null : null;

    // Resolve territory (by name or numeric id)
    let territoryId: number | null = null;
    if (mapped.territoryId) {
      const raw = String(mapped.territoryId);
      const asNum = parseInt(raw);
      if (!isNaN(asNum)) territoryId = asNum;
      else territoryId = territoryByName.get(raw.toLowerCase()) ?? null;
    }

    const tempPassword = mapped.tempPassword ? String(mapped.tempPassword) : generateTempPassword();

    try {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) { errors.push({ row: rowNum, message: `Email already exists: ${email}` }); continue; }

      const passwordHash = await hash(tempPassword, 12);
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role as "admin" | "master" | "sales",
          positionId,
          territoryId,
          contractorEntityName: mapped.contractorEntityName ? String(mapped.contractorEntityName) : null,
          contractorEmail: mapped.contractorEmail ? String(mapped.contractorEmail) : null,
          isActive: true,
        },
      });
      created.push({ email, tempPassword });
    } catch (e) {
      errors.push({ row: rowNum, message: String(e) });
    }
  }

  return NextResponse.json({
    success: true,
    created: created.length,
    failed: errors.length,
    // Return temp passwords so admin can distribute — only returned once, never stored plain
    credentials: created,
    errors: errors.slice(0, 20),
    summary: `${created.length} users created, ${errors.length} failed`,
  });
}
