/**
 * Competitive Scan Engine - Main Export
 * 
 * Complete competitive scanning system for GHM Dashboard.
 * Fetches metrics, calculates deltas, generates alerts, creates tasks, and updates health scores.
 */

// Core Modules
export { fetchScanData } from './data-fetcher';
export { calculateDeltas } from './delta-calculator';
export { generateAlerts } from './alert-generator';
export { createTasksFromAlerts } from './task-creator';
export { calculateHealthScore } from './health-score';
export { executeScan, executeBatchScan } from './executor';

// Type Re-exports
export type {
  ClientData,
  CompetitorData,
  Competitors,
  Deltas,
  Alert,
  Alerts,
  ApiCosts,
} from '@/types/competitive-scan';
