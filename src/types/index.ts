import { UserRole, LeadStatus, PricingModel } from "@prisma/client";

// ============================================================================
// NextAuth Type Augmentation
// ============================================================================

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    territoryId: number | null;
    territoryName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      territoryId: number | null;
      territoryName: string | null;
    };
  }
}

// JWT types are handled in auth callbacks (src/lib/auth/index.ts)

// ============================================================================
// Lead Types
// ============================================================================

export type LeadWithRelations = {
  id: number;
  businessName: string;
  website: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string;
  state: string;
  zipCode: string;
  status: LeadStatus;
  statusChangedAt: Date;
  domainRating: number | null;
  currentRank: number | null;
  reviewCount: number | null;
  reviewAvg: number | null;
  dealValueTotal: number;
  mrr: number;
  arr: number;
  ltvEstimated: number;
  createdAt: Date;
  updatedAt: Date;
  territory: { id: number; name: string } | null;
  assignedUser: { id: number; name: string } | null;
  leadSource: { id: number; name: string } | null;
  _count: {
    notes: number;
    workOrders: number;
  };
};

// ============================================================================
// Dashboard Types
// ============================================================================

export type FunnelStage = {
  status: LeadStatus;
  label: string;
  count: number;
  value: number;
  color: string;
};

export type DashboardMetrics = {
  totalLeads: number;
  activeLeads: number;
  wonDeals: number;
  totalMRR: number;
  totalARR: number;
  avgDealSize: number;
  conversionRate: number;
  avgSalesCycle: number; // days
};

export type RepSummary = {
  id: number;
  name: string;
  territoryName: string;
  leadsAssigned: number;
  leadsContacted: number;
  leadsWon: number;
  conversionRate: number;
  revenue: number;
  mrrAdded: number;
};

// ============================================================================
// API Response Types
// ============================================================================

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details?: Record<string, string[]>;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ============================================================================
// Import Types
// ============================================================================

export type CSVLeadRow = {
  business_name: string;
  phone: string;
  city: string;
  state: string;
  zip_code: string;
  website?: string;
  email?: string;
  address?: string;
};

export type ImportResult = {
  total: number;
  imported: number;
  failed: number;
  duplicates: number;
  errors: { row: number; message: string }[];
};

// ============================================================================
// Enrichment Types
// ============================================================================

export type EnrichmentData = {
  outscraper?: {
    name: string;
    reviews: number;
    reviewAvg: number;
    categories: string[];
  };
  ahrefs?: {
    domainRating: number;
    backlinks: number;
    organicKeywords: number;
    topKeywords: { keyword: string; position: number }[];
  };
  pageSpeed?: {
    mobile: number;
    desktop: number;
  };
};

// ============================================================================
// Product Types
// ============================================================================

export type ProductWithDealInfo = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  category: string | null;
  price: number;
  pricingModel: PricingModel;
  isActive: boolean;
  displayOrder: number;
};

// ============================================================================
// Constants
// ============================================================================

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bgColor: string; isTerminal: boolean; description: string }
> = {
  available: {
    label: "Available",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-500/15",
    isTerminal: false,
    description: "Unclaimed leads ready to be picked up. First come, first served — claim one to start your sales process.",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-500/15",
    isTerminal: false,
    description: "A meeting or call has been booked with this prospect. Show up prepared — this is your shot to pitch.",
  },
  contacted: {
    label: "Contacted",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-500/15",
    isTerminal: false,
    description: "You've had a first conversation. They're aware of the service but haven't committed. Stay warm.",
  },
  follow_up: {
    label: "Follow Up",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-500/15",
    isTerminal: false,
    description: "Active nurturing — proposal sent or in discussion. They're interested but need more touches to close.",
  },
  paperwork: {
    label: "Paperwork",
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-500/15",
    isTerminal: false,
    description: "Deal agreed verbally — contracts and agreements in progress. Nearly there, keep momentum.",
  },
  won: {
    label: "Won",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-500/15",
    isTerminal: true,
    description: "Deal closed. A client profile has been created and they're onboarded into the system.",
  },
  lost_rejection: {
    label: "Lost (Rejection)",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-500/15",
    isTerminal: true,
    description: "Prospect declined the service. Removed from active pipeline.",
  },
  lost_deferred: {
    label: "Lost (Deferred)",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-500/15",
    isTerminal: true,
    description: "Prospect interested but not ready now. Consider re-approaching in 3–6 months.",
  },
};

export const ACTIVE_STATUSES: LeadStatus[] = [
  "available",
  "scheduled",
  "contacted",
  "follow_up",
  "paperwork",
];

export const TERMINAL_STATUSES: LeadStatus[] = [
  "won",
  "lost_rejection",
  "lost_deferred",
];
