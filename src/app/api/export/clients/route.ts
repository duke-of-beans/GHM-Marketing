import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth/permissions";
import { NextRequest, NextResponse } from "next/server";

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
  const canExport = canExportAll || hasPermission(userWithPerms as Parameters<typeof hasPermission>[0], "view_all_clients");

  if (!canExport) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status") ?? "active";

  const clients = await prisma.clientProfile.findMany({
    where: { status: statusFilter === "all" ? undefined : statusFilter },
    select: {
      id: true,
      businessName: true,
      retainerAmount: true,
      healthScore: true,
      status: true,
      paymentStatus: true,
      scanFrequency: true,
      onboardedAt: true,
      lastScanAt: true,
      nextScanAt: true,
      churnedAt: true,
      churnReason: true,
      lead: {
        select: {
          phone: true,
          email: true,
          website: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
      salesRep: { select: { name: true } },
      masterManager: { select: { name: true } },
      tasks: { where: { status: { notIn: ["done", "deployed"] } }, select: { id: true } },
    },
    orderBy: { businessName: "asc" },
  });

  const rows = clients.map((c) => ({
    ID: c.id,
    "Business Name": c.businessName,
    Status: c.status,
    "Retainer ($/mo)": Number(c.retainerAmount),
    "Health Score": c.healthScore,
    "Payment Status": c.paymentStatus ?? "current",
    "Scan Frequency": c.scanFrequency,
    Phone: c.lead.phone,
    Email: c.lead.email ?? "",
    Website: c.lead.website ?? "",
    City: c.lead.city,
    State: c.lead.state,
    "Zip Code": c.lead.zipCode,
    "Sales Rep": c.salesRep?.name ?? "",
    "Master Manager": c.masterManager?.name ?? "",
    "Open Tasks": c.tasks.length,
    "Onboarded At": c.onboardedAt.toISOString().split("T")[0],
    "Last Scan": c.lastScanAt?.toISOString().split("T")[0] ?? "",
    "Next Scan": c.nextScanAt?.toISOString().split("T")[0] ?? "",
    "Churned At": c.churnedAt?.toISOString().split("T")[0] ?? "",
    "Churn Reason": c.churnReason ?? "",
  }));

  const csv = toCSV(rows);
  const filename = `ghm-clients-${statusFilter}-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
