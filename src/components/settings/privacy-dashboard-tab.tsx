"use client";

/**
 * PrivacyDashboardTab — TRUST-001
 * Sprint COVOS-TRUST-01, March 2026
 *
 * Settings → Privacy & Data tab. Visible to admin and manager roles only.
 * Shows: Data Residency Summary, Feature Data Declaration Table,
 * AI Processing Log stub, and Tenant Data Controls stub.
 *
 * All data in this component is a static declaration — no live queries.
 * Exact residency figures vary by tenant config; displayed as approximations.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Server, Cloud, Globe, FileBarChart, Lock } from "lucide-react";

// ── Data Residency rows ───────────────────────────────────────────────────────

const RESIDENCY_ROWS = [
  {
    label: "Local processing (no external API)",
    percent: "~60%",
    color: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
    icon: Server,
    description: "Deterministic logic, rule evaluation, metric aggregation, report formatting — runs on COVOS server infrastructure only.",
  },
  {
    label: "Claude API (encrypted in transit, not used for training)",
    percent: "~30%",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
    icon: Cloud,
    description: "AI-generated content (blogs, meta, PPC copy, social posts, strategy, voice profiles) sent to Anthropic's Claude API.",
  },
  {
    label: "Third-party enrichment (Ahrefs, SerpAPI, Outscraper)",
    percent: "~10%",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dotColor: "bg-yellow-500",
    icon: Globe,
    description: "SEO metrics, rank data, and business profile enrichment via third-party intelligence APIs.",
  },
] as const;


// ── Feature Data Declaration table rows ──────────────────────────────────────

interface FeatureRow {
  feature: string;
  dataSent: string;
  destination: string;
  retention: string;
  notes: string;
}

const FEATURE_ROWS: FeatureRow[] = [
  {
    feature: "Blog Generation",
    dataSent: "Topic, client name, industry, tone",
    destination: "Claude API",
    retention: "Not retained",
    notes: "Voice profile applied if available",
  },
  {
    feature: "Meta Description",
    dataSent: "Page URL, target keyword",
    destination: "Claude API",
    retention: "Not retained",
    notes: "",
  },
  {
    feature: "PPC Ad Copy",
    dataSent: "Service, location, audience",
    destination: "Claude API",
    retention: "Not retained",
    notes: "",
  },
  {
    feature: "Social Posts",
    dataSent: "Topic, platform, voice profile",
    destination: "Claude API",
    retention: "Not retained",
    notes: "Voice profile is tenant-stored; only the text is sent",
  },
  {
    feature: "SEO Strategy",
    dataSent: "Client industry, competitors",
    destination: "Claude API",
    retention: "Not retained",
    notes: "",
  },
  {
    feature: "Voice Profile Capture",
    dataSent: "Website content (up to 8,000 chars)",
    destination: "Claude API",
    retention: "Stored as voice profile",
    notes: "Scraped from client-supplied URL; sanitized before transmission",
  },
  {
    feature: "PageSpeed Sensor",
    dataSent: "Domain URL",
    destination: "Google PSI API",
    retention: "Not retained",
    notes: "Public API; no auth credentials sent",
  },
  {
    feature: "Ahrefs Sensor",
    dataSent: "Domain",
    destination: "Ahrefs API",
    retention: "Not retained",
    notes: "API key per tenant; domain only, no client PII",
  },
  {
    feature: "SerpAPI Sensor",
    dataSent: "Keywords, location",
    destination: "SerpAPI",
    retention: "Not retained",
    notes: "",
  },
  {
    feature: "Outscraper Sensor",
    dataSent: "Business name, location",
    destination: "Outscraper API",
    retention: "Not retained",
    notes: "Used for GBP review and rating data",
  },
];


// ── Component ─────────────────────────────────────────────────────────────────

export function PrivacyDashboardTab() {
  // ── Section A: Data Residency Summary ──────────────────────────────────────
  const residencySummary = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4 text-muted-foreground" />
          Data Residency Summary
        </CardTitle>
        <CardDescription>
          Approximate breakdown of where AI and data operations are processed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {RESIDENCY_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex h-2 w-2 rounded-full flex-shrink-0 ${row.dotColor}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{row.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{row.description}</p>
                </div>
              </div>
              <Badge variant="outline" className={`ml-4 flex-shrink-0 font-semibold ${row.color}`}>
                {row.percent}
              </Badge>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-1">
          Data residency breakdown is approximate. Exact figures vary by tenant configuration and active features.
        </p>
      </CardContent>
    </Card>
  );

  // ── Section B: Feature Data Declaration Table ───────────────────────────────
  const featureTable = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileBarChart className="h-4 w-4 text-muted-foreground" />
          Feature Data Declaration
        </CardTitle>
        <CardDescription>
          Every AI-powered feature and exactly what data it sends, where, and for how long.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-b-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[160px]">Feature</TableHead>
                <TableHead>Data Sent</TableHead>
                <TableHead className="w-[140px]">Destination</TableHead>
                <TableHead className="w-[120px]">Retention</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURE_ROWS.map((row, i) => (
                <TableRow key={row.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <TableCell className="font-medium text-sm py-2.5">{row.feature}</TableCell>
                  <TableCell className="text-sm text-muted-foreground py-2.5">{row.dataSent}</TableCell>
                  <TableCell className="text-sm py-2.5">
                    <Badge
                      variant="outline"
                      className={
                        row.destination === "Claude API"
                          ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                          : row.destination === "Google PSI API"
                          ? "bg-green-50 text-green-700 border-green-200 text-xs"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                      }
                    >
                      {row.destination}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm py-2.5">
                    <span className={row.retention === "Not retained" ? "text-muted-foreground" : "text-amber-600 font-medium"}>
                      {row.retention}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-2.5">{row.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );


  // ── Section C: AI Processing Log stub ──────────────────────────────────────
  const exportSubject = encodeURIComponent("AI Processing Log Export Request");
  const exportBody = encodeURIComponent(
    "Hello,\n\nPlease send me a CSV export of all AI API calls for my tenant for the last 30 days.\n\nThank you."
  );
  const mailtoHref = `mailto:support@covos.app?subject=${exportSubject}&body=${exportBody}`;

  const processingLogStub = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          AI Processing Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Detailed per-call AI processing logs are available on request. Contact{" "}
          <a href="mailto:support@covos.app" className="underline underline-offset-2 text-foreground">
            support@covos.app
          </a>{" "}
          to receive a CSV export of all AI API calls for your tenant for any 30-day window.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href={mailtoHref}>
            Request Export
          </a>
        </Button>
      </CardContent>
    </Card>
  );

  // ── Section D: Tenant Controls stub ────────────────────────────────────────
  const controlsStub = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Data Controls
        </CardTitle>
        <CardDescription>
          Per-feature AI controls are available. Contact support to configure feature-level data processing settings for your tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">AI-assisted features</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contact support to disable specific features
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch checked={true} disabled aria-label="AI-assisted features toggle (managed)" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[220px]">
                Granular feature controls are available. Contact support@covos.app to disable specific AI-assisted features for your tenant.
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold leading-tight">Privacy &amp; Data</h2>
          <p className="text-sm text-muted-foreground">
            Full transparency on how COVOS processes your data — what goes where, why, and for how long.
          </p>
        </div>
      </div>
      {residencySummary}
      {featureTable}
      {processingLogStub}
      {controlsStub}
    </div>
  );
}
