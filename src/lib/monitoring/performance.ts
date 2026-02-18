import { prisma } from "@/lib/db";

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: number;
  error?: string;
}

/**
 * In-memory performance metrics store
 * In production, use a time-series database like InfluxDB or Prometheus
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics with filters
   */
  getMetrics(filters?: {
    endpoint?: string;
    startTime?: Date;
    endTime?: Date;
    minDuration?: number;
    statusCode?: number;
  }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filters?.endpoint) {
      filtered = filtered.filter((m) => m.endpoint === filters.endpoint);
    }
    if (filters?.startTime) {
      filtered = filtered.filter((m) => m.timestamp >= filters.startTime!);
    }
    if (filters?.endTime) {
      filtered = filtered.filter((m) => m.timestamp <= filters.endTime!);
    }
    if (filters?.minDuration) {
      filtered = filtered.filter((m) => m.duration >= filters.minDuration!);
    }
    if (filters?.statusCode) {
      filtered = filtered.filter((m) => m.statusCode === filters.statusCode);
    }

    return filtered;
  }

  /**
   * Get statistics for an endpoint
   */
  getStats(endpoint?: string, minutes: number = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const metrics = endpoint
      ? this.getMetrics({ endpoint, startTime: cutoff })
      : this.getMetrics({ startTime: cutoff });

    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        errorRate: 0,
      };
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const errors = metrics.filter((m) => m.statusCode >= 400).length;

    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      errorRate: (errors / metrics.length) * 100,
    };
  }

  /**
   * Get slow queries (top N by duration)
   */
  getSlowQueries(limit: number = 10, minutes: number = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const metrics = this.getMetrics({ startTime: cutoff });
    
    return metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get error summary
   */
  getErrors(minutes: number = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const metrics = this.getMetrics({ startTime: cutoff });
    
    const errors = metrics.filter((m) => m.statusCode >= 400);
    const byStatus = new Map<number, number>();
    const byEndpoint = new Map<string, number>();

    errors.forEach((error) => {
      byStatus.set(error.statusCode, (byStatus.get(error.statusCode) || 0) + 1);
      byEndpoint.set(error.endpoint, (byEndpoint.get(error.endpoint) || 0) + 1);
    });

    return {
      total: errors.length,
      byStatus: Array.from(byStatus.entries()).map(([code, count]) => ({
        statusCode: code,
        count,
      })),
      byEndpoint: Array.from(byEndpoint.entries()).map(([endpoint, count]) => ({
        endpoint,
        count,
      })),
    };
  }

  /**
   * Get request volume over time
   */
  getRequestVolume(intervalMinutes: number = 5, totalMinutes: number = 60) {
    const now = Date.now();
    const intervals: { timestamp: Date; count: number; avgDuration: number }[] = [];

    for (let i = totalMinutes; i >= 0; i -= intervalMinutes) {
      const start = new Date(now - i * 60 * 1000);
      const end = new Date(now - (i - intervalMinutes) * 60 * 1000);
      
      const metrics = this.getMetrics({ startTime: start, endTime: end });
      
      intervals.push({
        timestamp: start,
        count: metrics.length,
        avgDuration:
          metrics.length > 0
            ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
            : 0,
      });
    }

    return intervals;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware wrapper to track API performance
 */
export function withPerformanceTracking<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let statusCode = 200;
  let error: string | undefined;

  return handler()
    .then((result) => {
      const duration = Date.now() - start;
      performanceMonitor.record({
        endpoint,
        method,
        duration,
        statusCode,
        timestamp: new Date(),
      });
      return result;
    })
    .catch((err) => {
      const duration = Date.now() - start;
      statusCode = err.status || 500;
      error = err.message;
      
      performanceMonitor.record({
        endpoint,
        method,
        duration,
        statusCode,
        timestamp: new Date(),
        error,
      });
      
      throw err;
    });
}
