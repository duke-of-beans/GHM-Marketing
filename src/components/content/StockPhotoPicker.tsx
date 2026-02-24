"use client";

/**
 * StockPhotoPicker — FEAT-023
 * Search Unsplash/Pexels, select a photo, copy URL or insert into content.
 * Handles Unsplash attribution requirements automatically.
 *
 * Usage:
 *   <StockPhotoPicker onSelect={(photo) => insertUrl(photo.regularUrl)} />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ExternalLink, Copy, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface StockPhoto {
  id: string;
  source: "unsplash" | "pexels";
  thumbUrl: string;
  regularUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  description: string | null;
  photographer: string;
  photographerUrl: string;
  photoPageUrl: string;
}

interface StockPhotoPickerProps {
  onSelect: (photo: StockPhoto) => void;
  trigger?: React.ReactNode;
  initialQuery?: string;
  inline?: boolean; // render without dialog wrapper
}

export function StockPhotoPicker({ onSelect, trigger, initialQuery = "", inline = false }: StockPhotoPickerProps) {
  const [open, setOpen] = useState(inline ? true : false);
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [noKeys, setNoKeys] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) { setPhotos([]); setTotal(0); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-photos?q=${encodeURIComponent(q)}&page=${p}&per_page=20`);
      const data = await res.json();
      if (data.message) { setNoKeys(true); setPhotos([]); return; }
      setPhotos(p === 1 ? data.photos : (prev: StockPhoto[]) => [...prev, ...data.photos]);
      setTotal(data.total ?? 0);
      setNoKeys(false);
    } catch {
      toast.error("Photo search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (!open) return;
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query, 1), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open, search]);

  // Load initial query when opened
  useEffect(() => {
    if (open && initialQuery && photos.length === 0) search(initialQuery, 1);
  }, [open, initialQuery, search, photos.length]);

  async function copyUrl(photo: StockPhoto) {
    await navigator.clipboard.writeText(photo.regularUrl);
    setCopiedId(photo.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSelect(photo: StockPhoto) {
    onSelect(photo);
    if (!inline) setOpen(false);
    toast.success("Photo selected");
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    search(query, next);
  }

  const hasMore = photos.length < total;

  const photoBody = (
    <>
      {/* Search bar */}
      <div className={inline ? "mb-3" : "px-4 pt-3 pb-2"}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus={!inline}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search photos (e.g. 'restaurant marketing', 'SEO growth')…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setPhotos([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className={inline ? "" : "flex-1 overflow-y-auto px-4 pb-4 min-h-0"}>
        {noKeys && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <ImageIcon className="h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium">No photo API keys configured</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Add <code className="bg-muted px-1 py-0.5 rounded text-[11px]">UNSPLASH_ACCESS_KEY</code> or{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PEXELS_API_KEY</code> to your environment to enable stock photos.
            </p>
          </div>
        )}
        {!noKeys && !query && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Search className="h-8 w-8 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Type a search term to find photos</p>
          </div>
        )}
        {!noKeys && query && loading && photos.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!noKeys && query && !loading && photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-sm text-muted-foreground">No photos found for "{query}"</p>
          </div>
        )}
        {photos.length > 0 && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              {total.toLocaleString()} results for "{query}"
            </div>
            <div className="columns-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="mb-3 group relative rounded-lg overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl}
                    alt={photo.description ?? photo.photographer}
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => copyUrl(photo)}
                        title="Copy URL"
                        className="h-7 w-7 rounded-md bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        {copiedId === photo.id
                          ? <Check className="h-3.5 w-3.5 text-green-500" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={photo.photoPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View original"
                        className="h-7 w-7 rounded-md bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => handleSelect(photo)}
                      >
                        Use Photo
                      </Button>
                      <p className="text-[10px] text-white/80 mt-1 text-center truncate">
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photo.photographer}
                        </a>
                        {" · "}
                        <Badge variant="secondary" className="text-[9px] py-0 px-1">
                          {photo.source === "unsplash" ? "Unsplash" : "Pexels"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Load more
                </Button>
              </div>
            )}
            {photos[0]?.source === "unsplash" && (
              <p className="text-[10px] text-muted-foreground text-center mt-4">
                Photos from{" "}
                <a href="https://unsplash.com?utm_source=ghm_dashboard&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline">
                  Unsplash
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </>
  );

  if (inline) {
    return <div className="space-y-2">{photoBody}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <ImageIcon className="h-4 w-4" />
            Stock Photos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Stock Photos
            <span className="text-xs font-normal text-muted-foreground">Unsplash · Pexels</span>
          </DialogTitle>
        </DialogHeader>
        {photoBody}
      </DialogContent>
    </Dialog>
  );
}
