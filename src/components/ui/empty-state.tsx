"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string | React.ReactNode;
  action?: EmptyStateAction;
  /** "card" wraps in a Card; "inline" renders a plain div (default: "card") */
  variant?: "card" | "inline";
  /** Extra className applied to the outermost wrapper */
  className?: string;
  /** Size of the icon in Tailwind h/w classes (default: "h-10 w-10") */
  iconSize?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
  iconSize = "h-10 w-10",
}: EmptyStateProps) {
  const inner = (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && (
        <Icon
          className={cn(iconSize, "text-muted-foreground/40 mb-3")}
          strokeWidth={1.5}
        />
      )}
      <p className="font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <a href={action.href}>
              <Button variant="outline" size="sm">
                {action.label}
              </Button>
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn(className)}>{inner}</div>;
  }

  return (
    <Card className={cn(className)}>
      <CardContent className="p-0">{inner}</CardContent>
    </Card>
  );
}
