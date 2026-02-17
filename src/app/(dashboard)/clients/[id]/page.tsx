import { requireMaster } from "@/lib/auth/session";
import { getClient } from "@/lib/db/clients";
import { notFound } from "next/navigation";
import { ClientProfile } from "@/components/clients/profile";
import Link from "next/link";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMaster();
  const { id } = await params;
  const clientId = parseInt(id);
  if (isNaN(clientId)) notFound();

  const client = await getClient(clientId);
  if (!client) notFound();

  // Serialize Prisma types (Decimal, Date) and ensure safe defaults
  // Convert Decimals to numbers explicitly to avoid JSON serialization issues
  const serialized = {
    ...client,
    retainerAmount: Number(client.retainerAmount),
    lead: client.lead ? {
      ...client.lead,
      reviewAvg: client.lead.reviewAvg ? Number(client.lead.reviewAvg) : null,
    } : null,
  };

  // Parse dates and other JSON-safe conversions
  const safeSerialized = JSON.parse(JSON.stringify(serialized));

  // Guard: ensure required arrays exist (defensive against partial data)
  safeSerialized.competitors = safeSerialized.competitors || [];
  safeSerialized.domains = safeSerialized.domains || [];
  safeSerialized.tasks = safeSerialized.tasks || [];
  safeSerialized.notes = safeSerialized.notes || [];
  safeSerialized.scans = safeSerialized.scans || [];
  safeSerialized.reports = safeSerialized.reports || [];
  safeSerialized.upsellOpportunities = safeSerialized.upsellOpportunities || [];

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clients" className="hover:text-foreground transition-colors">
          Clients
        </Link>
        <span>/</span>
        <span className="text-foreground">{client.businessName}</span>
      </div>
      <ClientProfile client={safeSerialized} />
    </div>
  );
}
