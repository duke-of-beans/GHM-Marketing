import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { csvLeadRowSchema } from "@/lib/validations";
import { bulkCreateLeads, type BulkLeadInput } from "@/lib/db/leads";
import type { SessionUser } from "@/lib/auth/session";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header row (handle quoted fields)
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, j) => {
      row[header] = (values[j] || "").trim();
    });
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
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;

  // Only master can import leads
  if (user.role !== "master") {
    return NextResponse.json(
      { success: false, error: "Only master users can import leads" },
      { status: 403 }
    );
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const leadSourceId = formData.get("leadSourceId") as string | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 }
    );
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json(
      { success: false, error: "File must be a CSV" },
      { status: 400 }
    );
  }

  // Size limit: 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: "File too large (max 5MB)" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const rawRows = parseCSV(text);

  if (rawRows.length === 0) {
    return NextResponse.json(
      { success: false, error: "CSV is empty or has no data rows" },
      { status: 400 }
    );
  }

  if (rawRows.length > 500) {
    return NextResponse.json(
      { success: false, error: "Maximum 500 leads per import (got " + rawRows.length + ")" },
      { status: 400 }
    );
  }

  // Validate each row
  const validLeads: BulkLeadInput[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = csvLeadRowSchema.safeParse(rawRows[i]);
    if (parsed.success) {
      validLeads.push({
        businessName: parsed.data.business_name,
        phone: parsed.data.phone,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zip_code,
        website: parsed.data.website || undefined,
        email: parsed.data.email || undefined,
        address: parsed.data.address || undefined,
        leadSourceId: leadSourceId ? parseInt(leadSourceId, 10) : undefined,
      });
    } else {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const msg = Object.entries(fieldErrors)
        .map(([field, errs]) => `${field}: ${(errs || []).join(", ")}`)
        .join("; ");
      errors.push({ row: i + 2, message: msg }); // +2 for header row + 0-index
    }
  }

  if (validLeads.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "No valid leads found in CSV",
        details: { errors: errors.slice(0, 10) },
      },
      { status: 400 }
    );
  }

  // Bulk insert with territory assignment and dedup
  const result = await bulkCreateLeads(validLeads);

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      validationErrors: errors.slice(0, 20), // Return first 20 validation errors
    },
  });
}
