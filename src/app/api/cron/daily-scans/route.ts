/**
 * API Route: GET /api/cron/daily-scans
 * 
 * Vercel Cron job that runs daily at 2 AM UTC.
 * Scans all clients due for a competitive scan.
 * 
 * Vercel Cron authentication is handled via CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeBatchScan } from '@/lib/competitive-scan';
import { checkWebPropertyStaleness } from '@/lib/ops/cluster-approval';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel automatically sends this)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    console.log('[Cron] Starting daily competitive scans...');
    const startTime = Date.now();
    
    // Run batch scan for all clients due for a scan
    const result = await executeBatchScan({ includeDue: true });

    // Check web property staleness — fires alert engine for overdue deploys
    const staleness = await checkWebPropertyStaleness();
    console.log(`[Cron] Staleness check: ${staleness.checked} properties, ${staleness.stale} stale`);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`[Cron] Complete in ${duration}s: ${result.successful} scanned, ${result.failed} failed`);
    
    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      ...result,
    });
    
  } catch (error) {
    console.error('[Cron] Daily scan failed:', error);
    return NextResponse.json(
      { error: 'Batch scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
