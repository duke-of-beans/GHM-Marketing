"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Site = { id: number; domain: string };

const SOURCES = [
  { value: "shareasale", label: "ShareASale" },
  { value: "amazon", label: "Amazon Associates" },
  { value: "cj", label: "CJ Affiliate" },
  { value: "generic", label: "Generic CSV" },
];

export function RevenueImportTab() {
  const [sites, setSites] = useState<Site[]>([]);
  const [source, setSource] = useState("");
  const [siteId, setSiteId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/affiliate/sites")
      .then(r => r.json())
      .then(d => { if (d.success) setSites(d.data); })
      .catch(() => {});
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      setRowCount(Math.max(0, lines.length - 1));
      const previewLines = lines.slice(0, 6);
      setPreview(previewLines.map(l => l.split(",").map(c => c.replace(/^"|"$/g, "").trim())));
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file || !source || !siteId) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", source);
      formData.append("siteId", siteId);
      const res = await fetch("/api/affiliate/import", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setResult({ imported: data.imported, skipped: data.skipped, errors: data.errors ?? [] });
      } else {
        setResult({ imported: 0, skipped: 0, errors: [data.error ?? "Import failed"] });
      }
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: [String(err)] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5" /> Import Revenue Data
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload CSV exports from affiliate networks to populate revenue entries.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Site</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger><SelectValue placeholder="Select site..." /></SelectTrigger>
                <SelectContent>
                  {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.domain}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>CSV File</Label>
            <Input type="file" accept=".csv" onChange={handleFileChange} />
          </div>

          {preview.length > 0 && (
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview (first 5 rows)</CardTitle>
                <CardDescription className="text-xs">{rowCount} rows detected</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {preview[0]?.map((h, i) => <TableHead key={i} className="text-xs">{h}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.slice(1, 6).map((row, ri) => (
                        <TableRow key={ri}>
                          {row.map((cell, ci) => <TableCell key={ci} className="text-xs">{cell}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleImport} disabled={loading || !file || !source || !siteId}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : "Import"}
          </Button>

          {result && (
            <Card className={result.errors.length > 0 && result.imported === 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
              <CardContent className="pt-4 pb-4">
                {result.imported > 0 && (
                  <p className="flex items-center gap-2 text-sm font-medium text-green-800">
                    <CheckCircle2 className="h-4 w-4" /> Imported {result.imported} entries. Skipped {result.skipped} duplicates.
                  </p>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="flex items-center gap-2 text-sm text-red-800">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {err}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
