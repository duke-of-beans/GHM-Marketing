// src/app/api/affiliate/import/route.ts
// Affiliate Vertical — CSV Import with source-specific parsers
// Sprint 38-40

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

// Simple CSV parser: handles quoted fields, commas inside quotes
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }
  return rows;
}

type RevenueRow = {
  month: number;
  year: number;
  sourceType: string;
  sourceName: string;
  revenue: number;
  sessions?: number | null;
  pageviews?: number | null;
  clicks?: number | null;
};

function findColumnIndex(headers: string[], ...patterns: string[]): number {
  return headers.findIndex((h) => {
    const lower = h.toLowerCase();
    return patterns.some((p) => lower.includes(p));
  });
}

function extractMonthYear(dateStr: string): { month: number; year: number } | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function parseShareASale(rows: string[][]): { entries: RevenueRow[]; errors: string[] } {
  const headers = rows[0];
  const dateIdx = findColumnIndex(headers, "date");
  const merchantIdx = findColumnIndex(headers, "merchant");
  const commissionIdx = findColumnIndex(headers, "commission");

  if (dateIdx === -1 || merchantIdx === -1 || commissionIdx === -1) {
    return { entries: [], errors: ["ShareASale CSV: missing required columns (date, merchant, commission)"] };
  }

  const groups = new Map<string, number>();
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const dateVal = row[dateIdx];
    const merchant = row[merchantIdx];
    const commission = parseFloat(row[commissionIdx]);

    if (!dateVal || !merchant) { errors.push(`Row ${i + 1}: missing date or merchant`); continue; }
    if (isNaN(commission)) { errors.push(`Row ${i + 1}: invalid commission value`); continue; }

    const my = extractMonthYear(dateVal);
    if (!my) { errors.push(`Row ${i + 1}: invalid date "${dateVal}"`); continue; }

    const key = `${my.month}-${my.year}-${merchant}`;
    groups.set(key, (groups.get(key) ?? 0) + commission);
  }

  const entries: RevenueRow[] = [];
  for (const [key, revenue] of groups) {
    const [monthStr, yearStr, ...merchantParts] = key.split("-");
    entries.push({
      month: parseInt(monthStr, 10),
      year: parseInt(yearStr, 10),
      sourceType: "AFFILIATE",
      sourceName: merchantParts.join("-"),
      revenue,
    });
  }

  return { entries, errors };
}
function parseAmazon(rows: string[][]): { entries: RevenueRow[]; errors: string[] } {
  const headers = rows[0];
  const dateIdx = findColumnIndex(headers, "date");
  const revenueIdx = findColumnIndex(headers, "shipped revenue", "earnings");

  if (dateIdx === -1 || revenueIdx === -1) {
    return { entries: [], errors: ["Amazon CSV: missing required columns (date, shipped revenue/earnings)"] };
  }

  const groups = new Map<string, number>();
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const dateVal = row[dateIdx];
    const revenue = parseFloat(row[revenueIdx]);

    if (!dateVal) { errors.push(`Row ${i + 1}: missing date`); continue; }
    if (isNaN(revenue)) { errors.push(`Row ${i + 1}: invalid revenue value`); continue; }

    const my = extractMonthYear(dateVal);
    if (!my) { errors.push(`Row ${i + 1}: invalid date "${dateVal}"`); continue; }

    const key = `${my.month}-${my.year}`;
    groups.set(key, (groups.get(key) ?? 0) + revenue);
  }

  const entries: RevenueRow[] = [];
  for (const [key, revenue] of groups) {
    const [monthStr, yearStr] = key.split("-");
    entries.push({
      month: parseInt(monthStr, 10),
      year: parseInt(yearStr, 10),
      sourceType: "AFFILIATE",
      sourceName: "Amazon Associates",
      revenue,
    });
  }

  return { entries, errors };
}

