/**
 * ReactionBar — displays aggregated emoji reactions on a message.
 * Clicking a reaction toggles it for the current user.
 * Shows reactors on hover via tooltip.
 */

"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmojiPicker } from "./EmojiPicker";

export type ReactionData = {
  userId: number;
  emoji: string;
  user: { name: string };
};

function aggregateReactions(reactions: ReactionData[]) {
  const map = new Map<string, { count: number; users: string[] }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(r.user.name);
    } else {
      map.set(r.emoji, { count: 1, users: [r.user.name] });
    }
  }
  return Array.from(map.entries()).map(([emoji, { count, users }]) => ({ emoji, count, users }));
}

export function ReactionBar({
  messageId,
  reactions,
  currentUserId,
  onUpdate,
}: {
  messageId: number;
  reactions: ReactionData[];
  currentUserId: number;
  onUpdate: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);

  async function toggleReaction(emoji: string) {
    if (pending) return;
    setPending(emoji);
    try {
      await fetch(`/api/team-messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      onUpdate();
    } catch {
      // silent
    } finally {
      setPending(null);
    }
  }

  const aggregated = aggregateReactions(reactions);
  const myEmojis = new Set(
    reactions.filter((r) => r.userId === currentUserId).map((r) => r.emoji)
  );

  return (
    <div className="flex items-center flex-wrap gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
      <TooltipProvider>
        {aggregated.map(({ emoji, count, users }) => (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => toggleReaction(emoji)}
                disabled={pending === emoji}
                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
                  myEmojis.has(emoji)
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${pending === emoji ? "opacity-60" : ""}`}
              >
                <span>{emoji}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{users.join(", ")}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      {/* Add reaction button */}
      <EmojiPicker onSelect={toggleReaction} />
    </div>
  );
}
