"use client";

/**
 * useKeyboardShortcuts — Global keyboard shortcut registration
 *
 * Listens for keydown events and fires registered callbacks.
 * Automatically ignores shortcuts when focus is inside an input, textarea, or select.
 *
 * Usage:
 *   useKeyboardShortcuts([
 *     { key: "n", label: "New lead", onTrigger: () => router.push("/leads/new") },
 *     { key: "f", label: "Focus filter", onTrigger: () => filterRef.current?.focus() },
 *   ]);
 */

import { useEffect } from "react";

export type ShortcutDefinition = {
  /** Single character key (case-insensitive) or special keys: "Escape", "Enter", "?" */
  key: string;
  /** Require Ctrl/Cmd modifier */
  withMod?: boolean;
  /** Human-readable description for the help overlay */
  label: string;
  /** Called when shortcut fires */
  onTrigger: () => void;
};

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingContext(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  return (
    INPUT_TAGS.has(target.tagName) ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input field
      if (isTypingContext(e)) return;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const modMatch = shortcut.withMod
          ? e.metaKey || e.ctrlKey
          : !e.metaKey && !e.ctrlKey && !e.altKey;

        if (keyMatch && modMatch) {
          e.preventDefault();
          shortcut.onTrigger();
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
