/**
 * GifPicker — inline GIF search powered by Tenor (server-proxied).
 * Opens in a popover below the trigger. Shows trending on open,
 * updates with search results as user types.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type GifResult = {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  title: string;
};

export function GifPicker({
  onSelect,
  trigger,
}: {
  onSelect: (gif: GifResult) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const fetchGifs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/gifs?q=${encodeURIComponent(q)}&limit=20` : "/api/gifs?limit=20";
      const res = await fetch(url);
      const data = await res.json();
      setGifs(data.gifs ?? []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending on open
  useEffect(() => {
    if (open && gifs.length === 0) fetchGifs("");
  }, [open, fetchGifs, gifs.length]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open, fetchGifs]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        {trigger}
      </div>

      {open && (
        <div
          className="absolute z-50 bottom-full mb-1 left-0 bg-popover border rounded-xl shadow-lg w-72 flex flex-col overflow-hidden"
          style={{ maxHeight: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search bar */}
          <div className="p-2 border-b flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GIFs…"
              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results grid */}
          <div className="overflow-y-auto p-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : gifs.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                {query ? "No GIFs found" : "Loading trending…"}
              </p>
            ) : (
              <div className="columns-3 gap-1">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => { onSelect(gif); setOpen(false); }}
                    className="block w-full mb-1 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    title={gif.title}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gif.previewUrl}
                      alt={gif.title}
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Powered by Tenor */}
          <div className="text-[9px] text-muted-foreground text-center py-1 border-t">
            Powered by Tenor
          </div>
        </div>
      )}
    </div>
  );
}
