"use client";

import { useModifierKey } from "@/hooks/use-modifier-key";

type ShortcutGroup = {
  group: string;
  shortcuts: { keys: string[]; description: string }[];
};

function buildShortcuts(mod: string): ShortcutGroup[] {
  return [
    {
      group: "Global",
      shortcuts: [
        { keys: [`${mod}K`], description: "Open search" },
        { keys: ["?", "/"], description: "Show this help" },
        { keys: ["Esc"], description: "Close overlay / cancel" },
      ],
    },
    {
      group: "Navigation (G + key)",
      shortcuts: [
        { keys: ["G", "D"], description: "Go to Dashboard" },
        { keys: ["G", "L"], description: "Go to Leads (Pipeline)" },
        { keys: ["G", "C"], description: "Go to Clients" },
        { keys: ["G", "T"], description: "Go to Tasks" },
        { keys: ["G", "R"], description: "Go to Reports" },
        { keys: ["G", "P"], description: "Go to Payments" },
        { keys: ["G", "S"], description: "Go to Settings" },
      ],
    },
    {
      group: "Leads Page",
      shortcuts: [
        { keys: ["F"], description: "Focus filter / search bar" },
        { keys: ["Esc"], description: "Clear active filters" },
      ],
    },
  ];
}

function Kbd({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground min-w-[1.6rem]">
      {label}
    </kbd>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: Props) {
  const { symbol: mod } = useModifierKey();

  if (!open) return null;

  const groups = buildShortcuts(mod);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Press <Kbd label="?" /> or <Kbd label="/" /> to toggle this panel
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {groups.map((group) => (
            <div key={group.group}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <div className="space-y-1.5">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">{s.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {s.keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          {ki > 0 && (
                            <span className="text-muted-foreground text-xs">then</span>
                          )}
                          <Kbd label={k} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          Shortcuts are disabled while typing in inputs · <Kbd label="Esc" /> to close
        </div>
      </div>
    </div>
  );
}
