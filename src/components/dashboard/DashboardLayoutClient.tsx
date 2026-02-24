"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TeamFeedSidebar, TeamFeedToggle } from "@/components/team-feed/TeamFeedSidebar";
import { PushPermissionPrompt } from "@/components/push/PushPermissionPrompt";
import { AISearchBar } from "@/components/search/AISearchBar";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardEvent } from "@/hooks/use-dashboard-event";

type TeamUser = { id: number; name: string; role: string };

type Props = {
  children: React.ReactNode;
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
  pushEnabled?: boolean;
  userRole: "sales" | "manager" | "owner";
  userName: string;
};

export function DashboardLayoutClient({
  children,
  users,
  isMaster,
  currentUserId,
  pushEnabled = true,
  userRole,
  userName,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { trackPageView } = useDashboardEvent();
  // Track "G" prefix for two-key navigation sequences (e.g. G→D = go to dashboard)
  const gPrefixRef = useRef(false);
  const gPrefixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/team-messages?feed=true");
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    pollUnread();
    const interval = setInterval(pollUnread, 30_000);
    return () => clearInterval(interval);
  }, [pollUnread]);

  // Persist open/closed preference
  useEffect(() => {
    const saved = localStorage.getItem("team-feed-sidebar-open");
    if (saved === "true") setSidebarOpen(true);
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname, trackPageView]);

  // Global keyboard shortcuts (fires when not in an input context)
  useEffect(() => {
    const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
    function isTyping(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      return INPUT_TAGS.has(t.tagName) || t.isContentEditable;
    }

    function onKey(e: KeyboardEvent) {
      if (isTyping(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // let browser/search handle mod-key combos

      const key = e.key.toLowerCase();

      // "?" — show keyboard shortcuts help
      if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      // "G" prefix navigation
      if (key === "g") {
        gPrefixRef.current = true;
        if (gPrefixTimer.current) clearTimeout(gPrefixTimer.current);
        gPrefixTimer.current = setTimeout(() => { gPrefixRef.current = false; }, 1500);
        return;
      }

      if (gPrefixRef.current) {
        gPrefixRef.current = false;
        if (gPrefixTimer.current) clearTimeout(gPrefixTimer.current);
        const navMap: Record<string, string> = {
          d: "/",
          l: "/leads",
          c: "/clients",
          t: "/tasks",
          r: "/reports",
          s: "/settings",
          p: "/payments",
        };
        if (navMap[key]) {
          e.preventDefault();
          router.push(navMap[key]);
        }
        return;
      }

      // Escape — close shortcuts help if open
      if (e.key === "Escape" && shortcutsOpen) {
        setShortcutsOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, shortcutsOpen]);

  function toggle() {
    setSidebarOpen((prev) => {
      localStorage.setItem("team-feed-sidebar-open", String(!prev));
      return !prev;
    });
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main scrollable content area */}
      <div className="flex-1 min-w-0 overflow-auto">
        {/* Sticky top bar with Team Feed toggle */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 md:px-6 pt-3 pb-1 bg-background/80 backdrop-blur-sm border-b">
          <AISearchBar />
          <TeamFeedToggle
            open={sidebarOpen}
            onToggle={toggle}
            unreadCount={unreadCount}
          />
        </div>
        {/* Page content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>

      {/* Global Team Feed sidebar */}
      <TeamFeedSidebar
        open={sidebarOpen}
        onClose={toggle}
        users={users}
        isMaster={isMaster}
        currentUserId={currentUserId}
      />

      {/* Onboarding tutorial — mounted globally so Help menu restart works on any page */}
      <OnboardingTutorial userRole={userRole} userName={userName} />

      {/* Push notification permission prompt — fires once on first visit */}
      <PushPermissionPrompt pushEnabled={pushEnabled} />

      {/* Global keyboard shortcuts help overlay — ? to open */}
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
