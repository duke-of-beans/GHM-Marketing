"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { CHART_FALLBACKS } from "@/hooks/use-chart-colors";

export function PerformanceMonitoringDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/monitoring/performance?minutes=60");
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return <div>Loading performance metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.avgDuration.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              P95: {data.stats.p95.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Request Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.count}</div>
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.stats.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.errors.total} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Slowest Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.maxDuration.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {data.stats.minDuration.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Request Volume & Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.volume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke={CHART_FALLBACKS[0]}
                name="Requests"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgDuration"
                stroke={CHART_FALLBACKS[2]}
                name="Avg Duration (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Slow Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Slowest Queries</CardTitle>
          </CardHeader>
          <CardContent>
            {data.slowQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No slow queries detected
              </p>
            ) : (
              <div className="space-y-2">
                {data.slowQueries.map((query: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {query.method} {query.endpoint}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(query.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge
                      variant={query.duration > 1000 ? "destructive" : "default"}
                    >
                      {query.duration.toFixed(0)}ms
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Errors by Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Errors by Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            {data.errors.byEndpoint.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No errors detected
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.errors.byEndpoint}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_FALLBACKS[3]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
