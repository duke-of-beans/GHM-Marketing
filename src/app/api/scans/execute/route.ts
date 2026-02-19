/**
 * API Route: POST /api/scans/execute
 * 
 * Triggers competitive scans for clients.
 * 
 * Body params:
 * - clientId?: number (specific client)
 * - clientIds?: number[] (multiple clients)
 * - scanDue?: boolean (all clients due for scan)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeScan, executeBatchScan } from '@/lib/competitive-scan';
import { isElevated } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user || !isElevated(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Elevated access required.' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { clientId, clientIds, scanDue } = body;
    
    // Single client scan
    if (clientId) {
      const result = await executeScan({ clientId: Number(clientId) });
      return NextResponse.json(result);
    }
    
    // Batch scan
    if (clientIds || scanDue) {
      const result = await executeBatchScan({
        clientIds: clientIds?.map(Number),
        includeDue: scanDue === true,
      });
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'Must provide clientId, clientIds, or scanDue=true' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Scan execution error:', error);
    return NextResponse.json(
      { error: 'Scan execution failed', details: String(error) },
      { status: 500 }
    );
  }
}
