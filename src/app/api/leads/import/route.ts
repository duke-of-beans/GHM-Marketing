import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkCreateLeads, type BulkLeadInput } from "@/lib/db/leads";
import type { SessionUser } from "@/lib/auth/session";
import * as XLSX from "xlsx";

// ============================================================================
// Column Mapping - maps any lead gen format to our schema
// ============================================================================

const COLUMN_MAP: Record<string, string> = {
  // Business info
  "business_name": "businessName",
  "business name": "businessName",
  "company": "businessName",
  "company_name": "businessName",
  "company name": "businessName",
  "name": "businessName",
  "phone": "phone",
  "phone_number": "phone",
  "phone number": "phone",
  "telephone": "phone",
  "address": "address",
  "full_address": "address",
  "full address": "address",
  "street_address": "address",
  "website": "website",
  "site": "website",
  "url": "website",
  "web": "website",
  "email": "email",
  "email_address": "email",
  "email address": "email",
  "city": "city",
  "state": "state",
  "zip": "zipCode",
  "zip_code": "zipCode",
  "zip code": "zipCode",
  "zipcode": "zipCode",
  "postal_code": "zipCode",

  // Scoring fields (from lead gen machine)
  "priority_tier": "priorityTier",
  "priority tier": "priorityTier",
  "tier": "priorityTier",
  "impact_score": "impactScore",
  "impact score": "impactScore",
  "close_score": "closeScore",
  "close score": "closeScore",
  "market_type": "marketType",
  "market type": "marketType",
  "suppression_signal": "suppressionSignal",
  "suppression signal": "suppressionSignal",
  "pitch_angle": "pitchAngle",
  "pitch angle": "pitchAngle",
  "pitch": "pitchAngle",
  "rating": "reviewAvg",
  "review_avg": "reviewAvg",
  "reviews": "reviewCount",
  "review_count": "reviewCount",
  "review count": "reviewCount",
  "wealth_score": "wealthScore",
  "wealth score": "wealthScore",
  "distance_from_metro": "distanceFromMetro",
  "distance from metro": "distanceFromMetro",
  "municipal_mismatch": "_municipalMismatch",
  "municipal mismatch?": "_municipalMismatch",
  "municipal mismatch": "_municipalMismatch",
};

// ============================================================================
// Address Parser - "309 1st St #3604, Los Altos, CA 94022" → parts
// ============================================================================

function parseAddress(address: string): { street: string; city: string; state: string; zip: string } {
  const result = { street: "", city: "", state: "", zip: "" };
  if (!address) return result;

  // Try pattern: "Street, City, ST ZIP"
  const match = address.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (match) {
    result.street = match[1].trim();
    result.city = match[2].trim();
    result.state = match[3].trim().toUpperCase();
    result.zip = match[4].trim();
    return result;
  }

  // Try pattern: "City, ST ZIP" (no street)
  const match2 = address.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (match2) {
    result.city = match2[1].trim();
    result.state = match2[2].trim().toUpperCase();
    result.zip = match2[3].trim();
    return result;
  }

  result.street = address;
  return result;
}

// ============================================================================
// Map raw row to our lead format
// ============================================================================

function mapRow(raw: Record<string, unknown>, headerMap: Record<string, string>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const [rawKey, ourField] of Object.entries(headerMap)) {
    const value = raw[rawKey];
    if (value !== undefined && value !== null && value !== "" && value !== "None") {
      mapped[ourField] = value;
    }
  }

  // If no city/state/zip but we have address, parse it
  if (!mapped.city && !mapped.state && mapped.address) {
    const parsed = parseAddress(String(mapped.address));
    if (parsed.city) mapped.city = parsed.city;
    if (parsed.state) mapped.state = parsed.state;
    if (parsed.zip) mapped.zipCode = parsed.zip;
    if (parsed.street) mapped.address = parsed.street;
  }

  // Normalize phone
  if (mapped.phone) {
    mapped.phone = String(mapped.phone).replace(/[^\d+]/g, "");
  }

  // Parse numeric scores
  if (mapped.impactScore) mapped.impactScore = parseInt(String(mapped.impactScore), 10) || null;
  if (mapped.closeScore) mapped.closeScore = parseInt(String(mapped.closeScore), 10) || null;
  if (mapped.reviewCount) mapped.reviewCount = parseInt(String(mapped.reviewCount), 10) || null;
  if (mapped.reviewAvg) mapped.reviewAvg = parseFloat(String(mapped.reviewAvg)) || null;
  if (mapped.distanceFromMetro) {
    const dist = String(mapped.distanceFromMetro).replace(/[^\d.]/g, "");
    mapped.distanceFromMetro = parseFloat(dist) || null;
  }

  return mapped;
}

