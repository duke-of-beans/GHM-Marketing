/**
 * COMMISSION SYSTEM - PAYMENT CALCULATIONS
 * Core business logic for calculating commissions, residuals, and master fees
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// TYPES
// ============================================================================

export interface UserCompensationConfig {
  commissionEnabled: boolean;
  commissionAmount: Decimal;
  residualEnabled: boolean;
  residualAmount: Decimal;
  residualStartMonth: number;
  masterFeeEnabled: boolean;
  masterFeeAmount: Decimal;
}

export interface ClientCompensationOverride {
  commissionAmount?: Decimal | null;
  residualAmount?: Decimal | null;
}

export interface Client {
  id: number;
  onboardedMonth: Date | null;
  retainerAmount: Decimal;
  status: string;
  salesRepId: number | null;
  masterManagerId: number | null;
  // Phase A: lock-at-close fields
  lockedResidualAmount?: Decimal | null;
  closedInMonth?: Date | null;
}

// Tier config sourced from GlobalSettings
export interface ResidualTierConfig {
  tier1Amount: number;   // default $200
  tier2Amount: number;   // default $250
  tier3Amount: number;   // default $300
  tier2Threshold: number; // retainer >= this → tier 2 (default $3,000)
  tier3Threshold: number; // retainer >= this → tier 3 (default $4,000)
}

export const DEFAULT_TIER_CONFIG: ResidualTierConfig = {
  tier1Amount: 200,
  tier2Amount: 250,
  tier3Amount: 300,
  tier2Threshold: 3000,
  tier3Threshold: 4000,
};

/**
 * Calculate the tiered residual amount based on retainer value at close.
 * This is called once at lead → won and the result is locked on ClientProfile.
 */
export function calculateTieredResidual(
  retainerAmount: Decimal,
  tierConfig: ResidualTierConfig = DEFAULT_TIER_CONFIG
): Decimal {
  const retainer = retainerAmount.toNumber();
  if (retainer >= tierConfig.tier3Threshold) {
    return new Decimal(tierConfig.tier3Amount);
  }
  if (retainer >= tierConfig.tier2Threshold) {
    return new Decimal(tierConfig.tier2Amount);
  }
  return new Decimal(tierConfig.tier1Amount);
}

export interface PaymentCalculationResult {
  shouldPay: boolean;
  amount: Decimal;
  reason: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Owner user IDs - no self-payment for owners when assigned as master managers
// TODO: Verify these IDs match production database
// David Kirsch is primary owner, Gavin Kirsch may be secondary
const OWNER_USER_IDS = [1, 2]; // Update after verifying user IDs in production

// ============================================================================
// COMMISSION CALCULATIONS
// ============================================================================

/**
 * Calculate commission payment for a sales rep when client is onboarded
 */
export function calculateCommission(
  config: UserCompensationConfig,
  override: ClientCompensationOverride | null,
  client: Client
): PaymentCalculationResult {
  // Check if commission is enabled
  if (!config.commissionEnabled) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Commission disabled for this user"
    };
  }

  // Check if client is active
  if (client.status !== "active") {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: `Client status is ${client.status}, not active`
    };
  }

  // Use override amount if present, otherwise use config
  const amount = override?.commissionAmount ?? config.commissionAmount;

  return {
    shouldPay: true,
    amount,
    reason: "One-time commission at client onboarding"
  };
}

// ============================================================================
// RESIDUAL CALCULATIONS
// ============================================================================

/**
 * Calculate residual payment for a sales rep for a given month
 */
export function calculateResidual(
  config: UserCompensationConfig,
  override: ClientCompensationOverride | null,
  client: Client,
  currentMonth: Date
): PaymentCalculationResult {
  // Check if residual is enabled
  if (!config.residualEnabled) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Residual disabled for this user"
    };
  }

  // Check if client is active
  if (client.status !== "active") {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: `Client status is ${client.status}, not active`
    };
  }

  // Check if client has onboarded month
  if (!client.onboardedMonth) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Client onboarded month not set"
    };
  }

  // Calculate months since onboarding
  const monthsSinceOnboarding = getMonthsDifference(
    client.onboardedMonth,
    currentMonth
  );

  // Check if we're past the residual start month
  if (monthsSinceOnboarding < config.residualStartMonth) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: `Residual starts at month ${config.residualStartMonth}, currently at month ${monthsSinceOnboarding}`
    };
  }

  // Phase A: Use locked amount (set at close) > override > config default
  // Locked amount represents the tier rate frozen when the deal was won
  const amount = client.lockedResidualAmount
    ?? override?.residualAmount
    ?? config.residualAmount;

  return {
    shouldPay: true,
    amount,
    reason: `Residual payment for month ${monthsSinceOnboarding} since onboarding`
  };
}

