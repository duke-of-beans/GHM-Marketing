"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Upload, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Database, Users, FolderKanban, Loader2, RefreshCw, ExternalLink,
} from "lucide-react"
import { PM_PLATFORM_META, type PmPlatform } from "@/lib/pm-import/types"
import type { ImportedTask, ImportedContact, ImportedProject } from "@/lib/pm-import/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewData {
  tasks:    ImportedTask[]
  contacts: ImportedContact[]
  projects: ImportedProject[]
}

interface PreviewStats {
  taskCount:    number
  contactCount: number
  projectCount: number
  platform:     string
  scrapedAt:    string
}

type Step = "platform" | "connect" | "preview" | "commit" | "done"

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "platform", label: "Platform"  },
  { key: "connect",  label: "Connect"   },
  { key: "preview",  label: "Preview"   },
  { key: "commit",   label: "Import"    },
  { key: "done",     label: "Complete"  },
]

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.key === current)
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
            i < idx  ? "bg-green-500 text-white" :
            i === idx ? "bg-primary text-primary-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-sm hidden sm:inline ${i === idx ? "font-semibold" : "text-muted-foreground"}`}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DataImportTab() {
  const [step,       setStep]       = useState<Step>("platform")
  const [platform,   setPlatform]   = useState<PmPlatform | "">("")
  const [creds,      setCreds]      = useState<Record<string, string>>({})
  const [sessionId,  setSessionId]  = useState<number | null>(null)
  const [preview,    setPreview]    = useState<PreviewData | null>(null)
  const [stats,      setStats]      = useState<PreviewStats | null>(null)
  const [clientId,   setClientId]   = useState("")
  const [category,   setCategory]   = useState("")
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [loading,    setLoading]    = useState(false)
  const [commitResult, setCommitResult] = useState<{ tasksCreated: number; tasksSkipped: number } | null>(null)

  const meta = platform ? PM_PLATFORM_META[platform as PmPlatform] : null

  // ── Step 1: Platform select ────────────────────────────────────────────────

  const handlePlatformSelect = (p: PmPlatform) => {
    setPlatform(p)
    setCreds({})
    setStep("connect")
  }

  // ── Step 2: Connect (API key platforms) ───────────────────────────────────

  const handleConnect = async () => {
    if (!platform) return
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: creds }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Connection failed"); return }
      setSessionId(data.sessionId)
      toast.success("Connected successfully")
      setStep("preview")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3a: Scrape (API platforms) ───────────────────────────────────────

  const handleScrape = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Scrape failed"); return }
      setPreview(data.preview)
      setStats(data.stats)
      setSelected(new Set(data.preview.tasks.map((t: ImportedTask) => t.externalId)))
      toast.success(`Scraped ${data.stats.taskCount} tasks`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3b: CSV upload ────────────────────────────────────────────────────

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setLoading(true)
    try {
      // First create a session for CSV
      const connRes = await fetch("/api/import/pm/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "csv", credentials: {} }),
      })
      const connData = await connRes.json()
      if (!connRes.ok) { toast.error(connData.error ?? "Session creation failed"); return }
      const sid = connData.sessionId
      setSessionId(sid)

      // Then upload
      const form = new FormData()
      form.append("sessionId", String(sid))
      form.append("file", file)
      const res = await fetch("/api/import/pm/preview", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Parse failed"); return }
      setPreview(data.preview)
      setStats(data.stats)
      setSelected(new Set(data.preview.tasks.map((t: ImportedTask) => t.externalId)))
      toast.success(`Parsed ${data.stats.taskCount} tasks from ${file.name}`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false, disabled: loading,
  })

  // ── Step 4: Commit ─────────────────────────────────────────────────────────

  const handleCommit = async () => {
    if (!sessionId || !clientId) {
      toast.error("Select a client first")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          clientId:         parseInt(clientId),
          selectedTaskIds:  Array.from(selected),
          categoryOverride: category || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return }
      setCommitResult({ tasksCreated: data.tasksCreated, tasksSkipped: data.tasksSkipped })
      setStep("done")
      toast.success(`Imported ${data.tasksCreated} tasks`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep("platform"); setPlatform(""); setCreds({}); setSessionId(null)
    setPreview(null); setStats(null); setSelected(new Set()); setClientId("")
    setCategory(""); setCommitResult(null)
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" /> Data Migration Import
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect to your existing project management platform, scrape all data, and migrate it into GHM.
          Credentials are cleared after import completes.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Choose platform ── */}
      {step === "platform" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(PM_PLATFORM_META) as PmPlatform[]).map(p => {
            const m = PM_PLATFORM_META[p]
            return (
              <Card key={p} className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handlePlatformSelect(p)}>
                <CardContent className="pt-4 pb-4">
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{m.description.slice(0, 60)}…</div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {m.authType === "oauth" ? "OAuth" : m.authType === "file" ? "File Upload" : "API Key"}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Step 2: Connect ── */}
      {step === "connect" && meta && (
        <Card>
          <CardHeader>
            <CardTitle>Connect to {meta.label}</CardTitle>
            <CardDescription>{meta.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meta.authType === "oauth" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You connected Basecamp via OAuth in Settings → Integrations. Your token will be used automatically.
                </p>
                <Button onClick={async () => {
                  // Fetch stored OAuth token from existing oauth session
                  setLoading(true)
                  try {
                    const res = await fetch("/api/oauth/basecamp/token")
                    const data = await res.json()
                    if (!res.ok || !data.accessToken) {
                      toast.error("No Basecamp OAuth token found. Connect Basecamp in Integrations first.")
                      return
                    }
                    setCreds({ accessToken: data.accessToken, accountId: data.accountId, refreshToken: data.refreshToken ?? "" })
                    // Auto-advance to preview
                    const connRes = await fetch("/api/import/pm/connect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ platform: "basecamp", credentials: {
                        accessToken: data.accessToken, accountId: data.accountId, refreshToken: data.refreshToken,
                      }}),
                    })
                    const connData = await connRes.json()
                    if (!connRes.ok) { toast.error(connData.error); return }
                    setSessionId(connData.sessionId)
                    setStep("preview")
                  } catch (e) { toast.error(String(e)) }
                  finally { setLoading(false) }
                }} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Use Connected Basecamp Account
                </Button>
              </div>
            )}

            {meta.authType === "file" && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Drop your CSV or Excel export here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV and XLSX. Columns: Task, Status, Priority, Due Date, Assignee, Project.
                </p>
                {loading && <Loader2 className="h-5 w-5 mx-auto mt-3 animate-spin" />}
              </div>
            )}

            {meta.authType === "apikey" && (
              <div className="space-y-3">
                {meta.fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    <Input
                      type={f.type}
                      placeholder={f.label}
                      value={f.key === "extra" ? (creds["Token"] ?? "") : (creds[f.key] ?? "")}
                      onChange={e => {
                        if (f.key === "extra") setCreds(c => ({ ...c, Token: e.target.value }))
                        else setCreds(c => ({ ...c, [f.key]: e.target.value }))
                      }}
                    />
                  </div>
                ))}
                {meta.docsUrl && (
                  <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-primary flex items-center gap-1 hover:underline">
                    How to get your API token <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep("platform")}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleConnect} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Test & Connect <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          {!stats && (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">Ready to scrape all data from {meta?.label}.</p>
                <Button onClick={handleScrape} disabled={loading} size="lg">
                  {loading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scraping data…</>
                    : <><Database className="h-4 w-4 mr-2" /> Scrape & Preview</>
                  }
                </Button>
              </CardContent>
            </Card>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: FolderKanban, label: "Projects", count: stats.projectCount },
                  { icon: CheckCircle2, label: "Tasks",    count: stats.taskCount    },
                  { icon: Users,        label: "Contacts", count: stats.contactCount },
                ].map(({ icon: Icon, label, count }) => (
                  <Card key={label}>
                    <CardContent className="pt-4 pb-4 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-xl font-bold">{count}</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {preview && preview.tasks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Task Preview
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (showing first {preview.tasks.length} of {stats.taskCount})
                      </span>
                    </CardTitle>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <button className="hover:text-foreground" onClick={() =>
                        setSelected(new Set(preview.tasks.map(t => t.externalId)))}>
                        Select all
                      </button>
                      <span>·</span>
                      <button className="hover:text-foreground" onClick={() => setSelected(new Set())}>
                        Deselect all
                      </button>
                      <span>·</span>
                      <span>{selected.size} selected</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-72 overflow-y-auto rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assignee</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.tasks.map(t => (
                            <TableRow key={t.externalId}
                              className="cursor-pointer"
                              onClick={() => setSelected(prev => {
                                const next = new Set(prev)
                                if (next.has(t.externalId)) { next.delete(t.externalId) } else { next.add(t.externalId) }
                                return next
                              })}>
                              <TableCell>
                                <input type="checkbox" readOnly checked={selected.has(t.externalId)}
                                  className="cursor-pointer" />
                              </TableCell>
                              <TableCell className="max-w-48 truncate font-medium">{t.title}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{t.projectName ?? "—"}</TableCell>
                              <TableCell>
                                <Badge variant={t.status === "completed" ? "secondary" : "outline"} className="text-xs">
                                  {t.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{t.assigneeName ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("connect")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep("commit")} disabled={selected.size === 0}>
                  Configure Import <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 4: Commit config ── */}
      {step === "commit" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Import</CardTitle>
            <CardDescription>
              Importing {selected.size} tasks from {meta?.label ?? platform}.
              All tasks will be linked to the client you select.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Client ID <span className="text-destructive">*</span></Label>
              <Input
                type="number" placeholder="Enter client ID"
                value={clientId} onChange={e => setClientId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find the client ID in the URL when viewing a client, e.g. /clients/42
              </p>
            </div>
            <div className="space-y-1">
              <Label>Category override (optional)</Label>
              <Input
                placeholder="e.g. seo, content, technical — leave blank to keep original"
                value={category} onChange={e => setCategory(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("preview")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleCommit} disabled={loading || !clientId}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
                  : <><Database className="h-4 w-4 mr-2" /> Import {selected.size} Tasks</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 5: Done ── */}
      {step === "done" && commitResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <div className="text-lg font-semibold">Import Complete</div>
              <div className="text-sm text-muted-foreground mt-1">
                {commitResult.tasksCreated} tasks imported successfully.
                {commitResult.tasksSkipped > 0 && ` ${commitResult.tasksSkipped} skipped.`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Credentials have been cleared. You can safely disconnect your {meta?.label} account.
              </div>
            </div>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" /> Start Another Import
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
