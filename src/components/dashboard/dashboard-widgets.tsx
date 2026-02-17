"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  TrendingUp, 
  Users,
  DollarSign,
  Target,
  Zap
} from "lucide-react";

/**
 * Quick Actions Widget for Master Dashboard
 * Provides fast access to common workflows
 */
export function QuickActions() {
  const actions = [
    {
      label: "Add Lead",
      icon: Plus,
      href: "/discovery",
      description: "Find new prospects",
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      label: "Review Content",
      icon: FileText,
      href: "/review",
      description: "Approve pending work",
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
    {
      label: "View Pipeline",
      icon: TrendingUp,
      href: "/leads",
      description: "Check sales progress",
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      label: "Manage Team",
      icon: Users,
      href: "/team",
      description: "Update team members",
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className={`w-full h-auto flex-col items-start gap-2 p-4 ${action.bgColor} border-none transition-colors`}
              >
                <div className="flex items-center gap-2 w-full">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="font-semibold text-sm">{action.label}</span>
                </div>
                <span className="text-xs text-muted-foreground text-left w-full">
                  {action.description}
                </span>
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
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-900">
          <DollarSign className="h-5 w-5" />
          Revenue Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold text-green-700">
            ${mrr.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ARR: ${arr.toLocaleString()}
          </div>
        </div>
        
        <div className="pt-3 border-t border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Growth Rate</span>
            <div className={`flex items-center gap-1 ${isPositiveGrowth ? 'text-green-600' : 'text-gray-500'}`}>
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
        {/* Deals Goal */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Deals Closed</span>
            <span className="font-semibold">{wonDeals} / {targetDeals}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(dealsProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {dealsProgress.toFixed(0)}% of target
          </div>
        </div>

        {/* Revenue Goal */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Revenue</span>
            <span className="font-semibold">
              ${(revenue / 1000).toFixed(0)}K / ${(targetRevenue / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
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
