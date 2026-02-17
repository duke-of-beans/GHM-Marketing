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
}

export interface PaymentCalculationResult {
  shouldPay: boolean;
  amount: Decimal;
  reason: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OWNER_USER_ID = 1; // Gavin's user ID (assumes Gavin is ID 1)

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

  // Use override amount if present, otherwise use config
  const amount = override?.residualAmount ?? config.residualAmount;

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
  // Owner (Gavin) doesn't pay himself
  if (masterManagerId === OWNER_USER_ID) {
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
