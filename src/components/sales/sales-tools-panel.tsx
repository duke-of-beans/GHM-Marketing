"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Zap,
  FileSearch,
  MonitorPlay,
  LayoutTemplate,
  BarChart3,
  Map,
  TrendingUp,
  Target,
} from "lucide-react";

const tools = [
  {
    label: "Pipeline",
    icon: TrendingUp,
    href: "/leads",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    tooltip: "Your active leads and pipeline.",
  },
  {
    label: "Claim Leads",
    icon: Target,
    href: "/leads?filter=available",
    color: "text-status-success",
    bg: "bg-status-success-bg",
    tooltip: "Unclaimed leads available in your territory.",
  },
  {
    label: "Audit PDF",
    icon: FileSearch,
    href: "/leads",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    tooltip: "Open any lead, then use the Audit button to generate a prospect audit report.",
  },
  {
    label: "Live Demo",
    icon: MonitorPlay,
    href: "/leads",
    color: "text-status-warning",
    bg: "bg-status-warning-bg",
    tooltip: "Open any lead, then use the Live Demo button to generate a personalized demo page.",
  },
  {
    label: "Brochure",
    icon: LayoutTemplate,
    href: "/brochure",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    tooltip: "One-page overview of services. Share during calls or follow-ups.",
    external: true,
  },
  {
    label: "Comp Sheet",
    icon: BarChart3,
    href: "/comp-sheet",
    color: "text-status-warning",
    bg: "bg-status-warning-bg",
    tooltip: "Earnings projections by book size.",
    external: true,
  },
  {
    label: "Territory Map",
    icon: Map,
    href: "/territory-map",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    tooltip: "Geographic overview of your assigned markets.",
    external: true,
  },
];

export function SalesToolsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-status-warning" />
          Sales Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Tooltip key={tool.label}>
                  <TooltipTrigger asChild>
                    <Link
                      href={tool.href}
                      target={tool.external ? "_blank" : undefined}
                      rel={tool.external ? "noopener noreferrer" : undefined}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full h-auto flex-col items-center gap-1.5 p-3 ${tool.bg} hover:opacity-80 border-none rounded-xl`}
                      >
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                        <span className="text-[11px] font-medium leading-tight text-center">
                          {tool.label}
                        </span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">{tool.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
