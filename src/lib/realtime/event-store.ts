/**
 * Real-time event types for dashboard updates
 */
export type DashboardEvent =
  | "lead_created"
  | "lead_updated"
  | "lead_status_changed"
  | "client_created"
  | "client_updated"
  | "task_created"
  | "task_completed"
  | "scan_completed"
  | "opportunity_detected"
  | "payment_processed"
  | "user_activity";

export interface DashboardEventData {
  type: DashboardEvent;
  userId?: number;
  data: any;
  timestamp: number;
}

/**
 * In-memory event store for SSE
 * In production, use Redis or similar
 */
class EventStore {
  private subscribers = new Map<string, Set<(data: DashboardEventData) => void>>();
  private recentEvents: DashboardEventData[] = [];
  private maxEvents = 100;

  subscribe(clientId: string, callback: (data: DashboardEventData) => void) {
    if (!this.subscribers.has(clientId)) {
      this.subscribers.set(clientId, new Set());
    }
    this.subscribers.get(clientId)!.add(callback);
  }

  unsubscribe(clientId: string) {
    this.subscribers.delete(clientId);
  }

  publish(event: DashboardEventData) {
    // Store event
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.shift();
    }

    // Notify all subscribers
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("Error notifying subscriber:", error);
        }
      });
    });
  }

  getRecentEvents(since?: number): DashboardEventData[] {
    if (!since) return this.recentEvents;
    return this.recentEvents.filter((e) => e.timestamp > since);
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

export const eventStore = new EventStore();

/**
 * Publish a dashboard event
 */
export function publishDashboardEvent(type: DashboardEvent, data: any, userId?: number) {
  eventStore.publish({
    type,
    userId,
    data,
    timestamp: Date.now(),
  });
}

/**
 * Helper functions for common events
 */
export const dashboardEvents = {
  leadCreated: (leadId: number, data: any) => 
    publishDashboardEvent("lead_created", { leadId, ...data }),
  
  leadStatusChanged: (leadId: number, oldStatus: string, newStatus: string) =>
    publishDashboardEvent("lead_status_changed", { leadId, oldStatus, newStatus }),
  
  clientCreated: (clientId: number, data: any) =>
    publishDashboardEvent("client_created", { clientId, ...data }),
  
  taskCompleted: (taskId: number, clientId: number) =>
    publishDashboardEvent("task_completed", { taskId, clientId }),
  
  scanCompleted: (scanId: number, clientId: number, healthScore: number) =>
    publishDashboardEvent("scan_completed", { scanId, clientId, healthScore }),
  
  opportunityDetected: (opportunityId: number, clientId: number, projectedMrr: number) =>
    publishDashboardEvent("opportunity_detected", { opportunityId, clientId, projectedMrr }),
  
  userActivity: (userId: number, action: string, resource: string) =>
    publishDashboardEvent("user_activity", { action, resource }, userId),
};
