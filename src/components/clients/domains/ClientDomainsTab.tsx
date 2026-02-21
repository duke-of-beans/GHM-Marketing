import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────

export type ClientDomain = {
  id: number;
  domain: string;
  type: string;
  hosting: string;
  ownershipType: string;
  dnsVerified: boolean;
  sslActive: boolean;
  contentCount: number;
  lastDeployedAt: string | null;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(d: string | null) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── Main export ─────────────────────────────────────────────────────────────

export function ClientDomainsTab({ domains }: { domains: ClientDomain[] }) {
  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No domains registered yet. Add the client&apos;s main site and any satellite domains
            during onboarding.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {domains.map((domain) => (
        <Card key={domain.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{domain.domain}</span>
                  <Badge variant="outline" className="text-[10px]">{domain.type}</Badge>
                  <Badge variant="outline" className="text-[10px]">{domain.hosting}</Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      domain.ownershipType === "ghm"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-50"
                    }`}
                  >
                    {domain.ownershipType === "ghm" ? "GHM Owned" : "Client Owned"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {domain.contentCount} pages ·{" "}
                  {domain.dnsVerified ? "✅ DNS" : "⏳ DNS pending"} ·{" "}
                  {domain.sslActive ? "✅ SSL" : "⏳ SSL pending"} ·{" "}
                  Last deployed: {timeAgo(domain.lastDeployedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
