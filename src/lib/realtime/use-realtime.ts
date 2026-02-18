"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardEvent, DashboardEventData } from "@/lib/realtime/event-store";

type EventHandler = (event: DashboardEventData) => void;

/**
 * Hook for real-time dashboard updates via Server-Sent Events
 */
export function useRealtimeUpdates() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DashboardEventData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/realtime/events");

        eventSource.onopen = () => {
          setConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastEvent(data);
          } catch (error) {
            console.error("Failed to parse event data:", error);
          }
        };

        eventSource.onerror = () => {
          setConnected(false);
          eventSource?.close();
          
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log("Reconnecting to real-time updates...");
            connect();
          }, 5000);
        };
      } catch (error) {
        console.error("Failed to connect to real-time updates:", error);
        setError("Failed to connect");
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  return { connected, lastEvent, error };
}

/**
 * Hook for subscribing to specific event types
 */
export function useRealtimeEvent(
  eventType: DashboardEvent | DashboardEvent[],
  handler: EventHandler
) {
  const { lastEvent } = useRealtimeUpdates();

  useEffect(() => {
    if (!lastEvent) return;

    const types = Array.isArray(eventType) ? eventType : [eventType];
    if (types.includes(lastEvent.type as DashboardEvent)) {
      handler(lastEvent);
    }
  }, [lastEvent, eventType, handler]);
}

/**
 * Hook for auto-refreshing data when events occur
 */
export function useAutoRefresh<T>(
  fetchData: () => Promise<T>,
  eventTypes: DashboardEvent[],
  interval?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useRealtimeUpdates();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchData();
      setData(result);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh on events
  useEffect(() => {
    if (!lastEvent) return;
    if (eventTypes.includes(lastEvent.type as DashboardEvent)) {
      refresh();
    }
  }, [lastEvent, eventTypes, refresh]);

  // Periodic refresh
  useEffect(() => {
    if (!interval) return;
    
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [interval, refresh]);

  return { data, loading, refresh };
}

/**
 * Hook for showing live collaboration indicators
 */
export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState<number[]>([]);
  const { lastEvent } = useRealtimeUpdates();

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "user_activity") return;
    
    const userId = lastEvent.userId;
    if (!userId) return;

    // Add user to active list
    setActiveUsers((prev) => {
      if (prev.includes(userId)) return prev;
      return [...prev, userId];
    });

    // Remove after 5 minutes of inactivity
    const timeout = setTimeout(() => {
      setActiveUsers((prev) => prev.filter((id) => id !== userId));
    }, 5 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [lastEvent]);

  return activeUsers;
}
