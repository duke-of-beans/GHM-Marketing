"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    description: "Your active leads",
  },
  {
    label: "Claim Leads",
    icon: Target,
    href: "/leads?filter=available",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
    description: "Available in territory",
  },
  {
    label: "Audit PDF",
    icon: FileSearch,
    href: "/leads",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    description: "Open a lead to generate",
  },
  {
    label: "Live Demo",
    icon: MonitorPlay,
    href: "/leads",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    description: "Open a lead to create",
  },
  {
    label: "Brochure",
    icon: LayoutTemplate,
    href: "/brochure",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    description: "Share during calls",
    external: true,
  },
  {
    label: "Comp Sheet",
    icon: BarChart3,
    href: "/comp-sheet",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    description: "Earnings breakdown",
    external: true,
  },
  {
    label: "Territory Map",
    icon: Map,
    href: "/territory-map",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    description: "Markets overview",
    external: true,
  },
];

export function SalesToolsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-yellow-500" />
          Sales Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.label}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
