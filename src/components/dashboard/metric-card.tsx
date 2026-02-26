import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  className?: string;
  tooltip?: string;
};

export function MetricCard({ title, value, subtitle, trend, className, tooltip }: MetricCardProps) {
  return (
    <TooltipProvider>
      <div className={cn("relative rounded-lg bg-card p-4", className)}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded",
                trend.value >= 0
                  ? "text-status-success bg-status-success-bg"
                  : "text-status-danger bg-status-danger-bg"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
