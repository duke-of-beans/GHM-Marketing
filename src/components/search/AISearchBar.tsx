"use client";

/**
 * AISearchBar — COVOS Intelligence Layer
 *
 * Global Cmd+K (Mac) / Ctrl+K (Win) search with two result phases:
 *   Phase 1 (200ms debounce): Fast local matches — client names, nav routes, leads
 *   Phase 2 (400ms debounce): AI semantic results — answers, cross-entity queries, actions
 *
 * Usage: mount once in DashboardLayoutClient. Accepts optional scopedClientId
 * for client-page context narrowing.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search, X, ArrowRight, Zap, LayoutDashboard,
  Users, Target, ClipboardList, FileText, DollarSign,
  BarChart2, Settings, FolderOpen, MessageSquare, TrendingUp,
  Loader2,
} from "lucide-react";
import { useModifierKey } from "@/hooks/use-modifier-key";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavResult {
  label: string;
  url: string;
  description: string;
  icon: string;
}

interface Answer {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low";
}

interface Action {
  label: string;
  actionKey: string;
  params: Record<string, unknown>;
  description: string;
}

interface SearchResults {
  navigational: NavResult[];
  answers: Answer[];
  actions: Action[];
  source: "local" | "ai" | "local_fallback" | "empty";
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard:    LayoutDashboard,
  leads:        Target,
  clients:      Users,
  tasks:        ClipboardList,
  content:      FileText,
  payments:     DollarSign,
  reports:      BarChart2,
  settings:     Settings,
  vault:        FolderOpen,
  team:         MessageSquare,
  clipboard:    ClipboardList,
  search:       Search,
  user:         Users,
  "trending-up": TrendingUp,
};

function ResultIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon] ?? Search;
  return <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  scopedClientId?: number;
  onAction?: (actionKey: string, params: Record<string, unknown>) => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AISearchBar({ scopedClientId, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { symbol: modSymbol } = useModifierKey();

  useEffect(() => { setMounted(true); }, []);

  // Global keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setSelectedIdx(0);
    }
  }, [open]);

  // ── Search logic ────────────────────────────────────────────────────────────

  const fetchLocal = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, scopedClientId, mode: "local" }),
      });
      const data = await res.json() as SearchResults;
      setResults(data);
      setSelectedIdx(0);
    } catch { /* silent */ }
  }, [scopedClientId]);

  const fetchAI = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setLoadingAI(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, scopedClientId, mode: "ai" }),
      });
      const data = await res.json() as SearchResults;
      setResults(data);
      setSelectedIdx(0);
    } catch { /* keep local results */ }
    finally { setLoadingAI(false); }
  }, [scopedClientId]);

  // Two-phase debounce: local at 200ms, AI at 500ms
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);

    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    if (q.length < 2) { setResults(null); setLoadingAI(false); return; }

    localTimerRef.current = setTimeout(() => fetchLocal(q), 200);
    aiTimerRef.current   = setTimeout(() => fetchAI(q), 500);
  }, [fetchLocal, fetchAI]);

  // ── Keyboard navigation ─────────────────────────────────────────────────────

  const allNavigational = results?.navigational ?? [];
  const totalItems = allNavigational.length;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, totalItems - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allNavigational[selectedIdx]) {
      router.push(allNavigational[selectedIdx].url);
      setOpen(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger — full-width inline bar, layout-aware */}
      <button
        onClick={() => setOpen(true)}
        className={`flex flex-1 items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-w-0 max-w-sm ${open ? "invisible" : ""}`}
        aria-label="Open search"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">Search</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground flex-shrink-0">
          {modSymbol}+K
        </kbd>
      </button>

      {/* Modal overlay — rendered via portal to escape overflow:hidden layout containers */}
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xl mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, leads, pages, or ask a question…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loadingAI && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />}
          {!loadingAI && query && (
            <button onClick={() => handleQueryChange("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="max-h-96 overflow-y-auto py-2">

            {/* Navigational results */}
            {allNavigational.length > 0 && (
              <div>
                <p className="px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {results.source === "ai" ? "Pages & Records" : "Quick Navigation"}
                </p>
                {allNavigational.map((r, i) => (
                  <button
                    key={r.url + r.label}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      i === selectedIdx ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
                    }`}
                    onClick={() => { router.push(r.url); setOpen(false); }}
                    onMouseEnter={() => setSelectedIdx(i)}
                  >
                    <ResultIcon icon={r.icon} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{r.label}</span>
                      <span className="ml-2 text-muted-foreground text-xs truncate">{r.description}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}

            {/* AI answers */}
            {results.answers && results.answers.length > 0 && (
              <div className="mt-2">
                <p className="px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> AI Answer
                </p>
                {results.answers.map((a, i) => (
                  <div key={i} className="px-4 py-2.5 text-sm border-t border-border/50">
                    <p className="text-muted-foreground text-xs mb-1">{a.question}</p>
                    <p className="text-foreground leading-relaxed">{a.answer}</p>
                    {a.confidence === "low" && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Low confidence — verify manually.</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {results.actions && results.actions.length > 0 && (
              <div className="mt-2">
                <p className="px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </p>
                {results.actions.map((a, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted/60 transition-colors"
                    onClick={() => { onAction?.(a.actionKey, a.params); setOpen(false); }}
                  >
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-medium">{a.label}</span>
                      <span className="ml-2 text-muted-foreground text-xs">{a.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty result state */}
            {allNavigational.length === 0 && (!results.answers || results.answers.length === 0) && query.length >= 2 && !loadingAI && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                Nothing matched. Either it doesn&apos;t exist or you spelled it wrong.
              </p>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
          <span>↑↓ navigate · Enter to open · Esc to close</span>
          {results?.source === "ai" && (
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> AI</span>
          )}
          {results?.source === "local_fallback" && <span>Local results only</span>}
        </div>
        </div>
      </div>,
      document.body
      )}
    </>
  );
}