// ============================================================================
// MASTER FEE CALCULATIONS
// ============================================================================

/**
 * Calculate master manager fee for a given month
 */
export function calculateMasterFee(
  config: UserCompensationConfig,
  client: Client,
  currentMonth: Date,
  masterManagerId: number
): PaymentCalculationResult {
  // Owners (Gavin & David) don't pay themselves
  if (OWNER_USER_IDS.includes(masterManagerId)) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Owner doesn't pay self (counts as profit)"
    };
  }

  // Check if master fee is enabled
  if (!config.masterFeeEnabled) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Master fee disabled for this user"
    };
  }

  // Check if client is active
  if (client.status !== "active") {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: `Client status is ${client.status}, not active`
    };
  }

  // Check if client has onboarded month
  if (!client.onboardedMonth) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Client onboarded month not set"
    };
  }

  // Master fee starts Month 1 (immediately after onboarding)
  const monthsSinceOnboarding = getMonthsDifference(
    client.onboardedMonth,
    currentMonth
  );

  if (monthsSinceOnboarding < 1) {
    return {
      shouldPay: false,
      amount: new Decimal(0),
      reason: "Master fee starts in Month 1"
    };
  }

  return {
    shouldPay: true,
    amount: config.masterFeeAmount,
    reason: `Master manager fee for month ${monthsSinceOnboarding} since onboarding`
  };
}

// ============================================================================
// MONTHLY PAYMENT GENERATION
// ============================================================================

export interface PaymentToGenerate {
  clientId: number;
  userId: number;
  type: "commission" | "residual" | "master_fee";
  amount: Decimal;
  month: Date;
  notes: string;
}

/**
 * Generate all payments for a specific client for the current month
 */
export function generateClientMonthlyPayments(
  client: Client,
  salesRepConfig: UserCompensationConfig | null,
  salesRepOverride: ClientCompensationOverride | null,
  masterConfig: UserCompensationConfig | null,
  currentMonth: Date,
  isNewClient: boolean = false
): PaymentToGenerate[] {
  const payments: PaymentToGenerate[] = [];

  // Generate commission if client just onboarded
  if (isNewClient && client.salesRepId && salesRepConfig) {
    const commission = calculateCommission(salesRepConfig, salesRepOverride, client);
    if (commission.shouldPay) {
      payments.push({
        clientId: client.id,
        userId: client.salesRepId,
        type: "commission",
        amount: commission.amount,
        month: currentMonth,
        notes: commission.reason
      });
    }
  }

  // Generate residual for sales rep
  if (client.salesRepId && salesRepConfig) {
    const residual = calculateResidual(
      salesRepConfig,
      salesRepOverride,
      client,
      currentMonth
    );
    if (residual.shouldPay) {
      payments.push({
        clientId: client.id,
        userId: client.salesRepId,
        type: "residual",
        amount: residual.amount,
        month: currentMonth,
        notes: residual.reason
      });
    }
  }

  // Generate master fee
  if (client.masterManagerId && masterConfig) {
    const masterFee = calculateMasterFee(
      masterConfig,
      client,
      currentMonth,
      client.masterManagerId
    );
    if (masterFee.shouldPay) {
      payments.push({
        clientId: client.id,
        userId: client.masterManagerId,
        type: "master_fee",
        amount: masterFee.amount,
        month: currentMonth,
        notes: masterFee.reason
      });
    }
  }

  return payments;
}

// ============================================================================
// PROFIT CALCULATIONS (FOR GAVIN'S DASHBOARD)
// ============================================================================

export interface ProfitBreakdown {
  totalRevenue: Decimal;
  totalCommissions: Decimal;
  totalResiduals: Decimal;
  totalMasterFees: Decimal;
  totalExpenses: Decimal;
  netProfit: Decimal;
  profitMargin: number;
}

/**
 * Calculate company profit for a given month
 */
