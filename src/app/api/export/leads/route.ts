import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth/permissions";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

function toCSV(rows: Record<string, string | number | null | undefined>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { prisma: db } = await import("@/lib/db");
  const fullUser = await db.user.findUnique({
    where: { id: parseInt(user.id) },
    select: { role: true, permissions: true, permissionPreset: true },
  });

  const canExportAll = fullUser?.role === "admin";
  const userWithPerms = { ...user, permissions: fullUser?.permissions, permissionPreset: fullUser?.permissionPreset };
  const canExport = canExportAll || hasPermission(userWithPerms as Parameters<typeof hasPermission>[0], "manage_leads");

  if (!canExport) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const baseFilter = canExportAll ? {} : territoryFilter(user);
  const where: Prisma.LeadWhereInput = {
    ...baseFilter,
    ...(statusFilter ? { status: { in: statusFilter.split(",").map((s) => s.trim()) as Prisma.EnumLeadStatusFilter["in"] } } : {}),
  };

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedUser: { select: { name: true } },
      territory: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = leads.map((l) => ({
    ID: l.id,
    "Business Name": l.businessName,
    Phone: l.phone,
    Email: l.email ?? "",
    Website: l.website ?? "",
    Address: l.address ?? "",
    City: l.city,
    State: l.state,
    "Zip Code": l.zipCode,
    Status: l.status,
    "Deal Value": Number(l.dealValueTotal),
    "Monthly Value": Number(l.dealValueMonthly),
    "Review Count": l.reviewCount ?? "",
    "Review Avg": l.reviewAvg ? Number(l.reviewAvg) : "",
    "Domain Rating": l.domainRating ?? "",
    "Impact Score": l.impactScore ?? "",
    "Close Score": l.closeScore ?? "",
    "Priority Tier": l.priorityTier ?? "",
    "Market Type": l.marketType ?? "",
    "Assigned To": l.assignedUser?.name ?? "",
    Territory: l.territory?.name ?? "",
    "Created At": l.createdAt.toISOString().split("T")[0],
    "Updated At": l.updatedAt.toISOString().split("T")[0],
  }));

  const csv = toCSV(rows);
  const filename = `ghm-leads-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
