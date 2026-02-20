/**
 * Onboarding Portal — Shared Types
 * Used by API routes (server) and wizard UI (client).
 * Keep in sync with schema.prisma OnboardingSubmission model.
 */

// ── Step 1: Business Identity ─────────────────────────────────────────────────

export interface Step1Data {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  businessDescription?: string;
  primaryServices?: string[];
  serviceAreas?: string;
  multiLocation: boolean;
  locationCount?: number;
}

// ── Step 2: Contacts ──────────────────────────────────────────────────────────

export interface Step2Data {
  primaryContactName: string;
  primaryContactTitle?: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  preferredContactMethod?: "email" | "phone" | "text";
  billingSameAsPrimary: boolean;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  paymentMethod?: "ach" | "credit_card" | "check";
  requiresPO: boolean;
  poNumber?: string;
}

// ── Step 3: Technical Access ──────────────────────────────────────────────────

export type AccessMethod = "invite" | "credentials" | "help" | "not_now" | "setup";
export type AccessStatus = "provided" | "pending" | "help_needed" | "not_applicable";

export interface TechnicalAccess {
  dns: {
    provider?: string;
    method: AccessMethod;
    status: AccessStatus;
  };
  gbp: {
    hasProfile: boolean | null;
    method?: AccessMethod;
    status: AccessStatus;
  };
  analytics: {
    hasGA4: boolean | null;
    method?: AccessMethod;
    status: AccessStatus;
  };
  searchConsole: {
    hasIt: boolean | null;
    method?: AccessMethod;
    status: AccessStatus;
  };
  cms: {
    platform?: string;
    method?: AccessMethod;
    status: AccessStatus;
  };
  adAccounts: {
    googleAds: boolean;
    meta: boolean;
    other?: string;
    method?: AccessMethod;
    status: AccessStatus;
  };
}

export interface Step3Data {
  technicalAccess: TechnicalAccess;
}

// ── Step 4: Competitive Landscape + Content Preferences ───────────────────────

export interface Step4Data {
  competitors?: string[];
  competitorPains?: string[];
  competitorNotes?: string;
  contentFocusTopics?: string;
  contentAvoidTopics?: string;
  tonePreference?: "professional" | "friendly" | "authoritative" | "casual" | "match_existing" | "no_preference";
  contentReviewPref?: "publish_and_notify" | "review_before_publish";
}

// ── Step 5: Brand + Online Presence (optional) ────────────────────────────────

export interface Step5Data {
  hasLogo?: boolean;
  hasBrandGuidelines?: boolean;
  hasPhotography?: boolean;
  socialProfiles?: string[];
  directoryListings?: string;
  previousSEO?: boolean;
  previousSEONotes?: string;
  additionalNotes?: string;
}

// ── Final Submission ──────────────────────────────────────────────────────────

export interface OnboardingFinalData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5?: Step5Data;
}

// ── Ops Checklist ─────────────────────────────────────────────────────────────

export interface ChecklistItem {
  done: boolean;
  date: string | null;
  notes: string;
  completedBy?: number | null;
}

export interface OpsChecklist {
  dnsReceived: ChecklistItem;
  gbpReceived: ChecklistItem;
  analyticsReceived: ChecklistItem;
  searchConsoleReceived: ChecklistItem;
  cmsReceived: ChecklistItem;
  napVerified: ChecklistItem;
  competitiveAuditInitiated: ChecklistItem;
  firstWorkOrderGenerated: ChecklistItem;
  onboardingComplete: ChecklistItem;
  firstInvoiceIssued: ChecklistItem;
}

export const DEFAULT_OPS_CHECKLIST: OpsChecklist = {
  dnsReceived: { done: false, date: null, notes: "" },
  gbpReceived: { done: false, date: null, notes: "" },
  analyticsReceived: { done: false, date: null, notes: "" },
  searchConsoleReceived: { done: false, date: null, notes: "" },
  cmsReceived: { done: false, date: null, notes: "" },
  napVerified: { done: false, date: null, notes: "" },
  competitiveAuditInitiated: { done: false, date: null, notes: "" },
  firstWorkOrderGenerated: { done: false, date: null, notes: "" },
  onboardingComplete: { done: false, date: null, notes: "", completedBy: null },
  firstInvoiceIssued: { done: false, date: null, notes: "" },
};

// ── Token API Response ─────────────────────────────────────────────────────────

export interface OnboardingTokenResponse {
  lead: {
    id: number;
    businessName: string;
    address: string | null;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    website: string | null;
    email: string | null;
  };
  token: {
    id: number;
    status: string;
    currentStep: number;
    expiresAt: string;
  };
  formData: Record<string, unknown> | null;
  partnerName: string;
}

// ── DNS Provider Options ───────────────────────────────────────────────────────

export const DNS_PROVIDERS = [
  "GoDaddy",
  "Namecheap",
  "Cloudflare",
  "Google Domains",
  "My web host",
  "Other",
  "I don't know",
] as const;

export const CMS_PLATFORMS = [
  "WordPress",
  "Squarespace",
  "Wix",
  "Shopify",
  "Webflow",
  "Custom",
  "Other",
  "Not sure",
] as const;

// ── Competitor Pain Options ────────────────────────────────────────────────────

export const COMPETITOR_PAINS = [
  "They show up higher in Google searches",
  "Their website looks more professional",
  "They have more/better reviews",
  "They show up in the map pack, I don't",
  "They seem to be everywhere online",
  "Their ads keep showing up",
] as const;
