import { requirePermission } from "@/lib/auth/permissions";
import { getClient } from "@/lib/db/clients";
import { notFound } from "next/navigation";
import { ClientProfile } from "@/components/clients/profile";
import Link from "next/link";

// Helper to convert all Decimal fields to numbers recursively
function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimals(item));
  }
  
  // Handle Prisma Decimal objects (they have toNumber() method)
  if (typeof obj === 'object' && obj.constructor?.name === 'Decimal') {
    return Number(obj);
  }
  
  // Handle plain objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeDecimals(obj[key]);
    }
    return result;
  }
  
  return obj;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const currentUser = await requirePermission("manage_clients");
    const { id } = await params;
    const clientId = parseInt(id);
    if (isNaN(clientId)) notFound();

    const client = await getClient(clientId);
    if (!client) notFound();

    // Convert all Decimal fields to numbers recursively
    const serialized = serializeDecimals(client);

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
    
    // Ensure lead has required nested structure
    if (safeSerialized.lead) {
      safeSerialized.lead = {
        id: safeSerialized.lead.id || 0,
        businessName: safeSerialized.lead.businessName || safeSerialized.businessName,
        phone: safeSerialized.lead.phone || "",
        email: safeSerialized.lead.email || null,
        city: safeSerialized.lead.city || "",
        state: safeSerialized.lead.state || "",
        zipCode: safeSerialized.lead.zipCode || "",
        website: safeSerialized.lead.website || null,
        domainRating: safeSerialized.lead.domainRating || null,
        reviewCount: safeSerialized.lead.reviewCount || null,
        reviewAvg: safeSerialized.lead.reviewAvg || null,
        competitiveIntel: safeSerialized.lead.competitiveIntel || null,
      };
    }

    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/clients" className="hover:text-foreground transition-colors">
            Clients
          </Link>
          <span>/</span>
          <span className="text-foreground">{safeSerialized.businessName}</span>
        </div>
        <ClientProfile client={safeSerialized} currentUserRole={(currentUser as any).role} />
      </div>
    );
  } catch (error) {
    console.error('Client detail page error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Client</h1>
        <p className="text-muted-foreground mb-4">
          Failed to load client details. Error: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
          {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
        </pre>
        <Link href="/clients" className="text-blue-600 hover:underline mt-4 block">
          ← Back to Clients
        </Link>
      </div>
    );
  }
}
