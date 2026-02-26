"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  Users,
  DollarSign,
  Target,
  Zap
} from "lucide-react";

/**
 * Quick Actions Widget for Master Dashboard
 */
export function QuickActions() {
  const actions = [
    {
      label: "Add Lead",
      icon: Plus,
      href: "/discovery",
      description: "Find new prospects",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
    },
    {
      label: "Review Content",
      icon: FileText,
      href: "/review",
      description: "Approve pending work",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/70",
      iconBg: "bg-purple-100 dark:bg-purple-900/60",
    },
    {
      label: "View Pipeline",
      icon: TrendingUp,
      href: "/leads",
      description: "Check sales progress",
      color: "text-status-success",
      bgColor: "bg-status-success-bg hover:bg-status-success-bg dark:hover:bg-status-success-bg/70",
      iconBg: "bg-status-success-bg",
    },
    {
      label: "Manage Team",
      icon: Users,
      href: "/settings?tab=team",
      description: "Update team members",
      color: "text-status-warning",
      bgColor: "bg-status-warning-bg hover:bg-status-warning-bg",
      iconBg: "bg-status-warning-bg",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-status-warning" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="ghost"
                className={`w-full h-auto justify-start gap-3 px-3 py-2.5 ${action.bgColor} rounded-lg`}
              >
                <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md ${action.iconBg}`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold text-sm leading-tight text-foreground">{action.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{action.description}</span>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Revenue Metrics Widget with trend indicators
 */
export function RevenueMetricsWidget({ 
  mrr, 
  arr, 
  growth 
}: { 
  mrr: number; 
  arr: number; 
  growth: number;
}) {
  const isPositiveGrowth = growth > 0;
  
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-status-success-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-status-success">
          <DollarSign className="h-5 w-5" />
          Revenue Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold text-status-success">
            ${mrr.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ARR: ${arr.toLocaleString()}
          </div>
        </div>
        
        <div className="pt-3 border-t border-status-success-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Growth Rate</span>
            <div className={`flex items-center gap-1 ${isPositiveGrowth ? 'text-status-success' : 'text-muted-foreground'}`}>
              <TrendingUp className={`h-4 w-4 ${isPositiveGrowth ? '' : 'opacity-50'}`} />
              <span className="font-semibold">{growth.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Active Goals/Targets Widget
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Monthly Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-foreground">Deals Closed</span>
            <span className="font-semibold">{wonDeals} / {targetDeals}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(dealsProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {dealsProgress.toFixed(0)}% of target
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-foreground">Revenue</span>
            <span className="font-semibold">
              ${(revenue / 1000).toFixed(0)}K / ${(targetRevenue / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-status-success-bg h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(revenueProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {revenueProgress.toFixed(0)}% of target
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
