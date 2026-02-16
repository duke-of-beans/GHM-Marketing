/**
 * Scan History Component
 * 
 * Displays competitive scan history for a client.
 * Shows health score trend and alert timeline.
 */

'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import type { Alert, Alerts } from '@/types/competitive-scan';

interface ScanHistoryProps {
  clientId: number;
}

interface Scan {
  id: number;
  scanDate: string;
  healthScore: number;
  alerts: Alerts;
  status: string;
}

export function ScanHistory({ clientId }: ScanHistoryProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchScans();
  }, [clientId]);
  
  async function fetchScans() {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}/scans`);
      if (!res.ok) throw new Error('Failed to fetch scans');
      const data = await res.json();
      setScans(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading scan history...</div>;
  }
  
  if (error) {
    return <div className="text-sm text-destructive">Error: {error}</div>;
  }
  
  if (scans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No scans yet</p>
        <p className="text-xs mt-2">Scans will appear here after the first competitive scan runs.</p>
      </div>
    );
  }
  
  const latestScan = scans[0];
  const previousScan = scans[1];
  const healthDelta = previousScan ? latestScan.healthScore - previousScan.healthScore : 0;
  
  return (
    <div className="space-y-6">
      {/* Health Score Trend */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-4">Health Score Trend</h3>
        <div className="flex items-end gap-2 h-24">
          {scans.slice(0, 10).reverse().map((scan, idx) => {
            const height = (scan.healthScore / 100) * 100;
            const color = scan.healthScore >= 70 ? 'bg-green-500' : scan.healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={scan.id} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t ${color} transition-all`} style={{ height: `${height}%` }} />
                <span className="text-xs text-muted-foreground">{scan.healthScore}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div>
            <span className="text-muted-foreground">Latest:</span>
            <span className="ml-2 font-medium">{latestScan.healthScore}</span>
          </div>
          
          {previousScan && (
            <div className="flex items-center gap-1">
              {healthDelta > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : healthDelta < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : null}
              <span className={healthDelta > 0 ? 'text-green-600' : healthDelta < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                {healthDelta > 0 ? '+' : ''}{healthDelta}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Scan Timeline */}
      <div>
        <h3 className="font-medium mb-3">Scan Timeline</h3>
        <div className="space-y-3">
          {scans.map((scan) => (
            <ScanCard key={scan.id} scan={scan} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Scan Card Component
// ============================================================================

function ScanCard({ scan }: { scan: Scan }) {
  const [expanded, setExpanded] = useState(false);
  const alerts = scan.alerts as Alerts;
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;
  
  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded flex items-center justify-center font-semibold ${
            scan.healthScore >= 70 ? 'bg-green-100 text-green-700' :
            scan.healthScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {scan.healthScore}
          </div>
          
          <div>
            <div className="font-medium">
              {format(new Date(scan.scanDate), 'MMM d, yyyy')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(scan.scanDate), 'h:mm a')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              {warningCount}
            </span>
          )}
          {infoCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              <Info className="w-3 h-3" />
              {infoCount}
            </span>
          )}
          
          <span className="text-xs text-muted-foreground ml-2">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>
      
      {expanded && alerts.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {alerts.map((alert, idx) => (
            <AlertItem key={idx} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Alert Item Component
// ============================================================================

function AlertItem({ alert }: { alert: Alert }) {
  const severityConfig = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  };
  
  const config = severityConfig[alert.severity];
  
  return (
    <div className={`p-3 rounded border ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.text}`}>
            {alert.message}
          </p>
          
          {alert.competitor && (
            <p className="text-xs text-muted-foreground mt-1">
              vs {alert.competitor}
            </p>
          )}
          
          {alert.keyword && (
            <p className="text-xs text-muted-foreground mt-1">
              Keyword: {alert.keyword}
            </p>
          )}
        </div>
        
        {alert.actionable && (
          <span className="text-xs bg-white px-2 py-1 rounded border">
            Actionable
          </span>
        )}
      </div>
    </div>
  );
}
