"use client";

/**
 * MasterDashboardGrid — react-grid-layout v2
 * Drag + resize, per-user layout persisted to DB.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import React from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Default layouts ──────────────────────────────────────────────────────────

export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "metrics",       x: 0,  y: 0,  w: 12, h: 3,  minW: 6, minH: 3, maxH: 3 },
    { i: "quick-actions", x: 0,  y: 3,  w: 4,  h: 7,  minW: 3, minH: 5 },
    { i: "revenue",       x: 4,  y: 3,  w: 4,  h: 7,  minW: 3, minH: 5 },
    { i: "goals",         x: 8,  y: 3,  w: 4,  h: 7,  minW: 3, minH: 5 },
    { i: "pipeline",      x: 0,  y: 10, w: 6,  h: 10, minW: 3, minH: 7 },
    { i: "leaderboard",   x: 6,  y: 10, w: 6,  h: 10, minW: 3, minH: 7 },
    { i: "my-tasks",      x: 0,  y: 20, w: 6,  h: 9,  minW: 3, minH: 6 },
    { i: "mgmt-fees",     x: 6,  y: 20, w: 6,  h: 9,  minW: 4, minH: 7 },
    { i: "profitability", x: 0,  y: 29, w: 12, h: 9,  minW: 4, minH: 7 },
  ],
  md: [
    { i: "metrics",       x: 0, y: 0,  w: 10, h: 3,  minW: 6, minH: 3, maxH: 3 },
    { i: "quick-actions", x: 0, y: 3,  w: 4,  h: 7,  minW: 3, minH: 5 },
    { i: "revenue",       x: 4, y: 3,  w: 3,  h: 7,  minW: 3, minH: 5 },
    { i: "goals",         x: 7, y: 3,  w: 3,  h: 7,  minW: 3, minH: 5 },
    { i: "pipeline",      x: 0, y: 10, w: 5,  h: 10, minW: 3, minH: 7 },
    { i: "leaderboard",   x: 5, y: 10, w: 5,  h: 10, minW: 3, minH: 7 },
    { i: "my-tasks",      x: 0, y: 20, w: 5,  h: 9,  minW: 3, minH: 6 },
    { i: "mgmt-fees",     x: 5, y: 20, w: 5,  h: 9,  minW: 3, minH: 7 },
    { i: "profitability", x: 0, y: 29, w: 10, h: 9,  minW: 4, minH: 7 },
  ],
  sm: [
    { i: "metrics",       x: 0, y: 0,  w: 6, h: 5,  minH: 4 },
    { i: "quick-actions", x: 0, y: 5,  w: 3, h: 7,  minH: 5 },
    { i: "revenue",       x: 3, y: 5,  w: 3, h: 7,  minH: 5 },
    { i: "goals",         x: 0, y: 12, w: 6, h: 7,  minH: 5 },
    { i: "pipeline",      x: 0, y: 19, w: 6, h: 9,  minH: 7 },
    { i: "leaderboard",   x: 0, y: 28, w: 6, h: 9,  minH: 7 },
    { i: "my-tasks",      x: 0, y: 37, w: 6, h: 9,  minH: 6 },
    { i: "mgmt-fees",     x: 0, y: 46, w: 6, h: 9,  minH: 7 },
    { i: "profitability", x: 0, y: 55, w: 6, h: 9,  minH: 7 },
  ],
  xs: [
    { i: "metrics",       x: 0, y: 0,  w: 4, h: 6 },
    { i: "quick-actions", x: 0, y: 6,  w: 4, h: 7 },
    { i: "revenue",       x: 0, y: 13, w: 4, h: 7 },
    { i: "goals",         x: 0, y: 20, w: 4, h: 7 },
    { i: "pipeline",      x: 0, y: 27, w: 4, h: 9 },
    { i: "leaderboard",   x: 0, y: 36, w: 4, h: 9 },
    { i: "my-tasks",      x: 0, y: 45, w: 4, h: 9 },
    { i: "mgmt-fees",     x: 0, y: 54, w: 4, h: 9 },
    { i: "profitability", x: 0, y: 63, w: 4, h: 9 },
  ],
};

// ─── localStorage key ─────────────────────────────────────────────────────────

const LS_KEY = "ghm:dashboard-layout";

function readLocalLayout(): ResponsiveLayouts | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ResponsiveLayouts) : null;
  } catch { return null; }
}

function writeLocalLayout(layouts: ResponsiveLayouts) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(layouts)); } catch { /* quota exceeded — silent */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterDashboardGrid({
  children,
  showProfitability,
  savedLayout,
}: {
  children: Record<string, React.ReactNode>;
  showProfitability: boolean;
  savedLayout: ResponsiveLayouts | null;
}) {
  // Prefer localStorage (same-session state) → DB-fetched → default
  // This prevents layout loss when React re-mounts the component (e.g. theme switch)
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(
    () => readLocalLayout() ?? savedLayout ?? DEFAULT_LAYOUTS
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const { width, containerRef } = useContainerWidth();

  // Suppress grid render until after hydration to prevent layout flash on navigation return
  useEffect(() => { setMounted(true); }, []);

  // If no localStorage layout exists yet and the DB returned a layout, seed localStorage.
  // This handles first-load on a fresh browser without wiping a local session layout.
  useEffect(() => {
    if (!readLocalLayout() && savedLayout) {
      writeLocalLayout(savedLayout);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistLayout = useCallback((newLayouts: ResponsiveLayouts) => {
    // Write to localStorage immediately — this is what prevents layout loss on re-mount
    writeLocalLayout(newLayouts);
    // Debounce DB write (non-critical, cross-device sync)
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await fetch("/api/dashboard-layout", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: newLayouts }),
        });
      } catch { /* silent — non-critical */ }
    }, 1500);
  }, []);

  function handleLayoutChange(_layout: Layout, allLayouts: ResponsiveLayouts) {
    setLayouts(allLayouts);
    persistLayout(allLayouts);
  }

  async function resetLayout() {
    setLayouts(DEFAULT_LAYOUTS);
    writeLocalLayout(DEFAULT_LAYOUTS);
    await fetch("/api/dashboard-layout", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: DEFAULT_LAYOUTS }),
    });
  }

  const widgetIds = Object.keys(children).filter(
    (id) => id !== "profitability" || showProfitability
  );

  return (
    <div>
      {/* Toolbar */}
      <TooltipProvider>
        <div className="flex items-center justify-end gap-3 mb-2">
          {isEditMode && (
            <button
              onClick={resetLayout}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Reset to default
            </button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`text-xs px-3 py-1 rounded-md border transition-colors ${
                  isEditMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {isEditMode ? "✓ Done arranging" : "⊹ Arrange widgets"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium mb-1">Customize your dashboard layout</p>
              <p className="text-muted-foreground text-xs">Drag widgets by the handle at the top to reorder. Resize using the handle in the bottom-right corner. Your layout saves automatically.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div ref={containerRef as React.RefObject<HTMLDivElement>}>
        {!mounted ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Loading dashboard...
          </div>
        ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          width={width}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={36}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          dragConfig={{
            enabled: isEditMode,
            handle: ".drag-handle",
          }}
          resizeConfig={{
            enabled: isEditMode,
            handles: ["se"],
          }}
          autoSize
        >
        {widgetIds.map((id) => (
          <div key={id} className="relative overflow-hidden">
            {/* Drag handle — only shown in edit mode */}
            {isEditMode && (
              <div className="drag-handle absolute inset-x-0 top-0 h-7 z-20 bg-primary/10 hover:bg-primary/20 cursor-grab active:cursor-grabbing rounded-t-lg flex items-center justify-center gap-0.5 select-none">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-0.5 h-3 bg-primary/50 rounded-full" />
                ))}
              </div>
            )}
            <div className={`h-full overflow-auto ${isEditMode ? "pt-7" : ""}`}>
              {children[id]}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
        )}
      </div>

      <style jsx global>{`
        .layout .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.15) !important;
          border-radius: 8px;
          border: 2px dashed hsl(var(--primary) / 0.5);
          opacity: 1 !important;
        }
        /* Edit mode outline */
        .layout .react-grid-item[style*="z-index: 3"],
        .react-grid-item:has(.drag-handle) {
          outline: 2px dashed hsl(var(--primary) / 0.25);
          outline-offset: -2px;
          border-radius: 8px;
        }
        .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.15s;
        }
        .react-grid-item:has(.drag-handle) .react-resizable-handle {
          opacity: 1;
        }
        .react-resizable-handle::after {
          border-color: hsl(var(--primary)) !important;
          width: 8px !important;
          height: 8px !important;
        }
      `}</style>
    </div>
  );
}