export function calculateMonthlyProfit(
  clients: Client[],
  payments: PaymentToGenerate[]
): ProfitBreakdown {
  // Calculate total revenue from active clients
  const totalRevenue = clients
    .filter(c => c.status === "active")
    .reduce((sum, c) => sum.plus(c.retainerAmount), new Decimal(0));

  // Calculate expenses by type
  const totalCommissions = payments
    .filter(p => p.type === "commission")
    .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

  const totalResiduals = payments
    .filter(p => p.type === "residual")
    .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

  const totalMasterFees = payments
    .filter(p => p.type === "master_fee")
    .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

  const totalExpenses = totalCommissions
    .plus(totalResiduals)
    .plus(totalMasterFees);

  const netProfit = totalRevenue.minus(totalExpenses);
  
  const profitMargin = totalRevenue.isZero()
    ? 0
    : netProfit.div(totalRevenue).times(100).toNumber();

  return {
    totalRevenue,
    totalCommissions,
    totalResiduals,
    totalMasterFees,
    totalExpenses,
    netProfit,
    profitMargin
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the number of months between two dates
 * Returns 1 for first month, 2 for second month, etc.
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  
  return yearDiff * 12 + monthDiff + 1; // +1 because we count the first month as Month 1
}

/**
 * Get the first day of the current month
 */
export function getFirstDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the current month
 */
export function getLastDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Format month for database (YYYY-MM-01)
 */
export function formatMonthForDb(date: Date): Date {
  return getFirstDayOfMonth(date);
}

// ============================================================================
// PHASE A: UPSELL COMMISSION (A5/A6)
// ============================================================================

/**
 * Calculate upsell commission when a DealProduct is added to an active client.
 * Rate sourced from GlobalSettings.upsellCommissionRate (default 10%).
 */
export function calculateUpsellCommission(
  productFinalPrice: Decimal,
  upsellCommissionRate: number = 0.10
): Decimal {
  return productFinalPrice.times(new Decimal(upsellCommissionRate)).toDecimalPlaces(2);
}

export interface UpsellCommissionResult {
  shouldPay: boolean;
  amount: Decimal;
  reason: string;
}

/**
 * Determine whether an upsell commission should be generated for a sales rep
 * when a DealProduct is added to a ClientProfile.
 */
export function evaluateUpsellCommission(
  salesRepId: number | null,
  productFinalPrice: Decimal,
  clientStatus: string,
  upsellCommissionRate: number = 0.10
): UpsellCommissionResult {
  if (!salesRepId) {
    return { shouldPay: false, amount: new Decimal(0), reason: "No sales rep assigned to client" };
  }
  if (clientStatus !== "active") {
    return { shouldPay: false, amount: new Decimal(0), reason: `Client not active (status: ${clientStatus})` };
  }
  if (productFinalPrice.lessThanOrEqualTo(0)) {
    return { shouldPay: false, amount: new Decimal(0), reason: "Product price is zero" };
  }

  const amount = calculateUpsellCommission(productFinalPrice, upsellCommissionRate);
  return {
    shouldPay: true,
    amount,
    reason: `Upsell commission at ${(upsellCommissionRate * 100).toFixed(0)}% of $${productFinalPrice.toFixed(2)}`,
  };
}

// ============================================================================
// PHASE A: ROLLING 90-DAY CLOSE RATE (A7)
// ============================================================================

export interface CloseRateResult {
  userId: number;
  periodStart: Date;
  periodEnd: Date;
  totalLeads: number;   // leads moved to any terminal stage (won + lost)
  wonLeads: number;
  closeRate: number;    // 0-100 percent
}

/**
 * Calculate rolling 90-day close rate for a sales rep.
 * "Closed" = moved to won OR lost_rejection OR lost_deferred in the last 90 days.
 * Close rate = won / (won + lost) * 100
 */
export async function calculateRolling90DayCloseRate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: { leadHistory: { findMany: (args: any) => Promise<Array<{ leadId: number; newStatus: string }>> } },
  userId: number,
  asOf: Date = new Date()
): Promise<CloseRateResult> {
  const periodEnd = new Date(asOf);
  const periodStart = new Date(asOf);
  periodStart.setDate(periodStart.getDate() - 90);

  const terminalStatuses = ["won", "lost_rejection", "lost_deferred"];

  const history = await prismaClient.leadHistory.findMany({
    where: {
      userId,
      newStatus: { in: terminalStatuses },
      changedAt: { gte: periodStart, lte: periodEnd },
    },
    select: { leadId: true, newStatus: true },
  });

  // Deduplicate by leadId — use last terminal status per lead
  const leadMap = new Map<number, string>();
  for (const h of history) {
    leadMap.set(h.leadId, h.newStatus);
  }

  const totalLeads = leadMap.size;
  const wonLeads = Array.from(leadMap.values()).filter(s => s === "won").length;
  const closeRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return { userId, periodStart, periodEnd, totalLeads, wonLeads, closeRate };
}
