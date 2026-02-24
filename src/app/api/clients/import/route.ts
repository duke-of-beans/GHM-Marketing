// POST /api/clients/import
// Bulk client import from CSV/XLSX — for productization (agencies onboarding existing client lists)
// Creates Lead + ClientProfile records in one pass.
// Required columns: business_name, email (or phone)
// Optional: retainer_amount, status, sales_rep_email, manager_email, onboarded_at, website, phone, address, city, state, zip
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

const COL: Record<string, string> = {
  "business_name": "businessName", "business name": "businessName", "company": "businessName", "name": "businessName",
  "email": "email", "email_address": "email",
  "phone": "phone", "phone_number": "phone",
  "website": "website", "site": "website", "url": "website",
  "address": "address", "street": "address",
  "city": "city", "state": "state",
  "zip": "zipCode", "zip_code": "zipCode", "postal_code": "zipCode",
  "retainer": "retainerAmount", "retainer_amount": "retainerAmount", "monthly_fee": "retainerAmount", "mrr": "retainerAmount",
  "status": "status",
  "sales_rep": "salesRepEmail", "sales_rep_email": "salesRepEmail", "rep_email": "salesRepEmail",
  "manager": "managerEmail", "manager_email": "managerEmail", "master_email": "managerEmail",
  "onboarded_at": "onboardedAt", "onboarded": "onboardedAt", "start_date": "onboardedAt",
  "report_day": "reportDeliveryDay", "delivery_day": "reportDeliveryDay",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (vals[i] || "").trim(); });
    return row;
  });
}
function parseCSVLine(line: string): string[] {
  const r: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { r.push(cur); cur = ""; }
    else cur += c;
  }
  r.push(cur); return r;
}
function mapRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const field = COL[k.toLowerCase().trim()];
    if (field && v !== undefined && v !== null && v !== "" && v !== "None") out[field] = v;
  }
  return out;
}

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients");
  if (permErr) return permErr;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const isCSV = file.name.endsWith(".csv");
  const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
  if (!isCSV && !isXLSX) return NextResponse.json({ error: "CSV or XLSX only" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max 10MB" }, { status: 400 });

  let rawRows: Record<string, unknown>[];
  if (isXLSX) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  } else {
    rawRows = parseCSV(await file.text()) as Record<string, unknown>[];
  }

  if (rawRows.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (rawRows.length > 500) return NextResponse.json({ error: "Max 500 clients per import" }, { status: 400 });

  // Pre-load rep/manager lookup maps
  const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, email: true, role: true } });
  const byEmail = new Map(users.map(u => [u.email.toLowerCase(), u]));

  const created: number[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const mapped = mapRow(rawRows[i]);
    const rowNum = i + 2;

    const businessName = String(mapped.businessName ?? "").trim();
    const email = String(mapped.email ?? "").trim();
    const phone = String(mapped.phone ?? "").trim();

    if (!businessName) { errors.push({ row: rowNum, message: "Missing business_name" }); continue; }
    if (!email && !phone) { errors.push({ row: rowNum, message: "Need email or phone" }); continue; }

    try {
      const retainerAmount = mapped.retainerAmount
        ? parseFloat(String(mapped.retainerAmount).replace(/[^0-9.]/g, "")) || 2400
        : 2400;
      const status = ["active","signed","paused"].includes(String(mapped.status ?? "")) ? String(mapped.status) : "active";
      const onboardedAt = mapped.onboardedAt ? new Date(String(mapped.onboardedAt)) : new Date();
      const reportDeliveryDay = mapped.reportDeliveryDay ? parseInt(String(mapped.reportDeliveryDay)) : null;

      const salesRep = mapped.salesRepEmail ? byEmail.get(String(mapped.salesRepEmail).toLowerCase()) : null;
      const manager = mapped.managerEmail ? byEmail.get(String(mapped.managerEmail).toLowerCase()) : null;

      const result = await prisma.$transaction(async (tx) => {
        // Create or find lead record (phone-dedup)
        const existing = phone
          ? await tx.lead.findFirst({ where: { phone }, select: { id: true } })
          : null;

        const lead = existing ?? await tx.lead.create({
          data: {
            businessName,
            phone: phone || "unknown",   // Lead.phone is non-nullable in schema
            email: email || null,
            website: mapped.website ? String(mapped.website) : null,
            address: mapped.address ? String(mapped.address) : null,
            city: String(mapped.city ?? ""),
            state: String(mapped.state ?? ""),
            zipCode: mapped.zipCode ? String(mapped.zipCode) : "",
            status: "won",
          },
        });

        // Skip if client profile already exists for this lead
        const existingClient = await tx.clientProfile.findUnique({ where: { leadId: lead.id }, select: { id: true } });
        if (existingClient) return existingClient.id;

        const client = await tx.clientProfile.create({
          data: {
            leadId: lead.id,
            businessName,
            retainerAmount,
            status,
            onboardedAt,
            reportDeliveryDay,
            salesRepId: salesRep?.id ?? null,
            masterManagerId: manager?.id ?? null,
          },
        });
        return client.id;
      });
      created.push(result);
    } catch (e) {
      errors.push({ row: rowNum, message: String(e) });
    }
  }

  return NextResponse.json({
    success: true,
    created: created.length,
    failed: errors.length,
    errors: errors.slice(0, 20),
    summary: `${created.length} clients imported, ${errors.length} failed`,
  });
}
