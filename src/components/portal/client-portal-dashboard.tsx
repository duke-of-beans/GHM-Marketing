"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Client = {
  id: number;
  businessName: string;
  healthScore: number;
  lead: {
    businessName: string;
    phone: string | null;
    email: string | null;
    website: string | null;
  };
  scans: any[];
  tasks: any[];
  reports: any[];
};

export function ClientPortalDashboard({ client }: { client: Client }) {
  const latestScan = client.scans[0];
  const completedTasks = client.tasks.filter(
    (t) => t.status === "deployed" || t.status === "measured"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">{client.businessName}</h1>
          <p className="text-sm text-muted-foreground">Client Dashboard</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{client.healthScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {client.healthScore >= 70
                  ? "Excellent performance"
                  : client.healthScore >= 50
                  ? "Good performance"
                  : "Needs improvement"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks delivered this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reports Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{client.reports.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Performance reports
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Scan */}
        {latestScan && (
          <Card>
            <CardHeader>
              <CardTitle>Latest Competitive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Scan Date:</span>
                  <span className="font-medium">
                    {new Date(latestScan.scanDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Health Score:</span>
                  <span className="font-medium">{latestScan.healthScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="outline">{latestScan.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {client.reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reports available yet. Reports are generated monthly.
              </p>
            ) : (
              <div className="space-y-3">
                {client.reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium capitalize">{report.type} Report</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(report.periodStart).toLocaleDateString()} -{" "}
                        {new Date(report.periodEnd).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed work yet. Check back soon!
              </p>
            ) : (
              <div className="space-y-3">
                {completedTasks.slice(0, 10).map((task: any) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{task.title}</div>
                      <Badge
                        variant={
                          task.status === "measured" ? "default" : "secondary"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    {task.completedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Completed:{" "}
                        {new Date(task.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GHM Digital Marketing Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
