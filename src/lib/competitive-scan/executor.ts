/**
 * Competitive Scan Executor
 * 
 * Orchestrates the entire competitive scan workflow:
 * 1. Fetch data (client + competitors)
 * 2. Calculate deltas (vs previous scan + vs competitors)
 * 3. Generate alerts (significant changes)
 * 4. Create tasks (actionable alerts)
 * 5. Calculate health score
 * 6. Save scan to database
 * 7. Update client profile
 */

import { prisma, Prisma } from '@/lib/db';
import { fetchScanData } from './data-fetcher';
import { calculateDeltas } from './delta-calculator';
import { generateAlerts } from './alert-generator';
import { createTasksFromAlerts } from './task-creator';
import { calculateHealthScore } from './health-score';

// ============================================================================
// Scan Execution
// ============================================================================

interface ExecuteScanParams {
  clientId: number;
  skipTaskCreation?: boolean;
}

interface ExecuteScanResult {
  success: boolean;
  scanId?: number;
  healthScore?: number;
  alertsGenerated?: number;
  tasksCreated?: number;
  errors: string[];
}

export async function executeScan(params: ExecuteScanParams): Promise<ExecuteScanResult> {
  const { clientId, skipTaskCreation = false } = params;
  const errors: string[] = [];
  
  try {
    // Step 1: Fetch fresh data
    console.log(`[Scan ${clientId}] Fetching data...`);
    const fetchResult = await fetchScanData({ clientId, includeCompetitors: true });
    
    if (fetchResult.errors.length > 0) {
      errors.push(...fetchResult.errors);
    }
    
    // Step 2: Calculate deltas
    console.log(`[Scan ${clientId}] Calculating deltas...`);
    const deltas = await calculateDeltas({
      clientId,
      currentClientData: fetchResult.clientData,
      currentCompetitors: fetchResult.competitors,
    });
    
    // Step 3: Generate alerts
    console.log(`[Scan ${clientId}] Generating alerts...`);
    const alerts = generateAlerts(deltas);
    
    // Step 4: Calculate health score
    console.log(`[Scan ${clientId}] Calculating health score...`);
    const healthScore = calculateHealthScore({
      clientData: fetchResult.clientData,
      deltas,
    });
    
    // Step 5: Save scan to database
    console.log(`[Scan ${clientId}] Saving scan...`);
    const scan = await prisma.competitiveScan.create({
      data: {
        clientId,
        clientData: fetchResult.clientData as unknown as Prisma.InputJsonValue,
        competitors: fetchResult.competitors as unknown as Prisma.InputJsonValue,
        deltas: deltas as unknown as Prisma.InputJsonValue,
        alerts: alerts as unknown as Prisma.InputJsonValue,
        healthScore,
        apiCosts: fetchResult.apiCosts as unknown as Prisma.InputJsonValue,
        status: 'complete',
      },
    });
    
    // Step 6: Create tasks from actionable alerts
    let tasksCreated = 0;
    if (!skipTaskCreation) {
      console.log(`[Scan ${clientId}] Creating tasks...`);
      const taskResult = await createTasksFromAlerts({
        clientId,
        scanId: scan.id,
        alerts,
      });
      
      tasksCreated = taskResult.created;
      if (taskResult.errors.length > 0) {
        errors.push(...taskResult.errors);
      }
    }
    
    // Step 7: Update client profile
    console.log(`[Scan ${clientId}] Updating client profile...`);
    const nextScanDate = await calculateNextScanDate(clientId);
    await prisma.clientProfile.update({
      where: { id: clientId },
      data: {
        healthScore,
        lastScanAt: new Date(),
        nextScanAt: nextScanDate,
      },
    });
    
    console.log(`[Scan ${clientId}] Complete! Health: ${healthScore}, Alerts: ${alerts.critical.length + alerts.warning.length + alerts.info.length}, Tasks: ${tasksCreated}`);
    
    return {
      success: true,
      scanId: scan.id,
      healthScore,
      alertsGenerated: alerts.critical.length + alerts.warning.length + alerts.info.length,
      tasksCreated,
      errors,
    };
    
  } catch (error) {
    console.error(`[Scan ${clientId}] Failed:`, error);
    errors.push(String(error));
    
    return {
      success: false,
      errors,
    };
  }
}


// ============================================================================
// Next Scan Scheduling
// ============================================================================

async function calculateNextScanDate(clientId: number): Promise<Date> {
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: { scanFrequency: true },
  });
  
  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }
  
  const now = new Date();
  const next = new Date(now);
  
  switch (client.scanFrequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 14); // Default to biweekly
  }
  
  return next;
}

// ============================================================================
// Batch Scan Execution
// ============================================================================

interface BatchScanParams {
  clientIds?: number[];
  includeDue?: boolean;
}


interface BatchScanResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: Array<{
    clientId: number;
    success: boolean;
    scanId?: number;
    errors: string[];
  }>;
}

export async function executeBatchScan(params: BatchScanParams = {}): Promise<BatchScanResult> {
  const { clientIds, includeDue = false } = params;
  
  // Determine which clients to scan
  let targetClientIds: number[] = [];
  
  if (clientIds && clientIds.length > 0) {
    // Scan specific clients
    targetClientIds = clientIds;
  } else if (includeDue) {
    // Scan all clients due for a scan
    const dueClients = await prisma.clientProfile.findMany({
      where: {
        status: 'active',
        OR: [
          { nextScanAt: null },
          { nextScanAt: { lte: new Date() } },
        ],
      },
      select: { id: true },
    });
    targetClientIds = dueClients.map(c => c.id);
  } else {
    throw new Error('Must provide either clientIds or set includeDue=true');
  }
  
  console.log(`[Batch Scan] Processing ${targetClientIds.length} clients...`);
  
  const results: BatchScanResult['results'] = [];
  let successful = 0;
  let failed = 0;
  
  // Execute scans sequentially to avoid API rate limits
  for (const clientId of targetClientIds) {
    const result = await executeScan({ clientId });
    
    results.push({
      clientId,
      success: result.success,
      scanId: result.scanId,
      errors: result.errors,
    });
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
    
    // Rate limiting pause between scans
    if (targetClientIds.indexOf(clientId) < targetClientIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
    }
  }
  
  console.log(`[Batch Scan] Complete: ${successful} successful, ${failed} failed`);
  
  return {
    totalProcessed: targetClientIds.length,
    successful,
    failed,
    results,
  };
}