function parseCJ(rows: string[][]): { entries: RevenueRow[]; errors: string[] } {
  const headers = rows[0];
  const dateIdx = findColumnIndex(headers, "date");
  const advertiserIdx = findColumnIndex(headers, "advertiser");
  const commissionIdx = findColumnIndex(headers, "commission");

  if (dateIdx === -1 || advertiserIdx === -1 || commissionIdx === -1) {
    return { entries: [], errors: ["CJ CSV: missing required columns (date, advertiser, commission)"] };
  }

  const groups = new Map<string, number>();
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const dateVal = row[dateIdx];
    const advertiser = row[advertiserIdx];
    const commission = parseFloat(row[commissionIdx]);

    if (!dateVal || !advertiser) { errors.push(`Row ${i + 1}: missing date or advertiser`); continue; }
    if (isNaN(commission)) { errors.push(`Row ${i + 1}: invalid commission value`); continue; }

    const my = extractMonthYear(dateVal);
    if (!my) { errors.push(`Row ${i + 1}: invalid date "${dateVal}"`); continue; }

    const key = `${my.month}-${my.year}-${advertiser}`;
    groups.set(key, (groups.get(key) ?? 0) + commission);
  }

  const entries: RevenueRow[] = [];
  for (const [key, revenue] of groups) {
    const [monthStr, yearStr, ...advParts] = key.split("-");
    entries.push({
      month: parseInt(monthStr, 10),
      year: parseInt(yearStr, 10),
      sourceType: "AFFILIATE",
      sourceName: advParts.join("-"),
      revenue,
    });
  }

  return { entries, errors };
}
function parseGeneric(rows: string[][]): { entries: RevenueRow[]; errors: string[] } {
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const monthIdx = headers.indexOf("month");
  const yearIdx = headers.indexOf("year");
  const sourceTypeIdx = headers.indexOf("source_type");
  const sourceNameIdx = headers.indexOf("source_name");
  const revenueIdx = headers.indexOf("revenue");
  const sessionsIdx = headers.indexOf("sessions");
  const pageviewsIdx = headers.indexOf("pageviews");
  const clicksIdx = headers.indexOf("clicks");

  if (monthIdx === -1 || yearIdx === -1 || sourceTypeIdx === -1 || sourceNameIdx === -1 || revenueIdx === -1) {
    return { entries: [], errors: ["Generic CSV: missing required columns (month, year, source_type, source_name, revenue)"] };
  }

  const entries: RevenueRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const month = parseInt(row[monthIdx], 10);
    const year = parseInt(row[yearIdx], 10);
    const sourceType = row[sourceTypeIdx];
    const sourceName = row[sourceNameIdx];
    const revenue = parseFloat(row[revenueIdx]);

    if (isNaN(month) || isNaN(year)) { errors.push(`Row ${i + 1}: invalid month or year`); continue; }
    if (!sourceType || !sourceName) { errors.push(`Row ${i + 1}: missing source_type or source_name`); continue; }
    if (isNaN(revenue)) { errors.push(`Row ${i + 1}: invalid revenue value`); continue; }

    const entry: RevenueRow = { month, year, sourceType, sourceName, revenue };
    if (sessionsIdx !== -1 && row[sessionsIdx]) entry.sessions = parseInt(row[sessionsIdx], 10) || null;
    if (pageviewsIdx !== -1 && row[pageviewsIdx]) entry.pageviews = parseInt(row[pageviewsIdx], 10) || null;
    if (clicksIdx !== -1 && row[clicksIdx]) entry.clicks = parseInt(row[clicksIdx], 10) || null;

    entries.push(entry);
  }

  return { entries, errors };
}

export async function POST(request: NextRequest) {
  const permError = await withPermission(request, "manage_clients");
  if (permError) return permError;

  try {
    const tenant = await requireTenant();
    const tenantId = await getTenantId(tenant.slug);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const source = formData.get("source") as string;
    const siteIdStr = formData.get("siteId") as string;
    const file = formData.get("file") as File | null;

    if (!source || !siteIdStr || !file) {
      return NextResponse.json(
        { success: false, error: "source, siteId, and file are required" },
        { status: 400 }
      );
    }

    const validSources = ["shareasale", "amazon", "cj", "generic"];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: `source must be one of: ${validSources.join(", ")}` },
        { status: 400 }
      );
    }

    const siteId = parseInt(siteIdStr, 10);
    if (isNaN(siteId)) {
      return NextResponse.json({ success: false, error: "Invalid siteId" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({ where: { id: siteId, tenantId } });
    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, error: "CSV file must have a header row and at least one data row" },
        { status: 400 }
      );
    }
    let parsed: { entries: RevenueRow[]; errors: string[] };
    switch (source) {
      case "shareasale": parsed = parseShareASale(rows); break;
      case "amazon": parsed = parseAmazon(rows); break;
      case "cj": parsed = parseCJ(rows); break;
      case "generic": parsed = parseGeneric(rows); break;
      default: parsed = { entries: [], errors: ["Unknown source"] };
    }

    let imported = 0;
    let skipped = 0;
    const errors = [...parsed.errors];

    for (const entry of parsed.entries) {
      try {
        // Dedup check
        const existing = await prisma.revenueEntry.findFirst({
          where: {
            tenantId,
            siteId,
            month: entry.month,
            year: entry.year,
            sourceType: entry.sourceType,
            sourceName: entry.sourceName,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Compute rpm and epc
        const sessions = entry.sessions ?? null;
        const clicks = entry.clicks ?? null;
        const rpm = sessions != null && sessions > 0 ? (entry.revenue / sessions) * 1000 : null;
        const epc = clicks != null && clicks > 0 ? entry.revenue / clicks : null;

        await prisma.revenueEntry.create({
          data: {
            tenantId,
            siteId,
            month: entry.month,
            year: entry.year,
            sourceType: entry.sourceType,
            sourceName: entry.sourceName,
            revenue: entry.revenue,
            sessions,
            pageviews: entry.pageviews ?? null,
            clicks,
            rpm,
            epc,
          },
        });

        imported++;
      } catch (rowError: unknown) {
        const msg = rowError instanceof Error ? rowError.message : "Unknown error";
        errors.push(`Failed to import ${entry.sourceName} ${entry.month}/${entry.year}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process CSV import";
    console.error("[POST /api/affiliate/import]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}