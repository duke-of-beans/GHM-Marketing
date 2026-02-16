/**
 * API Route: GET /api/clients/[id]/scans
 * 
 * Fetch competitive scan history for a client.
 * Returns scans ordered by date (newest first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const clientId = parseInt(params.id);
    
    // Fetch scan history
    const scans = await prisma.competitiveScan.findMany({
      where: { clientId },
      orderBy: { scanDate: 'desc' },
      take: 20, // Last 20 scans
      select: {
        id: true,
        scanDate: true,
        healthScore: true,
        alerts: true,
        deltas: true,
        clientData: true,
        apiCosts: true,
        status: true,
      },
    });
    
    return NextResponse.json(scans);
    
  } catch (error) {
    console.error('Fetch scans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    );
  }
}
