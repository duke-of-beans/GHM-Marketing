"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Star, RefreshCw, Plus, ExternalLink, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Loader2, MapPin
} from "lucide-react"

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

// ─── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
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
          : <Badge variant="outline" className="shrink-0 text-xs text-amber-600 border-amber-300">Needs reply</Badge>
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

// ─── Create Post form ────────────────────────────────────────────────────────

function CreatePostModal({
  clientId,
  onCreated,
  onClose,
}: {
  clientId:  number
  onCreated: () => void
  onClose:   () => void
}) {
  const [summary,  setSummary]  = useState("")
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
  const [activeTab,   setActiveTab]   = useState<"reviews" | "insights" | "posts">("reviews")
  const [showPost,    setShowPost]    = useState(false)
  const [reviews,     setReviews]     = useState<GBPReview[]>([])

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
            className="text-red-500 hover:text-red-700"
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
          <div className={`text-xl font-bold ${needsReply.length > 0 ? "text-amber-500" : "text-green-600"}`}>
            {needsReply.length}
          </div>
          <div className="text-xs text-gray-500">Unanswered</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b gap-0">
        {(["reviews", "insights", "posts"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
            {t === "reviews" && needsReply.length > 0 && (
              <Badge className="ml-1.5 bg-amber-100 text-amber-700 border-amber-300 text-xs" variant="outline">
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
          <div className="flex justify-end">
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

      {showPost && (
        <CreatePostModal
          clientId={clientId}
          onCreated={load}
          onClose={() => setShowPost(false)}
        />
      )}
    </div>
  )
}
