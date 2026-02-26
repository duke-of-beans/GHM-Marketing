"use client";

/**
 * StudioClientPicker — shared client selector for studio landing pages.
 *
 * Behavior:
 * - On load, fetches the active client list
 * - If ?clientId is in the URL, pre-selects that client and loads the studio immediately
 * - Once a client is selected, renders the studio children
 * - "All Clients" breadcrumb returns to the picker view
 *
 * Props:
 *   studioName   — display name shown in picker heading
 *   studioIcon   — emoji/icon shown in heading
 *   renderStudio — render prop called with { id, businessName, industry } once selected
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudioClient = {
  id: number;
  businessName: string;
  industry?: string;
  healthScore?: number;
  city?: string;
  state?: string;
};

type Props = {
  studioName: string;
  studioIcon: string;
  renderStudio: (client: StudioClient) => React.ReactNode;
};

export function StudioClientPicker({ studioName, studioIcon, renderStudio }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [clients, setClients] = useState<StudioClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StudioClient | null>(null);

  useEffect(() => {
    fetch("/api/clients?status=active")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const list: StudioClient[] = json.data.clients.map((c: any) => ({
            id: c.id,
            businessName: c.businessName,
            industry: c.industry,
            healthScore: c.healthScore,
            city: c.city,
            state: c.state,
          }));
          setClients(list);

          const preselect = searchParams.get("clientId");
          if (preselect) {
            const match = list.find((c) => String(c.id) === preselect);
            if (match) setSelected(match);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectClient(client: StudioClient) {
    setSelected(client);
    const params = new URLSearchParams(searchParams.toString());
    params.set("clientId", String(client.id));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearClient() {
    setSelected(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("clientId");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    setSearch("");
  }

  // ── Studio view ──────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearClient}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            All Clients
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{selected.businessName}</span>
        </div>
        {renderStudio(selected)}
      </div>
    );
  }

  // ── Picker view ──────────────────────────────────────────────────────────
  const filtered = clients.filter((c) =>
    c.businessName.toLowerCase().includes(search.toLowerCase()) ||
    (c.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>{studioIcon}</span>
          {studioName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a client to open their {studioName} workspace.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            {search ? (
              <>
                <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-1" />
                <p className="text-base font-medium">No clients match &ldquo;{search}&rdquo;</p>
                <p className="text-sm text-muted-foreground">Try a different name, city, or industry.</p>
                <button
                  className="text-sm underline text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-1" />
                <p className="text-base font-medium">No active clients yet</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Clients are added when a lead is marked as <strong>Won</strong> in the Sales Pipeline.
                </p>
                <a href="/leads" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  Go to Sales Pipeline <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => selectClient(client)}
              className="text-left p-4 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
            >
              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                {client.businessName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {[client.city, client.state].filter(Boolean).join(", ")}
                {client.industry && <span className="ml-2 opacity-70">{client.industry}</span>}
              </p>
              {client.healthScore !== undefined && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        client.healthScore >= 70 ? "bg-status-success-bg" :
                        client.healthScore >= 40 ? "bg-status-warning-bg" : "bg-status-danger-bg"
                      )}
                      style={{ width: `${client.healthScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{client.healthScore}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
