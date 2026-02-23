import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentsOverview } from "@/components/payments/PaymentsOverview";
import { FinancialOverviewSection } from "@/components/payments/FinancialOverviewSection";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch all clients with invoice summary
  const clients = await prisma.clientProfile.findMany({
    where: { status: { in: ["active", "signed", "paused"] } },
    select: {
      id: true,
      businessName: true,
      retainerAmount: true,
      paymentStatus: true,
      lastInvoiceDate: true,
      lastPaymentDate: true,
      waveCustomerId: true,
      invoiceRecords: {
        orderBy: { issuedDate: "desc" },
        take: 3,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          issuedDate: true,
          dueDate: true,
          paidDate: true,
          waveViewUrl: true,
        },
      },
    },
    orderBy: { businessName: "asc" },
  });

  // Pending partner commissions
  const pendingCommissions = await prisma.paymentTransaction.groupBy({
    by: ["userId"],
    where: { status: "pending" },
    _sum: { amount: true },
    _count: { id: true },
  });

  const pendingUserIds = pendingCommissions.map((p) => p.userId);
  const partnerUsers = pendingUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: pendingUserIds } },
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

  const partners = pendingCommissions.map((pc) => ({
    ...pc,
    user: partnerUsers.find((u) => u.id === pc.userId)!,
    total: Number(pc._sum.amount ?? 0),
    count: pc._count.id,
  }));

  // Serialize Decimals
  const serialized = JSON.parse(
    JSON.stringify(clients, (_, v) =>
      v !== null && typeof v === "object" && v.constructor?.name === "Decimal"
        ? Number(v)
        : v
    )
  );

  return (
    <div className="space-y-8 p-6">
      {/* FINANCE-001: Live financial overview — bank balance, AR/AP, cash position */}
      {(session.user as { role?: string }).role === 'admin' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
          <FinancialOverviewSection />
        </div>
      )}
      <PaymentsOverview clients={serialized} partners={partners} />
    </div>
  );
}
