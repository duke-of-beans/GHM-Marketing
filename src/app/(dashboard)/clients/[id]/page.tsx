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
  const client = await getClient(parseInt(id));

  if (!client) notFound();

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clients" className="hover:text-foreground transition-colors">
          Clients
        </Link>
        <span>/</span>
        <span className="text-foreground">{client.businessName}</span>
      </div>
      <ClientProfile client={JSON.parse(JSON.stringify(client))} />
    </div>
  );
}
