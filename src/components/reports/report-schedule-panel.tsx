"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Delivery {
  id: number;
  type: string;
  periodStart: string;
  periodEnd: string;
  sentAt: string | null;
  createdAt: string;
}

interface ReportScheduleProps {
  clientId: number;
}

const DELIVERY_DAY_OPTIONS = [
  { label: "1st of month", value: 1 },
  { label: "5th of month", value: 5 },
  { label: "15th of month", value: 15 },
];

export function ReportSchedulePanel({ clientId }: ReportScheduleProps) {
  const [deliveryDay, setDeliveryDay] = useState<1 | 5 | 15 | null>(null);
  const [deliveryEmails, setDeliveryEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch(`/api/reports/schedule?clientId=${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setDeliveryDay(data.deliveryDay ?? null);
        setDeliveryEmails(data.deliveryEmails ?? []);
        setDeliveries(data.deliveries ?? []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  async function save() {
    setSaving(true);
    setSaveStatus("idle");
    const res = await fetch("/api/reports/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, deliveryDay, deliveryEmails }),
    });
    setSaving(false);
    setSaveStatus(res.ok ? "saved" : "error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  function addEmail() {
    const trimmed = emailInput.trim();
    if (!trimmed || deliveryEmails.includes(trimmed)) return;
    setDeliveryEmails([...deliveryEmails, trimmed]);
    setEmailInput("");
  }

  function removeEmail(email: string) {
    setDeliveryEmails(deliveryEmails.filter((e) => e !== email));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delivery Day */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Monthly Delivery Day
        </label>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDeliveryDay(opt.value as 1 | 5 | 15)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                deliveryDay === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {deliveryDay && (
            <button
              onClick={() => setDeliveryDay(null)}
              className="px-4 py-2 rounded-md border text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            >
              Disable
            </button>
          )}
        </div>
        {!deliveryDay && (
          <p className="text-xs text-muted-foreground mt-2">
            No schedule set — reports will not be auto-delivered.
          </p>
        )}
      </div>

      {/* Recipients */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Delivery Recipients
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmail()}
            placeholder="Add email address..."
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button variant="outline" size="sm" onClick={addEmail}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {deliveryEmails.map((email) => (
            <Badge
              key={email}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => removeEmail(email)}
              title="Click to remove"
            >
              {email} ×
            </Badge>
          ))}
        </div>
        {deliveryEmails.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            No recipients — will fall back to client&apos;s primary email.
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Schedule
        </Button>
        {saveStatus === "saved" && (
          <span className="text-sm text-status-success flex items-center gap-1">
            <CheckCircle className="h-4 w-4" /> Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-destructive flex items-center gap-1">
            <XCircle className="h-4 w-4" /> Save failed
          </span>
        )}
      </div>

      {/* Delivery Log */}
      {deliveries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Delivery History</h4>
          <div className="space-y-1">
            {deliveries.map((d) => {
              const period = new Date(d.periodEnd).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              });
              const sentAt = d.sentAt
                ? new Date(d.sentAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0"
                >
                  <span className="text-foreground">{period} report</span>
                  {sentAt ? (
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-status-success" />
                      Sent {sentAt}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Not sent</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
