"use client";

import { useState, useEffect, useCallback } from "react";
import { TeamFeedSidebar, TeamFeedToggle } from "@/components/team-feed/TeamFeedSidebar";
import { PushPermissionPrompt } from "@/components/push/PushPermissionPrompt";

type TeamUser = { id: number; name: string; role: string };

type Props = {
  children: React.ReactNode;
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
  pushEnabled?: boolean;
};

export function DashboardLayoutClient({
  children,
  users,
  isMaster,
  currentUserId,
  pushEnabled = true,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        <div className="sticky top-0 z-10 flex justify-end px-4 md:px-6 pt-3 pb-1 bg-background/80 backdrop-blur-sm border-b">
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

      {/* Push notification permission prompt — fires once on first visit */}
      <PushPermissionPrompt pushEnabled={pushEnabled} />
    </div>
  );
}
