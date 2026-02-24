/**
 * EmojiPicker — lightweight inline emoji picker (no heavy dependency)
 * Uses a curated set of common reaction emoji in a popover grid.
 * Full emoji-mart is overkill for reactions; this covers 99% of use.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const REACTION_EMOJI = [
  "👍", "❤️", "😂", "😮", "😢", "🎉",
  "🔥", "👏", "🙏", "💯", "✅", "🚀",
  "💪", "😍", "🤔", "👀", "😅", "🥳",
  "💀", "😤", "🤝", "⭐", "🎯", "💡",
];

export function EmojiPicker({
  onSelect,
  triggerClassName,
}: {
  onSelect: (emoji: string) => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`text-muted-foreground hover:text-foreground transition-colors ${triggerClassName ?? ""}`}
        title="Add reaction"
      >
        <Smile className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute z-50 bottom-full mb-1 left-0 bg-popover border rounded-xl shadow-lg p-2 grid grid-cols-6 gap-0.5 w-52"
          onClick={(e) => e.stopPropagation()}
        >
          {REACTION_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onSelect(emoji); setOpen(false); }}
              className="text-lg p-1 rounded-lg hover:bg-muted transition-colors leading-none"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
