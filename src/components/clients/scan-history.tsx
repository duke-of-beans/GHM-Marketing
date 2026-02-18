/**
 * Scan History Timeline Component
 * 
 * Displays competitive scan history with interactive alerts.
 * Shows health score trend and detailed scan breakdowns.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';

interface Scan {
  id: number;
  scanDate: string;
  healthScore: number;
  alerts: {
    critical: Array<{ message: string; metric: string; competitor?: string; keyword?: string; actionable: boolean }>;
    warning: Array<{ message: string; metric: string; competitor?: string; keyword?: string; actionable: boolean }>;
    info: Array<{ message: string; metric: string; competitor?: string; keyword?: string; actionable: boolean }>;
  };
}

export function ScanHistory({ clientId }: { clientId: number }) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/scans`);
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (error) {
      console.error('Failed to fetch scans:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  
  useEffect(() => {
    fetchScans();
  }, [fetchScans]);
  
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading scan history...</div>;
  }
  
  if (!scans.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No scans yet. Run your first competitive scan to see results here.
        </CardContent>
      </Card>
    );
  }
  
  const latestScan = scans[0];
  const previousScan = scans[1];
  const scoreDelta = previousScan ? latestScan.healthScore - previousScan.healthScore : 0;
  
  return (
    <div className="space-y-4">
      {/* Health Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Health Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{latestScan.healthScore}</span>
            {scoreDelta !== 0 && (
              <Badge variant={scoreDelta > 0 ? 'default' : 'destructive'} className="gap-1">
                {scoreDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(scoreDelta)} pts
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last scan: {new Date(latestScan.scanDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
      
      {/* Scan Timeline */}
      <div className="space-y-3">
        {scans.map((scan) => (
          <ScanCard key={scan.id} scan={scan} />
        ))}
      </div>
    </div>
  );
}

function ScanCard({ scan }: { scan: Scan }) {
  const [expanded, setExpanded] = useState(false);
  
  const totalAlerts = scan.alerts.critical.length + scan.alerts.warning.length + scan.alerts.info.length;
  
  const scoreColor = 
    scan.healthScore >= 75 ? 'text-green-600' : 
    scan.healthScore >= 50 ? 'text-yellow-600' : 
    'text-red-600';
  
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className={`text-2xl font-bold ${scoreColor}`}>{scan.healthScore}</span>
              <p className="text-xs text-muted-foreground">
                {new Date(scan.scanDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-2">
              {scan.alerts.critical.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {scan.alerts.critical.length}
                </Badge>
              )}
              {scan.alerts.warning.length > 0 && (
                <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                  <AlertTriangle className="h-3 w-3" />
                  {scan.alerts.warning.length}
                </Badge>
              )}
              {scan.alerts.info.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Info className="h-3 w-3" />
                  {scan.alerts.info.length}
                </Badge>
              )}
            </div>
          </div>
          
          {totalAlerts > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        {expanded && totalAlerts > 0 && (
          <div className="mt-4 space-y-2 border-t pt-4">
            {scan.alerts.critical.map((alert, index) => (
              <AlertItem key={`critical-${index}`} alert={alert} severity="critical" />
            ))}
            {scan.alerts.warning.map((alert, index) => (
              <AlertItem key={`warning-${index}`} alert={alert} severity="warning" />
            ))}
            {scan.alerts.info.map((alert, index) => (
              <AlertItem key={`info-${index}`} alert={alert} severity="info" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ 
  alert, 
  severity 
}: { 
  alert: { message: string; metric: string; competitor?: string; keyword?: string; actionable: boolean };
  severity: 'critical' | 'warning' | 'info';
}) {
  const Icon = severity === 'critical' ? AlertCircle : severity === 'warning' ? AlertTriangle : Info;
  const colorClass = 
    severity === 'critical' ? 'text-red-600' : 
    severity === 'warning' ? 'text-yellow-600' : 
    'text-blue-600';
  
  return (
    <div className="flex gap-2 text-sm">
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
      <div className="flex-1">
        <p>{alert.message}</p>
        <div className="flex gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Metric: {alert.metric}</span>
          {alert.competitor && (
            <span className="text-xs text-muted-foreground">• Competitor: {alert.competitor}</span>
          )}
          {alert.keyword && (
            <span className="text-xs text-muted-foreground">• Keyword: {alert.keyword}</span>
          )}
          {alert.actionable && (
            <Badge variant="secondary" className="text-xs h-5">Actionable</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
