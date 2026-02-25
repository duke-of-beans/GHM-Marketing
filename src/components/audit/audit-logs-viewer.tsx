"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Download,
  RefreshCw,
  Filter
} from "lucide-react";
import { toast } from "sonner";

type AuditLog = {
  id: number;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string | null;
  permission: string | null;
  method: string | null;
  timestamp: string;
  status: string;
  statusCode: number | null;
  ipAddress: string | null;
  errorMessage: string | null;
};

type AuditStats = {
  totalActions: number;
  deniedActions: number;
  uniqueUsers: number;
  actionsByType: { action: string; count: number }[];
};

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/audit-logs?stats=true");
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, actionFilter, statusFilter]);

  const exportLogs = async () => {
    try {
      // In a real implementation, this would call an export endpoint
      toast.success("Export will be available soon.");
    } catch (error) {
      toast.error("Failed to export logs");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case "denied":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      page_access: "bg-blue-100 text-blue-700",
      api_call: "bg-purple-100 text-purple-700",
      permission_check: "bg-green-100 text-green-700",
      permission_denied: "bg-red-100 text-red-700",
      data_export: "bg-orange-100 text-orange-700",
      data_create: "bg-teal-100 text-teal-700",
      data_update: "bg-yellow-100 text-yellow-700",
      data_delete: "bg-red-100 text-red-700",
    };
    
    return (
      <Badge className={colors[action] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Denied Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.deniedActions.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalActions > 0 
                  ? (((stats.totalActions - stats.deniedActions) / stats.totalActions) * 100).toFixed(1)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <Input
              placeholder="Search by user, resource, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="page_access">Page Access</SelectItem>
                <SelectItem value="api_call">API Call</SelectItem>
                <SelectItem value="permission_check">Permission Check</SelectItem>
                <SelectItem value="permission_denied">Permission Denied</SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="space-y-2">
              {logs.filter(log => {
                if (!searchQuery) return true;
                const search = searchQuery.toLowerCase();
                return (
                  log.userName.toLowerCase().includes(search) ||
                  log.userEmail.toLowerCase().includes(search) ||
                  log.resource?.toLowerCase().includes(search) ||
                  log.ipAddress?.toLowerCase().includes(search)
                );
              }).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      {getStatusBadge(log.status)}
                      {log.permission && (
                        <Badge variant="outline" className="text-xs">
                          {log.permission}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {log.userName} <span className="text-muted-foreground">({log.userEmail})</span>
                      </p>
                      {log.resource && (
                        <p className="text-sm text-muted-foreground">
                          Resource: <span className="font-mono">{log.resource}</span>
                        </p>
                      )}
                      {log.errorMessage && (
                        <p className="text-sm text-red-600">
                          Error: {log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-muted-foreground space-y-1 flex-shrink-0 ml-4">
                    <div>{new Date(log.timestamp).toLocaleString()}</div>
                    {log.ipAddress && (
                      <div className="text-xs">{log.ipAddress}</div>
                    )}
                    {log.method && log.statusCode && (
                      <div className="text-xs">
                        {log.method} {log.statusCode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
