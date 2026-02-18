"use client";

import { useRealtimeUpdates, useActiveUsers } from "@/lib/realtime/use-realtime";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Shows real-time connection status indicator
 */
export function RealtimeStatus() {
  const { connected } = useRealtimeUpdates();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={connected ? "default" : "secondary"}
            className={`gap-1 ${connected ? "bg-green-500" : "bg-gray-400"}`}
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="text-xs">
              {connected ? "Live" : "Offline"}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {connected
              ? "Connected to real-time updates"
              : "Reconnecting..."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Shows active users indicator
 */
export function ActiveUsersIndicator() {
  const activeUsers = useActiveUsers();

  if (activeUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            <span className="text-xs">{activeUsers.length}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {activeUsers.length} user{activeUsers.length > 1 ? "s" : ""} active
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
