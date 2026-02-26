"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Activity, Flame, Eye, Users } from "lucide-react";

interface FeatureHit { feature: string; count: number }
interface PageHit { page: string; count: number }
interface DauEntry { day: string; activeUsers: number }
interface UserEntry { userId: number; name: string; role: string; eventCount: number; lastSeen: string | null }

interface UsageData {
  featureHeatmap: FeatureHit[];
  topPages: PageHit[];
  dau: DauEntry[];
  userSummary: UserEntry[];
  periodDays: number;
}

export function DashboardUsagePanel() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard-usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No usage data available yet. Data appears after users interact with the platform.
        </CardContent>
      </Card>
    );
  }

  const totalEvents = data.featureHeatmap.reduce((s, f) => s + f.count, 0);
  const avgDau = data.dau.length
    ? Math.round(data.dau.reduce((s, d) => s + d.activeUsers, 0) / data.dau.length)
    : 0;
  const peakDau = data.dau.length ? Math.max(...data.dau.map((d) => d.activeUsers)) : 0;

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Events (30d)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{data.userSummary.length}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{avgDau}</div>
            <div className="text-sm text-muted-foreground">Avg DAU</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{peakDau}</div>
            <div className="text-sm text-muted-foreground">Peak DAU</div>
          </CardContent>
        </Card>
      </div>

      {/* DAU chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Daily Active Users — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dau.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dau}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)} // MM-DD
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number | undefined) => [v ?? 0, "Active Users"] as [number, string]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Line type="monotone" dataKey="activeUsers" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Feature heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4" />
              Feature Usage Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.featureHeatmap.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No feature events yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.featureHeatmap.slice(0, 10)} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 11 }}
                    width={130}
                    tickFormatter={(v) => String(v).replace(/_/g, " ")}
                  />
                  <Tooltip formatter={(v: number | undefined) => [v ?? 0, "Uses"] as [number, string]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No page views yet</div>
            ) : (
              <div className="space-y-2">
                {data.topPages.slice(0, 10).map((p) => (
                  <div key={p.page} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-muted-foreground truncate max-w-[200px]">{p.page}</span>
                    <span className="font-medium ml-2 shrink-0">{p.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-user activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            User Activity (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.userSummary.map((u) => (
              <div key={u.userId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{u.name}</span>
                  <Badge variant="secondary" className="text-xs capitalize">{u.role}</Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{u.eventCount.toLocaleString()} events</span>
                  {u.lastSeen && (
                    <span>Last: {new Date(u.lastSeen).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
