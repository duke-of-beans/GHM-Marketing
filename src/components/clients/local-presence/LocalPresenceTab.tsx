"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Star, RefreshCw, Plus, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Loader2, MapPin,
  TrendingUp, TrendingDown, Minus as MinusIcon, Sparkles
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────────────

interface GBPReview {
  reviewId:   string
  reviewer:   string
  rating:     number
  comment:    string
  replyText:  string | null
  createTime: string
  updateTime: string
}

interface DailyInsight {
  date:               string
  impressionsDesktop: number
  impressionsMobile:  number
  websiteClicks:      number
  callClicks:         number
  directionRequests:  number
}

interface GBPPost {
  name:       string
  summary:    string
  topicType:  string
  state:      string
  createTime: string
}

interface GBPData {
  connected:    boolean
  locationName?: string
  googleEmail?:  string
  lastSyncAt?:   string
  reviews?:      GBPReview[]
  insights?:     { daily: DailyInsight[]; keywords: { keyword: string; monthlyImpressions: number }[] }
  posts?:        GBPPost[]
}

interface GbpSnapshot {
  id:                 number
  searchViews:        number | null
  mapViews:           number | null
  websiteClicks:      number | null
  phoneClicks:        number | null
  directionClicks:    number | null
  reviewCount:        number | null
  reviewAvg:          number | null
  newReviews:         number | null
  postsCount:         number | null
  previousSearchViews: number | null
  periodStart:        string
  periodEnd:          string
  scanDate:           string
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "fill-yellow-400 text-status-warning" : "text-gray-200"}
        />
      ))}
    </span>
  )
}

