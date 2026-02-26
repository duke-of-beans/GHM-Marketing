"use client";

/**
 * TeamFeed multimedia components — FEAT-022
 * EmojiPickerButton, GifPicker, ReactionRow
 * These are imported into both TeamFeed.tsx and TeamFeedSidebar.tsx
 */

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmilePlus, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Dynamically import emoji-mart to avoid SSR issues.
// We pass `data` explicitly to prevent emoji-mart from fetching from CDN at runtime,
// which is unreliable in production edge environments.
const EmojiPicker = dynamic(
  () => import("@emoji-mart/react").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-80 w-72 bg-muted animate-pulse rounded-lg" /> }
);
import emojiData from "@emoji-mart/data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Reaction {
  emoji: string;
  userId: number;
}

interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
  dims: [number, number];
}

// ─── Emoji Picker Button ──────────────────────────────────────────────────────

export function EmojiPickerButton({
  onPick,
  size = "sm",
}: {
  onPick: (emoji: string) => void;
  size?: "sm" | "xs";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={size === "xs" ? "h-6 w-6" : "h-8 w-8"}
          title="Add emoji"
        >
          <SmilePlus className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-0 shadow-lg w-auto z-[200]" align="start" side="top" sideOffset={8}>
        <EmojiPicker
          data={emojiData}
          onEmojiSelect={(em: { native: string }) => {
            onPick(em.native);
            setOpen(false);
          }}
          theme="auto"
          previewPosition="none"
          skinTonePosition="none"
          maxFrequentRows={2}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── GIF Picker ───────────────────────────────────────────────────────────────

export function GifPickerButton({
  onPick,
}: {
  onPick: (gif: { url: string; title: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/gif-search?q=${encodeURIComponent(q)}&limit=16`);
      if (!res.ok) {
        console.error("[GifPicker] API error:", res.status, res.statusText);
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      console.error("[GifPicker] Fetch failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Add GIF">
          <span className="text-[10px] font-bold tracking-tight">GIF</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 z-[200]" align="start" side="top" sideOffset={8}>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <Input
            autoFocus
            placeholder="Search GIFs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 text-xs"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
          {loading && <div className="col-span-2 text-center py-6 text-xs text-muted-foreground">Searching…</div>}
          {!loading && results.length === 0 && query && (
            <div className="col-span-2 text-center py-6 text-xs text-muted-foreground">No results</div>
          )}
          {!loading && results.length === 0 && !query && (
            <div className="col-span-2 text-center py-6 text-xs text-muted-foreground">Type to search GIFs</div>
          )}
          {results.map((gif) => (
            <button
              key={gif.id}
              onClick={() => { onPick({ url: gif.url, title: gif.title }); setOpen(false); setQuery(""); setResults([]); }}
              className="rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              title={gif.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gif.preview} alt={gif.title} className="w-full h-20 object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-right">Powered by Tenor</p>
      </PopoverContent>
    </Popover>
  );
}

// ─── Reaction Row ─────────────────────────────────────────────────────────────

export function ReactionRow({
  messageId,
  reactions,
  currentUserId,
  onUpdate,
}: {
  messageId: number;
  reactions: Reaction[];
  currentUserId: number;
  onUpdate: () => void;
}) {
  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; isMine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, isMine: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].isMine = true;
    return acc;
  }, {});

  async function toggle(emoji: string) {
    try {
      const res = await fetch(`/api/team-messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
      onUpdate();
    } catch {
      toast.error("Couldn't update reaction");
    }
  }

  const entries = Object.entries(grouped);
  if (entries.length === 0) return (
    <div className="mt-1.5">
      <EmojiPickerButton onPick={(emoji) => toggle(emoji)} size="xs" />
    </div>
  );

  return (
    <div className="flex items-center flex-wrap gap-1 mt-1.5">
      {entries.map(([emoji, { count, isMine }]) => (
        <TooltipProvider key={emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); toggle(emoji); }}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                  isMine
                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                    : "bg-muted/50 border-muted-foreground/20 hover:bg-muted"
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{isMine ? "Click to remove" : "Click to react"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      <EmojiPickerButton onPick={(emoji) => toggle(emoji)} size="xs" />
    </div>
  );
}

// ─── Inline Image/GIF renderer ────────────────────────────────────────────────

export function InlineMedia({
  url,
  name,
  mimeType,
}: {
  url: string;
  name?: string | null;
  mimeType?: string | null;
}) {
  const isImage = mimeType?.startsWith("image/") || /\.(gif|png|jpg|jpeg|webp)(\?|$)/i.test(url);
  if (!isImage) return null;
  return (
    <div className="mt-2 max-w-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name ?? "image"}
        className="rounded-lg max-h-64 w-auto object-contain border"
        loading="lazy"
      />
    </div>
  );
}
