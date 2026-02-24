"use client";

import { useEffect, useState } from "react";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { X, Keyboard } from "lucide-react";
import { createPortal } from "react-dom";

type ShortcutGroup = {
  label: string;
  shortcuts: { key: string; withMod?: boolean; description: string }[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Global",
    shortcuts: [
      { key: "K", withMod: true, description: "Open search" },
      { key: "?", description: "Show keyboard shortcuts" },
    ],
  },
  {
    label: "Navigation",
    shortcuts: [
      { key: "G then D", description: "Go to Dashboard" },
      { key: "G then L", description: "Go to Leads / Pipeline" },
      { key: "G then C", description: "Go to Clients" },
      { key: "G then T", description: "Go to Tasks" },
      { key: "G then S", description: "Go to Settings" },
    ],
  },
  {
    label: "Lists & Filters",
    shortcuts: [
      { key: "F", description: "Focus search/filter bar" },
      { key: "Escape", description: "Clear filter / close panel" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const { symbol: modSymbol } = useModifierKey();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.description}</span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted text-xs font-mono">
                      {s.withMod && <span>{modSymbol}</span>}
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded border border-border bg-background font-mono">?</kbd> anywhere (outside inputs) to toggle this panel
        </div>
      </div>
    </div>,
    document.body
  );
}
