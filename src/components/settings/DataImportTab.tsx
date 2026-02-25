"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  AlertTriangle, ChevronDown, ChevronRight, UserX,
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

interface ValidationResult {
  canProceed: boolean
  summary: {
    totalSelected:      number
    errorCount:         number
    warningCount:       number
    duplicateCount:     number
    assigneeMismatches: number
  }
  taskIssues: {
    externalId: string
    title:      string
    severity:   "error" | "warning"
    issues:     string[]
  }[]
  assigneeMismatches: { name: string; email?: string }[]
  duplicates: { externalId: string | null; title: string; id: number }[]
}

interface CommitResult {
  tasksCreated:      number
  tasksUpdated:      number
  tasksSkipped:      number
  duplicateStrategy: string
  errors:            { externalId: string; title: string; error: string }[]
  platform:          string
  committedAt:       string
}

type Step = "platform" | "connect" | "preview" | "validate" | "commit" | "done"

type CsvColumn = "title" | "status" | "priority" | "dueDate" | "assigneeName" |
                 "assigneeEmail" | "projectName" | "description" | "(skip)"
const CSV_COLUMNS: CsvColumn[] = [
  "title","status","priority","dueDate","assigneeName","assigneeEmail","projectName","description","(skip)",
]

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "platform", label: "Platform"  },
  { key: "connect",  label: "Connect"   },
  { key: "preview",  label: "Preview"   },
  { key: "validate", label: "Validate"  },
  { key: "commit",   label: "Import"    },
  { key: "done",     label: "Complete"  },
]

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.key === current)
  return (
    <div className="flex items-center gap-1 mb-6 flex-wrap">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
            i < idx  ? "bg-green-500 text-white" :
            i === idx ? "bg-primary text-primary-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-sm hidden sm:inline ${i === idx ? "font-semibold" : "text-muted-foreground"}`}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DataImportTab() {
  const [step,         setStep]         = useState<Step>("platform")
  const [platform,     setPlatform]     = useState<PmPlatform | "">("")
  const [creds,        setCreds]        = useState<Record<string, string>>({})
  const [sessionId,    setSessionId]    = useState<number | null>(null)
  const [preview,      setPreview]      = useState<PreviewData | null>(null)
  const [stats,        setStats]        = useState<PreviewStats | null>(null)
  const [clientId,     setClientId]     = useState("")
  const [category,     setCategory]     = useState("")
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [loading,      setLoading]      = useState(false)
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null)
  const [validation,   setValidation]   = useState<ValidationResult | null>(null)
  const [dupStrategy,  setDupStrategy]  = useState<"skip" | "overwrite">("skip")
  const [rolling,      setRolling]      = useState(false)
  const [issuesOpen,   setIssuesOpen]   = useState(false)
  const [errorsOpen,   setErrorsOpen]   = useState(false)
  const [csvHeaders,   setCsvHeaders]   = useState<string[]>([])
  const [csvColumnMap, setCsvColumnMap] = useState<Record<string, CsvColumn>>({})
  const [showMapper,   setShowMapper]   = useState(false)

  const meta = platform ? PM_PLATFORM_META[platform as PmPlatform] : null

  // ── Platform select ────────────────────────────────────────────────────────
  const handlePlatformSelect = (p: PmPlatform) => { setPlatform(p); setCreds({}); setStep("connect") }

  // ── Connect (API key) ──────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!platform) return
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: creds }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Connection failed"); return }
      setSessionId(data.sessionId); toast.success("Connected"); setStep("preview")
    } catch (e) { toast.error(String(e)) }
    finally { setLoading(false) }
  }

  // ── Scrape (API platforms) ─────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Scrape failed"); return }
      setPreview(data.preview); setStats(data.stats)
      setSelected(new Set(data.preview.tasks.map((t: ImportedTask) => t.externalId)))
      toast.success(`Scraped ${data.stats.taskCount} tasks`)
    } catch (e) { toast.error(String(e)) }
    finally { setLoading(false) }
  }

  // ── CSV upload + column sniffing ──────────────────────────────────────────
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]; if (!file) return
    setLoading(true)
    try {
      if (file.name.endsWith(".csv")) {
        const text = await file.text()
        const headers = text.split("\n")[0].split(",").map(h => h.replace(/["']/g, "").trim())
        if (headers.length > 0) {
          setCsvHeaders(headers)
          const autoMap: Record<string, CsvColumn> = {}
          headers.forEach(h => {
            const l = h.toLowerCase()
            if (l.includes("title") || l.includes("task") || (l.includes("name") && !l.includes("assign"))) autoMap[h] = "title"
            else if (l.includes("status"))                        autoMap[h] = "status"
            else if (l.includes("priority"))                      autoMap[h] = "priority"
            else if (l.includes("due") || l.includes("deadline")) autoMap[h] = "dueDate"
            else if (l.includes("email"))                         autoMap[h] = "assigneeEmail"
            else if (l.includes("assign") || l.includes("owner")) autoMap[h] = "assigneeName"
            else if (l.includes("project") || l.includes("list")) autoMap[h] = "projectName"
            else if (l.includes("desc") || l.includes("note"))    autoMap[h] = "description"
            else                                                   autoMap[h] = "(skip)"
          })
          setCsvColumnMap(autoMap); setShowMapper(true)
        }
      }
      const connRes = await fetch("/api/import/pm/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "csv", credentials: {} }),
      })
      const connData = await connRes.json()
      if (!connRes.ok) { toast.error(connData.error ?? "Session failed"); return }
      const sid = connData.sessionId; setSessionId(sid)
      const form = new FormData()
      form.append("sessionId", String(sid)); form.append("file", file)
      const res = await fetch("/api/import/pm/preview", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Parse failed"); return }
      setPreview(data.preview); setStats(data.stats)
      setSelected(new Set(data.preview.tasks.map((t: ImportedTask) => t.externalId)))
      toast.success(`Parsed ${data.stats.taskCount} tasks`)
    } catch (e) { toast.error(String(e)) }
    finally { setLoading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false, disabled: loading,
  })

  // ── Validate ───────────────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!sessionId || !clientId) { toast.error("Enter a client ID first"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, clientId: parseInt(clientId), selectedTaskIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Validation failed"); return }
      setValidation(data); setStep("validate")
    } catch (e) { toast.error(String(e)) }
    finally { setLoading(false) }
  }

  // ── Commit ─────────────────────────────────────────────────────────────────
  const handleCommit = async () => {
    if (!sessionId || !clientId) { toast.error("Select a client first"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/import/pm/commit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, clientId: parseInt(clientId),
          selectedTaskIds: Array.from(selected),
          categoryOverride: category || undefined,
          duplicateStrategy: dupStrategy,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return }
      setCommitResult(data); setStep("done")
      toast.success(`Imported ${data.tasksCreated} tasks`)
    } catch (e) { toast.error(String(e)) }
    finally { setLoading(false) }
  }

  // ── Rollback ───────────────────────────────────────────────────────────────
  const handleRollback = async () => {
    if (!sessionId) return
    if (!confirm("This will permanently delete all tasks from this import. Continue?")) return
    setRolling(true)
    try {
      const res = await fetch("/api/import/pm/rollback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Rollback failed"); return }
      toast.success(`Rolled back — ${data.tasksDeleted} tasks deleted`)
      handleReset()
    } catch (e) { toast.error(String(e)) }
    finally { setRolling(false) }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep("platform"); setPlatform(""); setCreds({}); setSessionId(null)
    setPreview(null); setStats(null); setSelected(new Set()); setClientId("")
    setCategory(""); setCommitResult(null); setValidation(null)
    setCsvHeaders([]); setCsvColumnMap({}); setShowMapper(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" /> Data Migration Import
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Migrate tasks from your existing project management tool. Imports can be rolled back within 24 hours.
        </p>
      </div>
      <StepIndicator current={step} />

      {/* ── Step 1: Platform ── */}
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
                <p className="text-sm text-muted-foreground">Uses your OAuth token from Settings → Integrations.</p>
                <Button onClick={async () => {
                  setLoading(true)
                  try {
                    const r = await fetch("/api/oauth/basecamp/token"); const d = await r.json()
                    if (!r.ok || !d.accessToken) { toast.error("No Basecamp token. Connect in Integrations first."); return }
                    const c = await fetch("/api/import/pm/connect", {
                      method:"POST", headers:{"Content-Type":"application/json"},
                      body: JSON.stringify({ platform:"basecamp", credentials:{ accessToken:d.accessToken, accountId:d.accountId, refreshToken:d.refreshToken } }),
                    }); const cd = await c.json()
                    if (!c.ok) { toast.error(cd.error); return }
                    setSessionId(cd.sessionId); setStep("preview")
                  } catch(e) { toast.error(String(e)) } finally { setLoading(false) }
                }} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Use Connected Basecamp Account
                </Button>
              </div>
            )}
            {meta.authType === "file" && (
              <>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}>
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop CSV or Excel export here</p>
                  <p className="text-xs text-muted-foreground mt-1">Columns are auto-detected and mappable.</p>
                  {loading && <Loader2 className="h-5 w-5 mx-auto mt-3 animate-spin" />}
                </div>
                {showMapper && csvHeaders.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Column Mapping</CardTitle>
                      <CardDescription className="text-xs">Review auto-detected mappings. Adjust any that are wrong.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {csvHeaders.map(h => (
                          <div key={h} className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded w-36 truncate">{h}</span>
                            <span className="text-muted-foreground text-xs">→</span>
                            <Select value={csvColumnMap[h] ?? "(skip)"}
                              onValueChange={v => setCsvColumnMap(prev => ({ ...prev, [h]: v as CsvColumn }))}>
                              <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                              <SelectContent>{CSV_COLUMNS.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {meta.authType === "apikey" && (
              <div className="space-y-3">
                {meta.fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    <Input type={f.type} placeholder={f.label}
                      value={f.key === "extra" ? (creds["Token"] ?? "") : (creds[f.key] ?? "")}
                      onChange={e => setCreds(c => ({ ...c, [f.key === "extra" ? "Token" : f.key]: e.target.value }))} />
                  </div>
                ))}
                {meta.docsUrl && <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">API token docs <ExternalLink className="h-3 w-3" /></a>}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep("platform")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button onClick={handleConnect} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
            <Card><CardContent className="pt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">Ready to scrape from {meta?.label}.</p>
              <Button onClick={handleScrape} disabled={loading} size="lg">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scraping…</> : <><Database className="h-4 w-4 mr-2" />Scrape & Preview</>}
              </Button>
            </CardContent></Card>
          )}
          {stats && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[{icon:FolderKanban,label:"Projects",count:stats.projectCount},{icon:CheckCircle2,label:"Tasks",count:stats.taskCount},{icon:Users,label:"Contacts",count:stats.contactCount}]
                  .map(({ icon: Icon, label, count }) => (
                    <Card key={label}><CardContent className="pt-4 pb-4 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div><div className="text-xl font-bold">{count}</div><div className="text-xs text-muted-foreground">{label}</div></div>
                    </CardContent></Card>
                  ))}
              </div>
              {preview && preview.tasks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Task Preview <span className="text-sm font-normal text-muted-foreground ml-2">(first {preview.tasks.length} of {stats.taskCount})</span></CardTitle>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <button className="hover:text-foreground" onClick={() => setSelected(new Set(preview.tasks.map(t => t.externalId)))}>Select all</button>
                      <span>·</span>
                      <button className="hover:text-foreground" onClick={() => setSelected(new Set())}>Deselect all</button>
                      <span>·</span>
                      <span>{selected.size} selected</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-72 overflow-y-auto rounded border">
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-8"/><TableHead>Title</TableHead><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Assignee</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {preview.tasks.map(t => (
                            <TableRow key={t.externalId} className="cursor-pointer"
                              onClick={() => setSelected(prev => { const n=new Set(prev); n.has(t.externalId)?n.delete(t.externalId):n.add(t.externalId); return n })}>
                              <TableCell><input type="checkbox" readOnly checked={selected.has(t.externalId)} className="cursor-pointer" /></TableCell>
                              <TableCell className="max-w-48 truncate font-medium">{t.title}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{t.projectName ?? "—"}</TableCell>
                              <TableCell><Badge variant={t.status==="completed"?"secondary":"outline"} className="text-xs">{t.status}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{t.assigneeName ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Client ID input required before validate */}
              <div className="space-y-1">
                <Label>Client ID <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="Enter client ID (from /clients/42)" value={clientId} onChange={e => setClientId(e.target.value)} className="max-w-xs" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("connect")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
                <Button onClick={handleValidate} disabled={loading || selected.size === 0 || !clientId}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Validating…</> : <>Validate {selected.size} Tasks <ArrowRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step validate: Validation report ── */}
      {step === "validate" && validation && (
        <div className="space-y-4">
          {/* Summary banner */}
          <Card className={validation.canProceed ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                {validation.canProceed
                  ? <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                  : <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />}
                <div>
                  <p className="font-semibold text-sm">{validation.canProceed ? "Validation passed — ready to import" : "Validation failed — resolve errors before importing"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {validation.summary.totalSelected} tasks selected ·{" "}
                    {validation.summary.errorCount > 0 && <span className="text-red-600">{validation.summary.errorCount} errors · </span>}
                    {validation.summary.warningCount > 0 && <span className="text-amber-600">{validation.summary.warningCount} warnings · </span>}
                    {validation.summary.duplicateCount > 0 && <span className="text-blue-600">{validation.summary.duplicateCount} duplicates · </span>}
                    {validation.summary.assigneeMismatches > 0 && <span className="text-orange-600">{validation.summary.assigneeMismatches} unmatched assignees</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignee mismatch report */}
          {validation.assigneeMismatches.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/40 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><UserX className="h-4 w-4 text-orange-500" />Unmatched Assignees ({validation.assigneeMismatches.length})</CardTitle>
                <CardDescription className="text-xs">These assignees were not found in your user list. Affected tasks will be imported as unassigned.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {validation.assigneeMismatches.map((a, i) => (
                    <div key={i} className="text-xs flex gap-2 items-center">
                      <span className="font-medium">{a.name}</span>
                      {a.email && <span className="text-muted-foreground">{a.email}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-task issues */}
          {validation.taskIssues.length > 0 && (
            <Card>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setIssuesOpen(o => !o)}>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Task Issues ({validation.taskIssues.length})
                  {issuesOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
                </CardTitle>
              </CardHeader>
              {issuesOpen && (
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validation.taskIssues.map(issue => (
                      <div key={issue.externalId} className={`rounded-lg border p-3 text-xs ${issue.severity === "error" ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"}`}>
                        <p className="font-medium truncate">{issue.title}</p>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {issue.issues.map((iss, j) => <li key={j}>• {iss}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("preview")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
            <Button onClick={() => setStep("commit")} disabled={!validation.canProceed}>
              Configure Import <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step commit: Configure ── */}
      {step === "commit" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Import</CardTitle>
            <CardDescription>Importing {selected.size} tasks from {meta?.label ?? platform}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Category override <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="e.g. seo, content — leave blank to keep original" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            {validation && validation.summary.duplicateCount > 0 && (
              <div className="space-y-1">
                <Label>Duplicate handling</Label>
                <p className="text-xs text-muted-foreground">{validation.summary.duplicateCount} tasks already exist for this client.</p>
                <div className="flex gap-2">
                  {(["skip","overwrite"] as const).map(s => (
                    <button key={s} onClick={() => setDupStrategy(s)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors capitalize ${dupStrategy === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground"}`}>
                      {s === "skip" ? "Skip duplicates" : "Overwrite duplicates"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("validate")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
              <Button onClick={handleCommit} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing…</> : <><Database className="h-4 w-4 mr-2" />Import {selected.size} Tasks</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step done: Results ── */}
      {step === "done" && commitResult && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <div className="text-lg font-semibold">Import Complete</div>
              <div className="text-sm text-muted-foreground mt-1">
                {commitResult.tasksCreated} tasks imported.
                {commitResult.tasksUpdated > 0 && ` ${commitResult.tasksUpdated} updated.`}
                {commitResult.tasksSkipped > 0 && ` ${commitResult.tasksSkipped} skipped.`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Credentials cleared. You can safely disconnect your {meta?.label} account.
              </div>
            </div>

            {/* Collapsible error log */}
            {commitResult.errors.length > 0 && (
              <div className="w-full text-left">
                <button onClick={() => setErrorsOpen(o => !o)}
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:underline">
                  {errorsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {commitResult.errors.length} task{commitResult.errors.length > 1 ? "s" : ""} had errors
                </button>
                {errorsOpen && (
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {commitResult.errors.map((e, i) => (
                      <div key={i} className="rounded border border-red-200 bg-red-50/50 dark:bg-red-950/20 px-3 py-2 text-xs">
                        <p className="font-medium truncate">{e.title}</p>
                        <p className="text-muted-foreground mt-0.5">{e.error}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}><RefreshCw className="h-4 w-4 mr-2" />New Import</Button>
              <Button variant="ghost" onClick={handleRollback} disabled={rolling}
                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                {rolling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                Undo Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
