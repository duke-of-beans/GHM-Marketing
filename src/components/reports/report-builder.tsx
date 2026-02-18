"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

export function ReportBuilder() {
  const [reportType, setReportType] = useState("performance");
  const [format, setFormat] = useState("csv");
  const [period, setPeriod] = useState("last_30_days");
  const [columns, setColumns] = useState<string[]>([
    "date",
    "revenue",
    "clients",
  ]);

  const availableColumns = {
    performance: [
      { id: "date", label: "Date" },
      { id: "revenue", label: "Revenue" },
      { id: "clients", label: "Active Clients" },
      { id: "deals", label: "Deals Closed" },
      { id: "conversion", label: "Conversion Rate" },
    ],
    sales: [
      { id: "rep", label: "Sales Rep" },
      { id: "leads", label: "Leads" },
      { id: "calls", label: "Calls Made" },
      { id: "demos", label: "Demos" },
      { id: "deals", label: "Deals Won" },
      { id: "revenue", label: "Revenue" },
    ],
    clients: [
      { id: "name", label: "Client Name" },
      { id: "health", label: "Health Score" },
      { id: "retainer", label: "Monthly Retainer" },
      { id: "tasks", label: "Active Tasks" },
      { id: "lastScan", label: "Last Scan" },
    ],
  };

  const handleGenerate = () => {
    // In production, call API to generate report
    toast.success("Report generated successfully!");
  };

  const handleScheduleEmail = () => {
    // In production, call API to schedule report
    toast.success("Report scheduled for email delivery");
  };

  const toggleColumn = (columnId: string) => {
    setColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((c) => c !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Report Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type */}
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance Summary</SelectItem>
              <SelectItem value="sales">Sales Activity</SelectItem>
              <SelectItem value="clients">Client Portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Period */}
        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Columns Selection */}
        <div className="space-y-2">
          <Label>Columns to Include</Label>
          <div className="grid grid-cols-2 gap-3">
            {availableColumns[reportType as keyof typeof availableColumns].map(
              (col) => (
                <div key={col.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={col.id}
                    checked={columns.includes(col.id)}
                    onCheckedChange={() => toggleColumn(col.id)}
                  />
                  <label
                    htmlFor={col.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {col.label}
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleGenerate} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={handleScheduleEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
