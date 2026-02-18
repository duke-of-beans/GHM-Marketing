"use client";

import { useState, useEffect, useCallback } from "react";
import { TeamFeedSidebar, TeamFeedToggle } from "@/components/team-feed/TeamFeedSidebar";

type TeamUser = { id: number; name: string; role: string };

type Props = {
  children: React.ReactNode;
  heading: React.ReactNode;
  users: TeamUser[];
  isMaster: boolean;
  currentUserId: number;
};

export function MasterPageClient({
  children,
  heading,
  users,
  isMaster,
  currentUserId,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count for the toggle badge (independent of sidebar state)
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

  // Persist sidebar preference
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
    <div className="flex min-h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 pb-20 md:pb-4">
        {/* Page header with toggle button */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">{heading}</div>
          <TeamFeedToggle
            open={sidebarOpen}
            onToggle={toggle}
            unreadCount={unreadCount}
          />
        </div>

        {children}
      </div>

      {/* Team Feed sidebar */}
      <TeamFeedSidebar
        open={sidebarOpen}
        onClose={toggle}
        users={users}
        isMaster={isMaster}
        currentUserId={currentUserId}
      />
    </div>
  );
}
