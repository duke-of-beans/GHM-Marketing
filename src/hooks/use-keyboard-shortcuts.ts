/**
 * useKeyboardShortcuts
 *
 * Registers a map of key → handler pairs as a global keydown listener.
 * Automatically skips when focus is inside inputs, textareas, or contentEditable.
 * Modifier-key combos (Ctrl/Cmd/Alt) are ignored — handled by individual features.
 *
 * Usage:
 *   useKeyboardShortcuts({
 *     "?": () => setHelpOpen(true),
 *     Escape: () => setHelpOpen(false),
 *   });
 */

import { useEffect, useRef } from "react";

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingContext(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement;
  return INPUT_TAGS.has(t.tagName) || t.isContentEditable;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: { ignoreModifiers?: boolean; allowInInputs?: boolean } = {}
) {
  const { ignoreModifiers = true, allowInInputs = false } = options;
  // Keep a stable ref so callers don't have to memoize the map
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!allowInInputs && isTypingContext(e)) return;
      if (ignoreModifiers && (e.metaKey || e.ctrlKey || e.altKey)) return;

      const cb = ref.current[e.key] ?? ref.current[e.key.toLowerCase()];
      if (cb) cb(e);
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allowInInputs, ignoreModifiers]);
}
