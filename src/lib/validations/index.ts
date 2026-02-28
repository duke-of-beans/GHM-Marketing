import { z } from "zod";

// ============================================================================
// Auth
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["manager", "sales"]),
  territoryId: z.number().int().positive().nullable().optional(),
});

// ============================================================================
// Leads
// ============================================================================

export const createLeadSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  phone: z.string().min(1, "Phone number is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  leadSourceId: z.number().int().positive().optional(),
  territoryId: z.number().int().positive().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    "available",
    "scheduled",
    "contacted",
    "follow_up",
    "paperwork",
    "won",
    "lost_rejection",
    "lost_deferred",
  ]),
});

export const leadFilterSchema = z.object({
  status: z
    .enum([
      "available",
      "scheduled",
      "contacted",
      "follow_up",
      "paperwork",
      "won",
      "lost_rejection",
      "lost_deferred",
    ])
    .optional(),
  territoryId: z.coerce.number().int().positive().optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  sortBy: z
    .enum(["businessName", "createdAt", "updatedAt", "dealValueTotal", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// CSV Import
// ============================================================================

export const csvLeadRowSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  phone: z.string().min(1, "Phone is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
  website: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

// ============================================================================
// Notes
// ============================================================================

export const createNoteSchema = z.object({
  leadId: z.number().int().positive(),
  content: z.string().min(1, "Note content is required").max(5000),
});

// ============================================================================
// Territories
// ============================================================================

export const createTerritorySchema = z.object({
  name: z.string().min(1, "Territory name is required"),
  cities: z.array(z.string()).default([]),
  zipCodes: z.array(z.string()).default([]),
  states: z.array(z.string()).default([]),
});

// ============================================================================
// Deal Products
// ============================================================================

export const addDealProductSchema = z.object({
  leadId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  discountPercent: z.number().min(0).max(100).default(0),
});

// ============================================================================
// Type exports
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
export type CSVLeadRowInput = z.infer<typeof csvLeadRowSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTerritoryInput = z.infer<typeof createTerritorySchema>;
export type AddDealProductInput = z.infer<typeof addDealProductSchema>;
