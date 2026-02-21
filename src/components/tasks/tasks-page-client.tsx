"use client";

/**
 * TasksPageClient — two-tab shell for the Tasks page.
 *
 * UX-004 decision (Feb 21, 2026):
 *   Work tab     — assigned tasks, the existing queue
 *   Approvals tab — content review queue (ClientTask + ClientContent in "review")
 *
 * Tab state is synced to the URL (?tab=approvals) so deep links and back-nav work.
 * The Approvals tab is only visible to users with the manage_clients permission;
 * for others the page renders the Work tab only (no tab bar shown).
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isElevated } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";
import { TaskQueueClient } from "./task-queue-client";
import { ApprovalsTab } from "./approvals-tab";

type Props = {
  currentUserId: number;
  currentUserRole: UserRole;
};

type Tab = "work" | "approvals";

export function TasksPageClient({ currentUserId, currentUserRole }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const elevated = isElevated(currentUserRole);

  // Elevated users (admin/master) can see Approvals tab.
  // Sales reps only see Work.
  const showApprovals = elevated;

  const initialTab = (searchParams.get("tab") as Tab) ?? "work";
  const [activeTab, setActiveTab] = useState<Tab>(
    showApprovals && initialTab === "approvals" ? "approvals" : "work"
  );

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "work") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  // Sync tab if URL changes externally (e.g. nav from /review redirect)
  useEffect(() => {
    const urlTab = searchParams.get("tab") as Tab | null;
    if (urlTab === "approvals" && showApprovals) {
      setActiveTab("approvals");
    } else if (!urlTab) {
      setActiveTab("work");
    }
  }, [searchParams, showApprovals]);

  return (
    <>
      {/* Tab bar — only rendered when user has access to both tabs */}
      {showApprovals && (
        <div className="flex border-b">
          <button
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "work"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => switchTab("work")}
          >
            Work
          </button>
          <button
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "approvals"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => switchTab("approvals")}
          >
            Approvals
          </button>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "work" && (
        <TaskQueueClient
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      )}

      {activeTab === "approvals" && showApprovals && (
        <ApprovalsTab />
      )}
    </>
  );
}
