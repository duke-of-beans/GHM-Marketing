"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Globe, Plus, Search, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddSiteDialog } from "./add-site-dialog";
import { useRouter } from "next/navigation";

type SiteItem = {
  id: number;
  domain: string;
  displayName: string | null;
  niche: string | null;
  category: string | null;
  status: string;
  monthlyRevenueCurrent: number | null;
  monthlyTrafficCurrent: number | null;
  domainAuthority: number | null;
  monetizationMix: string | null;
};
const STATUS_VARIANT: Record<string, StatusVariant> = {
  ACTIVE: "success",
  BUILDING: "info",
  MONETIZING: "success",
  PARKED: "neutral",
  FOR_SALE: "warning",
  SOLD: "neutral",
  ARCHIVED: "neutral",
};

function formatCurrency(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export function SitePortfolio({ sites }: { sites: SiteItem[] }) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter(
      (s) =>
        s.domain.toLowerCase().includes(q) ||
        s.niche?.toLowerCase().includes(q) ||
        s.displayName?.toLowerCase().includes(q)
    );
  }, [sites, search]);
  if (sites.length === 0) {
    return (
      <>
        <EmptyState
          icon={Globe}
          title="No sites yet"
          description="Add your first affiliate property to get started."
          action={{ label: "Add Site", onClick: () => setAddOpen(true) }}
        />
        <AddSiteDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => router.refresh()} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Site
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Domain</th>
                  <th className="text-left p-3 font-medium">Niche</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Monthly Revenue</th>
                  <th className="text-right p-3 font-medium">Monthly Traffic</th>
                  <th className="text-right p-3 font-medium">DA</th>
                  <th className="text-left p-3 font-medium">Monetization</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((site) => (
                  <tr key={site.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Link href={`/sites/${site.id}`} className="text-primary hover:underline font-medium">
                        {site.domain}
                      </Link>
                      {site.displayName && (
                        <span className="text-muted-foreground text-xs ml-2">{site.displayName}</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{site.niche ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge variant={STATUS_VARIANT[site.status] ?? "neutral"} dot>
                        {site.status.replace(/_/g, " ")}
                      </StatusBadge>
                    </td>
                    <td className="p-3 text-right font-mono">{formatCurrency(site.monthlyRevenueCurrent)}</td>
                    <td className="p-3 text-right font-mono">{formatNumber(site.monthlyTrafficCurrent)}</td>
                    <td className="p-3 text-right font-mono">{site.domainAuthority ?? "—"}</td>
                    <td className="p-3 text-muted-foreground capitalize">{site.monetizationMix ?? "—"}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                          <Link href={`/sites/${site.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                          <Link href={`/sites/${site.id}?tab=overview`}><Pencil className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddSiteDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => router.refresh()} />
    </div>
  );
}