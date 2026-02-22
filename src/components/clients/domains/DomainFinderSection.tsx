"use client";

/**
 * DomainFinderSection — FEAT-013
 * Keyword-driven domain discovery: GoDaddy suggestions + GHM parked domains.
 * Sits at the bottom of the ClientDomainsTab.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { DomainSuggestion, OwnedDomain } from "@/lib/enrichment/providers/godaddy/domains";

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  if (!cents) return "—";
  return "$" + (cents / 1_000_000).toFixed(2); // GoDaddy returns micros
}

function expiresLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0)   return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days < 30)  return `Expires in ${days}d`;
  if (days < 365) return `Expires in ${Math.floor(days / 30)}mo`;
  return `Expires ${d.toLocaleDateString("en-US", { year: "numeric", month: "short" })}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SuggestionRow({ s }: { s: DomainSuggestion }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${s.available ? "bg-green-500" : "bg-red-400"}`} />
        <span className="text-sm font-medium">{s.domain}</span>
      </div>
      <div className="flex items-center gap-3">
        {s.available ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]">Available</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-red-600">Taken</Badge>
        )}
        <span className="text-xs text-muted-foreground w-14 text-right">
          {s.available ? formatPrice(s.price) : ""}
        </span>
        {s.available && (
          <a
            href={`https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${s.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline hover:no-underline shrink-0"
          >
            Buy
          </a>
        )}
      </div>
    </div>
  );
}

function ParkedRow({ d }: { d: OwnedDomain }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <span className="text-sm font-medium">{d.domain}</span>
        <p className="text-xs text-muted-foreground">{expiresLabel(d.expires)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]">GHM Parked</Badge>
        {d.renewable && (
          <Badge variant="outline" className="text-[10px]">Renewable</Badge>
        )}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function DomainFinderSection({
  defaultQuery = "",
}: {
  defaultQuery?: string;
}) {
  const [query, setQuery]           = useState(defaultQuery);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<DomainSuggestion[] | null>(null);
  const [parked, setParked]           = useState<OwnedDomain[] | null>(null);

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setParked(data.parked ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const hasResults = suggestions !== null || parked !== null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Domain Finder</CardTitle>
        <p className="text-xs text-muted-foreground">
          Find available domains and GHM-owned parked domains for satellite use.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Search bar */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g. dallas plumber, roofing contractor TX..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(query)}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => search(query)}
            disabled={loading || !query.trim()}
          >
            <Search className="h-4 w-4 mr-1.5" />
            Search
          </Button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-md" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="space-y-5">

            {/* GHM Parked Domains — show first if any */}
            {parked && parked.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
                  GHM Parked Domains ({parked.length} match{parked.length !== 1 ? "es" : ""})
                </p>
                <div className="border rounded-md px-3">
                  {parked.map((d) => <ParkedRow key={d.domain} d={d} />)}
                </div>
              </div>
            )}

            {/* Available / Suggested */}
            {suggestions && (
              <div>
                {(() => {
                  const available = suggestions
                    .filter((s) => s.available)
                    .sort((a, b) => a.price - b.price)
                    .slice(0, 10);
                  const taken = suggestions.filter((s) => !s.available);
                  return (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Top Available Domains ({available.length})
                      </p>
                      {available.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No available domains found for these keywords.</p>
                      ) : (
                        <div className="border rounded-md px-3">
                          {available.map((s) => <SuggestionRow key={s.domain} s={s} />)}
                        </div>
                      )}
                      {taken.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            {taken.length} taken domain{taken.length !== 1 ? "s" : ""} (collapsed)
                          </summary>
                          <div className="border rounded-md px-3 mt-1.5 opacity-60">
                            {taken.map((s) => <SuggestionRow key={s.domain} s={s} />)}
                          </div>
                        </details>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Empty state after search */}
        {!loading && hasResults && suggestions?.length === 0 && parked?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No results found. Try different keywords.
          </p>
        )}

      </CardContent>
    </Card>
  );
}
