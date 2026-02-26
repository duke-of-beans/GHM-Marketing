"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Plus,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Target,
} from "lucide-react";

/**
 * Quick Actions Widget for Master Dashboard
 * Signal redesign: neutral rows, icon-only color, no rainbow backgrounds.
 */
export function QuickActions() {
  const actions = [
    {
      label: "Add Lead",
      icon: Plus,
      href: "/discovery",
      description: "Find new prospects",
      iconColor: "text-primary",
    },
    {
      label: "Review Content",
      icon: FileText,
      href: "/review",
      description: "Approve pending work",
      iconColor: "text-primary",
    },
    {
      label: "View Pipeline",
      icon: TrendingUp,
      href: "/leads",
      description: "Check sales progress",
      iconColor: "text-status-success",
    },
    {
      label: "Manage Team",
      icon: Users,
      href: "/settings?tab=team",
      description: "Update team members",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="rounded-lg bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
      <div className="flex flex-col gap-0.5">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors group">
              <action.icon className={cn("h-4 w-4 shrink-0", action.iconColor)} />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Revenue Metrics Widget with trend indicators.
 * Signal redesign: neutral card, green accent text only (no green gradient background).
 */
export function RevenueMetricsWidget({
  mrr,
  arr,
  growth,
}: {
  mrr: number;
  arr: number;
  growth: number;
}) {
  const isPositiveGrowth = growth > 0;

  return (
    <div className="rounded-lg bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-status-success" />
        Revenue
      </h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Monthly Recurring</p>
          <p className="text-2xl font-bold text-status-success tabular-nums">
            ${mrr.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ARR: ${arr.toLocaleString()}
          </p>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Growth</span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                isPositiveGrowth ? "text-status-success" : "text-muted-foreground"
              )}
            >
              {isPositiveGrowth ? "+" : ""}
              {growth.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Active Goals/Targets Widget.
 * Signal redesign: thin progress bars (h-1.5), primary + success colors, no Card wrapper.
 */
export function GoalsWidget({
  wonDeals,
  targetDeals,
  revenue,
  targetRevenue,
}: {
  wonDeals: number;
  targetDeals: number;
  revenue: number;
  targetRevenue: number;
}) {
  const dealsProgress = (wonDeals / targetDeals) * 100;
  const revenueProgress = (revenue / targetRevenue) * 100;

  return (
    <div className="rounded-lg bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        Monthly Goals
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-foreground">Deals Closed</span>
            <span className="font-semibold">{wonDeals} / {targetDeals}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(dealsProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {dealsProgress.toFixed(0)}% of target
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-foreground">Revenue</span>
            <span className="font-semibold">
              ${(revenue / 1000).toFixed(0)}K / ${(targetRevenue / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-status-success h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(revenueProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {revenueProgress.toFixed(0)}% of target
          </div>
        </div>
      </div>
    </div>
  );
}
