"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";

type UserActivity = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  position: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  eventCount30d: number;
  lastActivity: string | null;
  pagesVisited30d: number;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function activityBadge(count: number) {
  if (count === 0) return <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>;
  if (count < 20) return <Badge variant="outline" className="text-xs">{count} events</Badge>;
  if (count < 100) return <Badge variant="secondary" className="text-xs">{count} events</Badge>;
  return <Badge className="text-xs bg-emerald-600 text-white">{count} events</Badge>;
}

export function UserActivityTab() {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "activity" | "lastLogin">("activity");

  useEffect(() => {
    fetch("/api/admin/user-activity")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...users].sort((a, b) => {
    if (sortBy === "activity") return b.eventCount30d - a.eventCount30d;
    if (sortBy === "lastLogin") {
      return (b.lastLogin ?? "").localeCompare(a.lastLogin ?? "");
    }
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading activity data…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">User Activity</h3>
          <p className="text-sm text-muted-foreground">Session stats and activity for the last 30 days. Admin only.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort:</span>
          {(["activity", "lastLogin", "name"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                sortBy === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-transparent"
              }`}
            >
              {s === "activity" ? "Most Active" : s === "lastLogin" ? "Last Login" : "Name"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role / Position</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Last Login</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Last Activity</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">30d Events</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Pages (30d)</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{ROLE_LABELS[u.role]}</div>
                  {u.position && <div className="text-xs text-muted-foreground">{u.position}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{timeAgo(u.lastLogin)}</td>
                <td className="px-4 py-3 text-muted-foreground">{timeAgo(u.lastActivity)}</td>
                <td className="px-4 py-3">{activityBadge(u.eventCount30d)}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.pagesVisited30d || "—"}</td>
                <td className="px-4 py-3">
                  {u.isActive
                    ? <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">Active</Badge>
                    : <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Events derived from audit log. Last login pulled from user record. Activity resets every 30 days.
      </p>
    </div>
  );
}