// ============================================================================
// CSV Parser
// ============================================================================

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, j) => { row[header.trim()] = (values[j] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

// ============================================================================
// Build header map from raw headers
// ============================================================================

function buildHeaderMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.trim().toLowerCase();
    if (COLUMN_MAP[normalized]) {
      map[header.trim()] = COLUMN_MAP[normalized];
    }
  }
  return map;
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Only master users can import leads" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const leadSourceId = formData.get("leadSourceId") as string | null;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  const isCSV = file.name.endsWith(".csv");
  const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

  if (!isCSV && !isXLSX) {
    return NextResponse.json({ success: false, error: "File must be CSV or Excel (.xlsx/.xls)" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Parse file into raw rows
  let rawRows: Record<string, unknown>[];
  let headers: string[];

  if (isXLSX) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    rawRows = json;
    headers = json.length > 0 ? Object.keys(json[0]) : [];
  } else {
    const text = await file.text();
    const parsed = parseCSV(text);
    rawRows = parsed;
    headers = parsed.length > 0 ? Object.keys(parsed[0]) : [];
  }

  if (rawRows.length === 0) {
    return NextResponse.json({ success: false, error: "File is empty or has no data rows" }, { status: 400 });
  }

  if (rawRows.length > 1000) {
    return NextResponse.json({ success: false, error: `Maximum 1000 leads per import (got ${rawRows.length})` }, { status: 400 });
  }

  // Build column mapping
  const headerMap = buildHeaderMap(headers);

  if (!headerMap || Object.keys(headerMap).length === 0) {
    return NextResponse.json({
      success: false,
      error: "Could not map any columns. Expected columns like: Business Name, Phone, Address, City, State, etc.",
      details: { foundHeaders: headers },
    }, { status: 400 });
  }

  // Check we have minimum required fields (businessName + phone, or businessName + address)
  const mappedFields = new Set(Object.values(headerMap));
  const hasBusinessName = mappedFields.has("businessName");
  const hasPhone = mappedFields.has("phone");
  const hasAddress = mappedFields.has("address");
  const hasCity = mappedFields.has("city");

  if (!hasBusinessName) {
    return NextResponse.json({
      success: false,
      error: "Could not find a 'Business Name' column",
      details: { foundHeaders: headers, mappedTo: Object.fromEntries(Object.entries(headerMap)) },
    }, { status: 400 });
  }

  if (!hasPhone) {
    return NextResponse.json({
      success: false,
      error: "Could not find a 'Phone' column",
      details: { foundHeaders: headers },
    }, { status: 400 });
  }

  if (!hasCity && !hasAddress) {
    return NextResponse.json({
      success: false,
      error: "Need either City/State/Zip columns or a full Address column to parse",
      details: { foundHeaders: headers },
    }, { status: 400 });
  }

  // Map and validate each row
  const validLeads: BulkLeadInput[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const mapped = mapRow(rawRows[i], headerMap);

    if (!mapped.businessName || !mapped.phone) {
      errors.push({ row: i + 2, message: "Missing business name or phone" });
      continue;
    }

    if (!mapped.city || !mapped.state) {
      errors.push({ row: i + 2, message: `Could not determine city/state for: ${mapped.address || "no address"}` });
      continue;
    }

    validLeads.push({
      businessName: String(mapped.businessName),
      phone: String(mapped.phone),
      city: String(mapped.city),
      state: String(mapped.state),
      zipCode: String(mapped.zipCode || ""),
      website: mapped.website ? String(mapped.website) : undefined,
      email: mapped.email ? String(mapped.email) : undefined,
      address: mapped.address ? String(mapped.address) : undefined,
      leadSourceId: leadSourceId ? parseInt(leadSourceId, 10) : undefined,
      // Scoring fields
      priorityTier: mapped.priorityTier ? String(mapped.priorityTier) : undefined,
      impactScore: typeof mapped.impactScore === "number" ? mapped.impactScore : undefined,
      closeScore: typeof mapped.closeScore === "number" ? mapped.closeScore : undefined,
      marketType: mapped.marketType ? String(mapped.marketType) : undefined,
      suppressionSignal: mapped.suppressionSignal ? String(mapped.suppressionSignal) : undefined,
      pitchAngle: mapped.pitchAngle ? String(mapped.pitchAngle) : undefined,
      reviewCount: typeof mapped.reviewCount === "number" ? mapped.reviewCount : undefined,
      reviewAvg: typeof mapped.reviewAvg === "number" ? mapped.reviewAvg : undefined,
      wealthScore: mapped.wealthScore ? String(mapped.wealthScore) : undefined,
      distanceFromMetro: typeof mapped.distanceFromMetro === "number" ? mapped.distanceFromMetro : undefined,
    });
  }

  if (validLeads.length === 0) {
    return NextResponse.json({
      success: false,
      error: "No valid leads found",
      details: { errors: errors.slice(0, 10) },
    }, { status: 400 });
  }

  console.log(`Import: ${rawRows.length} rows parsed, ${validLeads.length} valid, ${errors.length} errors`);
  if (errors.length > 0) console.log("First errors:", errors.slice(0, 5));

  try {
    const result = await bulkCreateLeads(validLeads);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        columnsMapped: Object.fromEntries(Object.entries(headerMap)),
        validationErrors: errors.slice(0, 20),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Import error:", message);
    return NextResponse.json({
      success: false,
      error: "Database error during import",
      details: {
        message: message.slice(0, 2000),
        leadCount: validLeads.length,
        validationErrorCount: errors.length,
        firstErrors: errors.slice(0, 5),
        sampleLead: validLeads[0],
      },
    }, { status: 500 });
  }
}
