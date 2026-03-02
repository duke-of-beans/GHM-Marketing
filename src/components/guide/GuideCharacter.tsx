"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GUIDE_CONFIG, GuideTip, TriggerType } from "./guide-config";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const SESSION_KEY = "covos:guide-dismissed-tips";
const VISITED_KEY = (route: string) => `covos:visited:${route}`;

function getDismissedTips(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function dismissTip(key: string) {
  if (typeof window === "undefined") return;
  const dismissed = getDismissedTips();
  dismissed.add(key);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...dismissed]));
}

function tipKey(route: string, trigger: TriggerType) {
  return `${route}::${trigger}`;
}

function isFirstVisit(route: string): boolean {
  if (typeof window === "undefined") return false;
  const visited = localStorage.getItem(VISITED_KEY(route));
  return !visited;
}

function markVisited(route: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VISITED_KEY(route), "1");
}

function getVisitCount(route: string): number {
  if (typeof window === "undefined") return 0;
  const key = `covos:visit-count:${route}`;
  const count = parseInt(localStorage.getItem(key) ?? "0", 10);
  return isNaN(count) ? 0 : count;
}

function incrementVisitCount(route: string) {
  if (typeof window === "undefined") return;
  const key = `covos:visit-count:${route}`;
  const count = getVisitCount(route);
  localStorage.setItem(key, String(count + 1));
}

type ActiveTip = { message: string; key: string } | null;

type Props = {
  guideEnabled: boolean;
};

export function GuideCharacter({ guideEnabled }: Props) {
  const [activeTip, setActiveTip] = useState<ActiveTip>(null);
  const pathname = usePathname();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedFirstVisitRef = useRef(false);
  const lastPathnameRef = useRef<string | null>(null);
  const emptyStateObserverRef = useRef<MutationObserver | null>(null);

  if (!guideEnabled) return null;

  function showTip(route: string, trigger: TriggerType) {
    const key = tipKey(route, trigger);
    const dismissed = getDismissedTips();
    if (dismissed.has(key)) return;

    const config = GUIDE_CONFIG[route];
    if (!config) return;

    const tip = config.tips.find((t) => t.trigger === trigger);
    if (!tip) return;

    dismissTip(key);
    setActiveTip({ message: tip.message, key });
  }

  function dismiss() {
    setActiveTip(null);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!activeTip) {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      return;
    }

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setActiveTip(null);
    }, 8000);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [activeTip]);

  // Click anywhere to dismiss
  useEffect(() => {
    if (!activeTip) return;

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const bubble = document.querySelector("[data-guide-bubble]");
      const avatar = document.querySelector("[data-guide-avatar]");

      if (
        bubble &&
        !bubble.contains(target) &&
        avatar &&
        !avatar.contains(target)
      ) {
        dismiss();
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [activeTip]);

  // Handle route changes
  useEffect(() => {
    // Normalize pathname
    let route = pathname || "/";
    if (route !== lastPathnameRef.current) {
      lastPathnameRef.current = route;

      // Clear idle timer on route change
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      hasCheckedFirstVisitRef.current = false;

      // Increment visit count
      incrementVisitCount(route);

      // Check first_visit
      if (isFirstVisit(route)) {
        markVisited(route);
        showTip(route, "first_visit");
      }

      // Set up idle timer for idle_60s trigger (fires after 60s with no user interaction)
      idleTimerRef.current = setTimeout(() => {
        showTip(route, "idle_60s");
      }, 60_000);

      // Check repeated_visit_no_action
      const visitCount = getVisitCount(route);
      if (visitCount >= 3) {
        showTip(route, "repeated_visit_no_action");
      }
    }

    // Reset idle timer on user interaction
    function resetIdleTimer() {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        showTip(route, "idle_60s");
      }, 60_000);
    }

    window.addEventListener("click", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);

    return () => {
      window.removeEventListener("click", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
    };
  }, [pathname]);

  // Monitor for empty state
  useEffect(() => {
    if (emptyStateObserverRef.current) {
      emptyStateObserverRef.current.disconnect();
    }

    const observer = new MutationObserver(() => {
      const emptyElement = document.querySelector(
        '[data-guide-empty="true"]'
      );
      if (emptyElement) {
        showTip(pathname || "/", "empty_state");
      }
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-guide-empty"],
    });

    emptyStateObserverRef.current = observer;

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Avatar */}
      <div
        data-guide-avatar
        className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center flex-shrink-0 shadow-lg cursor-pointer"
      >
        <div className="flex gap-1.5 items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-primary-foreground" />
          <div className="w-1 h-1 rounded-full bg-primary-foreground" />
        </div>
      </div>

      {/* Speech bubble */}
      <div
        data-guide-bubble
        className={`absolute bottom-10 right-0 w-64 bg-popover border rounded-lg shadow-xl p-3 transition-all duration-300 ${
          activeTip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <button
          onClick={dismiss}
          className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
        <p className="text-xs text-foreground leading-relaxed pr-4">
          {activeTip?.message}
        </p>
      </div>
    </div>
  );
}