function ReviewCard({
  review,
  clientId,
  onReplied,
}: {
  review:    GBPReview
  clientId:  number
  onReplied: (reviewId: string, text: string) => void
}) {
  const [open,    setOpen]    = useState(false)
  const [draft,   setDraft]   = useState(review.replyText ?? "")
  const [saving,  setSaving]  = useState(false)

  const handleReply = async () => {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/clients/${clientId}/gbp/reviews/${review.reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: draft }),
      })
      onReplied(review.reviewId, draft)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-2 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{review.reviewer}</span>
            <StarRating rating={review.rating} />
          </div>
          <p className="text-sm text-gray-700">{review.comment || <span className="italic text-gray-400">No comment</span>}</p>
          <span className="text-xs text-gray-400">{new Date(review.createTime).toLocaleDateString()}</span>
        </div>
        {review.replyText
          ? <Badge variant="secondary" className="shrink-0 text-xs">Replied</Badge>
          : <Badge variant="outline" className="shrink-0 text-xs text-status-warning border-status-warning-border">Needs reply</Badge>
        }
      </div>

      {review.replyText && !open && (
        <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
          <span className="font-medium">Your reply: </span>{review.replyText}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {review.replyText ? "Edit reply" : "Write reply"}
      </button>

      {open && (
        <div className="space-y-2 pt-1">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Write a professional reply…"
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReply} disabled={saving}>
              {saving && <Loader2 size={12} className="animate-spin mr-1" />}
              {review.replyText ? "Update reply" : "Post reply"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Insights summary ───────────────────────────────────────────────────────

function InsightKPIs({ daily }: { daily: DailyInsight[] }) {
  const total = (key: keyof DailyInsight) =>
    daily.reduce((sum, d) => sum + (Number(d[key]) || 0), 0)

  const kpis = [
    { label: "Impressions",      value: total("impressionsDesktop") + total("impressionsMobile") },
    { label: "Website Clicks",   value: total("websiteClicks") },
    { label: "Call Clicks",      value: total("callClicks") },
    { label: "Direction Reqs",   value: total("directionRequests") },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="border rounded-lg p-3 bg-white text-center">
          <div className="text-xl font-bold">{k.value.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{k.label}</div>
          <div className="text-xs text-gray-400">Last 90 days</div>
        </div>
      ))}
    </div>
  )
}

// ─── Snapshot trend charts ───────────────────────────────────────────────────

function TrendArrow({ delta }: { delta: number | null }) {
  if (delta === null) return <MinusIcon size={12} className="text-gray-400 inline" />
  if (delta > 0) return <TrendingUp size={12} className="text-status-success inline mr-0.5" />
  if (delta < 0) return <TrendingDown size={12} className="text-status-danger inline mr-0.5" />
  return <MinusIcon size={12} className="text-gray-400 inline" />
}

function SnapshotTrends({ clientId }: { clientId: number }) {
  const [snapshots, setSnapshots] = useState<GbpSnapshot[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/gbp/snapshots?limit=12`)
      .then(r => r.json())
      .then(d => setSnapshots(d.data?.snapshots ?? []))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <div className="text-xs text-gray-400 py-4">Loading history…</div>
  if (snapshots.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-center text-sm text-gray-400">
        No snapshot history yet — data will appear after the first weekly cron run.
      </div>
    )
  }

  // Chart data — oldest first
  const chartData = [...snapshots].reverse().map(s => ({
    date:         new Date(s.scanDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views:        (s.searchViews ?? 0) + (s.mapViews ?? 0),
    clicks:       (s.websiteClicks ?? 0) + (s.phoneClicks ?? 0) + (s.directionClicks ?? 0),
    reviewAvg:    s.reviewAvg ?? 0,
  }))

  const latest = snapshots[0]
  const viewsDelta = latest.previousSearchViews != null && latest.searchViews != null
    ? latest.searchViews - latest.previousSearchViews
    : null

  const kpis = [
    { label: "Search Views",  value: latest.searchViews?.toLocaleString() ?? "—", delta: viewsDelta },
    { label: "Website Clicks", value: latest.websiteClicks?.toLocaleString() ?? "—", delta: null },
    { label: "Phone Clicks",  value: latest.phoneClicks?.toLocaleString() ?? "—", delta: null },
    { label: "Directions",    value: latest.directionClicks?.toLocaleString() ?? "—", delta: null },
    { label: "Review Avg",    value: latest.reviewAvg != null ? latest.reviewAvg.toFixed(1) : "—", delta: null },
    { label: "New Reviews",   value: latest.newReviews?.toLocaleString() ?? "—", delta: null },
  ]

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Last snapshot: {new Date(latest.scanDate).toLocaleDateString()} · 30-day rolling window
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {kpis.map(k => (
          <div key={k.label} className="border rounded-lg p-2 bg-white text-center">
            <div className="text-lg font-bold leading-tight">{k.value}</div>
            <div className="text-xs text-gray-500">{k.label}</div>
            {k.delta !== null && (
              <div className={`text-xs mt-0.5 flex items-center justify-center gap-0.5 ${k.delta > 0 ? "text-status-success" : k.delta < 0 ? "text-status-danger" : "text-gray-400"}`}>
                <TrendArrow delta={k.delta} />
                {k.delta > 0 ? `+${k.delta}` : k.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs font-medium text-gray-600 mb-3">Views + Clicks over time</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={35} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="views"  stroke="#3b82f6" strokeWidth={2} dot={false} name="Views" />
              <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} name="Clicks" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── AI Draft Post modal ─────────────────────────────────────────────────────

function AIDraftModal({
  clientId,
  onUse,
  onClose,
}: {
  clientId: number
  onUse:    (draft: string) => void
  onClose:  () => void
}) {
  const [topic,     setTopic]     = useState("")
  const [postType,  setPostType]  = useState<"update" | "offer" | "event">("update")
  const [draft,     setDraft]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    setError("")
    setDraft("")
    try {
      const res  = await fetch(`/api/clients/${clientId}/gbp/draft-post`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic, postType }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || "Draft failed"); return }
      setDraft(data.data.draft)
    } catch {
      setError("Network error — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-500" />
          <h3 className="font-semibold text-lg">AI Post Draft</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Post type</label>
            <Select value={postType} onValueChange={v => setPostType(v as typeof postType)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Business Update</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Topic (optional)</label>
            <input
              className="w-full border rounded px-3 py-1.5 text-sm"
              placeholder="e.g. spring tune-ups"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading
            ? <><Loader2 size={14} className="animate-spin mr-1" /> Generating…</>
            : <><Sparkles size={14} className="mr-1" /> Generate Draft</>
          }
        </Button>

        {error && <p className="text-sm text-status-danger">{error}</p>}

        {draft && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 block">Draft — edit before using</label>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-gray-400">{draft.length} characters</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onUse(draft)} className="flex-1">Use this draft</Button>
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>Regenerate</Button>
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={onClose} className="w-full">Cancel</Button>
      </div>
    </div>
  )
}

// ─── Create Post form ────────────────────────────────────────────────────────

function CreatePostModal({
  clientId,
  initialContent = "",
  onCreated,
  onClose,
}: {
  clientId:       number
  initialContent?: string
  onCreated:      () => void
  onClose:        () => void
}) {
  const [summary,  setSummary]  = useState(initialContent)
  const [saving,   setSaving]   = useState(false)

  const handleSubmit = async () => {
    if (!summary.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/clients/${clientId}/gbp/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, topicType: "STANDARD" }),
      })
      onCreated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg space-y-4">
        <h3 className="font-semibold text-lg">New GBP Post</h3>
        <Textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="What's new? Share an update about your business…"
          rows={5}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin mr-1" />}
            Publish Post
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function LocalPresenceTab({ clientId }: { clientId: number }) {
  const [data,        setData]        = useState<GBPData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState<"reviews" | "insights" | "posts" | "history">("reviews")
  const [showPost,    setShowPost]    = useState(false)
  const [showAIDraft, setShowAIDraft] = useState(false)
  const [reviews,     setReviews]     = useState<GBPReview[]>([])
  const [postDraft,   setPostDraft]   = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/gbp`)
      const json: GBPData = await res.json()
      setData(json)
      setReviews(json.reviews ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [clientId])

  const handleReplied = (reviewId: string, text: string) => {
    setReviews(rs => rs.map(r => r.reviewId === reviewId ? { ...r, replyText: text } : r))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 className="animate-spin" size={18} />
        Loading Google Business Profile…
      </div>
    )
  }

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!data?.connected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <MapPin size={40} className="text-gray-300" />
        <div>
          <p className="font-medium text-gray-700 mb-1">Connect Google Business Profile</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Connect this client's GBP account to manage reviews, track local search performance, and publish posts.
          </p>
        </div>
        <Button onClick={() => window.location.href = `/api/oauth/google/connect/${clientId}`}>
          Connect Google Account
        </Button>
      </div>
    )
  }

  const needsReply = reviews.filter(r => !r.replyText)
  const avgRating  = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{data.locationName}</p>
          <p className="text-xs text-gray-400">{data.googleEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {data.lastSyncAt ? `Synced ${new Date(data.lastSyncAt).toLocaleString()}` : "Never synced"}
          </span>
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw size={13} className="mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-status-danger hover:text-status-danger"
            onClick={async () => {
              await fetch(`/api/clients/${clientId}/gbp`, { method: "DELETE" })
              load()
            }}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-lg p-3 bg-white text-center">
          <div className="text-xl font-bold">{avgRating}</div>
          <div className="text-xs text-gray-500">Avg. Rating</div>
        </div>
        <div className="border rounded-lg p-3 bg-white text-center">
          <div className="text-xl font-bold">{reviews.length}</div>
          <div className="text-xs text-gray-500">Total Reviews</div>
        </div>
        <div className="border rounded-lg p-3 bg-white text-center">
          <div className={`text-xl font-bold ${needsReply.length > 0 ? "text-status-warning" : "text-status-success"}`}>
            {needsReply.length}
          </div>
          <div className="text-xs text-gray-500">Unanswered</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b gap-0">
        {(["reviews", "insights", "posts", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "history" ? "Trends" : t}
            {t === "reviews" && needsReply.length > 0 && (
              <Badge className="ml-1.5 bg-status-warning-bg text-status-warning border-status-warning-border text-xs" variant="outline">
                {needsReply.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {activeTab === "reviews" && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {reviews.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No reviews found.</p>
            : reviews.map(r => (
                <ReviewCard
                  key={r.reviewId}
                  review={r}
                  clientId={clientId}
                  onReplied={handleReplied}
                />
              ))
          }
        </div>
      )}

      {/* Insights */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          {data.insights?.daily?.length
            ? <InsightKPIs daily={data.insights.daily} />
            : <p className="text-sm text-gray-400">No insights data available.</p>
          }
          {data.insights?.keywords?.length ? (
            <div>
              <p className="text-sm font-medium mb-2">Top Search Keywords</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-2">Keyword</th>
                      <th className="text-right px-4 py-2">Monthly Impressions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.insights.keywords.slice(0, 15).map((k, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{k.keyword}</td>
                        <td className="px-4 py-2 text-right">{k.monthlyImpressions.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Posts */}
      {activeTab === "posts" && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAIDraft(true)}>
              <Sparkles size={13} className="mr-1 text-violet-500" /> AI Draft
            </Button>
            <Button size="sm" onClick={() => setShowPost(true)}>
              <Plus size={13} className="mr-1" /> New Post
            </Button>
          </div>
          {(data.posts ?? []).length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No posts yet.</p>
            : (data.posts ?? []).map(p => (
                <div key={p.name} className="border rounded-lg p-4 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs capitalize">{p.topicType.toLowerCase()}</Badge>
                    <span className="text-xs text-gray-400">{new Date(p.createTime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm">{p.summary}</p>
                </div>
              ))
          }
        </div>
      )}

      {/* Trends / Snapshot history */}
      {activeTab === "history" && (
        <SnapshotTrends clientId={clientId} />
      )}

      {showPost && (
        <CreatePostModal
          clientId={clientId}
          initialContent={postDraft}
          onCreated={() => { load(); setPostDraft("") }}
          onClose={() => { setShowPost(false); setPostDraft("") }}
        />
      )}

      {showAIDraft && (
        <AIDraftModal
          clientId={clientId}
          onUse={draft => {
            setPostDraft(draft)
            setShowAIDraft(false)
            setShowPost(true)
          }}
          onClose={() => setShowAIDraft(false)}
        />
      )}
    </div>
  )
}
