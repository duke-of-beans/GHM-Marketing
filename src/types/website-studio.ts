// ============================================================================
// WEBSITE STUDIO — TYPE DEFINITIONS
// ============================================================================
// Source of truth for all Website Studio entities.
// All API routes, db functions, and UI components reference these types.
// ============================================================================

// ── Enums ──────────────────────────────────────────────────────────────────

export type WebPropertyTier = "tier1" | "tier2" | "tier3";

export type BuildStage =
  | "scaffolded"   // Files created, content slots empty
  | "composing"    // Active content entry
  | "review"       // SCRVNR cleared, awaiting human review
  | "approved"     // Reviewer approved, ready to deploy
  | "live"         // Deployed to Vercel
  | "error";       // Deploy or DNS failure

export type ScrvnrGateStatus = "unprocessed" | "processing" | "cleared" | "failed" | "override";

export type DnaTokenSource = "machine" | "human" | "machine_overridden";

export type DnaTokenConfidence = "high" | "medium" | "low";

// ── Web Property ───────────────────────────────────────────────────────────

export type WebProperty = {
  id: number;
  clientId: number;
  slug: string;                    // e.g. "gad-bmw-t1" — used as Vercel project suffix
  tier: WebPropertyTier;
  brandSegment: string;            // e.g. "BMW", "Audi", "Quattro Authority"
  targetUrl: string;               // Final domain or subdomain
  vercelProjectId: string | null;  // ghm-{clientSlug}-{propertySlug}
  voiceProfileSlug: string | null; // Matches scrvnr/profiles/*.json filename stem
  deployStatus: BuildStage;
  lastDeployedAt: Date | null;
  dnsVerified: boolean;
  sslActive: boolean;
  sslExpiresAt: Date | null;
  stalenessThresholdDays: number;  // Default 90
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WebPropertyWithRelations = WebProperty & {
  dnaCapture: DnaCapture | null;
  buildJobs: BuildJob[];
  activeBuildJob: BuildJob | null;
};

// ── DNA Capture ────────────────────────────────────────────────────────────

export type DnaCapture = {
  id: number;
  propertyId: number;
  sourceUrl: string;
  capturedAt: Date;
  capturedBy: string | null;      // User name (may be "system")
  tokenBlob: DnaTokenBlob;        // Full extracted token JSON
  overrideCount: number;          // Denormalized for display
  isSuperseded: boolean;          // True if a newer capture exists
};

export type DnaTokenBlob = {
  colors: DnaColorPalette;
  typography: DnaTypography;
  spacing: DnaSpacing;
  components: DnaComponents;
  captureVersion: string;         // Internal version of extraction logic
};

export type DnaColorPalette = {
  primary: DnaToken<string>;
  secondary: DnaToken<string>;
  accent: DnaToken<string>;
  background: DnaToken<string>;
  text: DnaToken<string>;
  [key: string]: DnaToken<string>; // Additional named colors
};

export type DnaTypography = {
  headingFamily: DnaToken<string>;
  headingWeight: DnaToken<string>;
  bodyFamily: DnaToken<string>;
  bodyWeight: DnaToken<string>;
  headingCdnUrl: DnaToken<string | null>;
  bodyCdnUrl: DnaToken<string | null>;
};

export type DnaSpacing = {
  basePadding: DnaToken<string>;
  sectionPadding: DnaToken<string>;
  containerMaxWidth: DnaToken<string>;
};

export type DnaComponents = {
  headerHtml: DnaToken<string>;
  footerHtml: DnaToken<string>;
  primaryButtonStyle: DnaToken<string>;
  secondaryButtonStyle: DnaToken<string | null>;
};

export type DnaToken<T> = {
  key: string;                     // e.g. "colors.primary"
  value: T;
  source: DnaTokenSource;
  confidence: DnaTokenConfidence;
  isLocked: boolean;
  overrideCount: number;
  lastOverridedAt: Date | null;
};

// ── DNA Token Override ─────────────────────────────────────────────────────

export type DnaTokenOverride = {
  id: number;
  captureId: number;
  tokenKey: string;                // e.g. "colors.primary"
  originalValue: string;           // JSON-serialized original
  overrideValue: string;           // JSON-serialized new value
  note: string;                    // Required — human explains the change
  operatorName: string;
  createdAt: Date;
};

// ── Build Job ──────────────────────────────────────────────────────────────

export type BuildJob = {
  id: number;
  propertyId: number;
  stage: BuildStage;
  assignedTo: string | null;
  scaffoldManifest: ScaffoldManifest | null;
  pageCount: number;               // Total pages in this build
  pagesCleared: number;            // Pages that passed SCRVNR
  pagesApproved: number;           // Pages approved by reviewer
  deployAttempts: number;
  lastDeployError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BuildJobWithPages = BuildJob & {
  pages: ComposerPage[];
};

export type ScaffoldManifest = {
  files: ScaffoldFile[];
  vercelProject: string;
  voiceProfile: string;
  scrvnrGateActive: boolean;
};

export type ScaffoldFile = {
  path: string;
  description: string;
  isShared: boolean;               // Header/footer/CSS = shared across pages
};

// ── Composer Page ──────────────────────────────────────────────────────────

export type ComposerPage = {
  id: number;
  jobId: number;
  slug: string;                    // e.g. "common-problems"
  title: string;                   // e.g. "BMW Common Problems"
  filePath: string;                // Relative to scaffold root
  sections: PageSections;          // Current content state
  scrvnrStatus: ScrvnrGateStatus;
  lastScrvnrResult: ScrvnrResultSummary | null;
  reviewStatus: "pending" | "approved" | "changes_requested";
  reviewNote: string | null;
  pageOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PageSections = {
  [sectionName: string]: string;   // section slug → copy text
};

export type ScrvnrResultSummary = {
  pass1Score: number;
  pass1Pass: boolean;
  pass2Score: number | null;
  pass2Pass: boolean | null;
  overrideApplied: boolean;
  failedSections: string[];
  runAt: string;
};

// ── SCRVNR Gate Result ─────────────────────────────────────────────────────
// Full audit record stored per gate evaluation.

export type ScrvnrGateResult = {
  id: number;
  pageId: number;
  propertySlug: string;
  voiceProfileSlug: string | null;
  gateOpen: boolean;
  gateStatus: ScrvnrGateStatus;
  overrideApplied: boolean;
  overrideNote: string | null;
  pass1Score: number;
  pass1Pass: boolean;
  pass2Score: number | null;
  pass2Pass: boolean | null;
  sectionsEvaluated: string[];
  failedSections: string[];
  rawResult: object;               // Full SCRVNR adapter response
  evaluatedAt: Date;
};

// ── API Response Shapes ────────────────────────────────────────────────────

export type WebPropertySummary = {
  id: number;
  slug: string;
  tier: WebPropertyTier;
  brandSegment: string;
  targetUrl: string;
  deployStatus: BuildStage;
  lastDeployedAt: Date | null;
  dnsVerified: boolean;
  sslActive: boolean;
  isStale: boolean;                // Derived: lastDeployedAt > threshold
  activeBuildJobId: number | null;
  activeBuildStage: BuildStage | null;
  pagesTotal: number;
  pagesCleared: number;
  pagesApproved: number;
};

// Matrix view: clientId → brandSegment → tier → WebPropertySummary | null
export type WebPropertyMatrix = {
  [brandSegment: string]: {
    tier1: WebPropertySummary | null;
    tier2: WebPropertySummary | null;
    tier3: WebPropertySummary | null;
  };
};

// ── SCRVNR Adapter API Contract ────────────────────────────────────────────
// These match the Python adapter's return shape (website_studio_adapter.py).
// Used to type the JSON coming back from the SCRVNR API route.

export type ScrvnrAdapterResult = {
  gate_open: boolean;
  gate_status: "PASS" | "FAIL" | "OVERRIDE" | "ERROR";
  override_applied: boolean;
  override_note: string | null;
  profile_loaded: boolean;
  profile_id: string | null;
  brand: string | null;
  pass1_score: number;
  pass1_pass: boolean;
  pass2_score: number | null;
  pass2_pass: boolean | null;
  summary: string;
  action_required: string;
  sections: Record<string, ScrvnrSectionResult>;
  composer_feedback: ScrvnrComposerFeedback[];
  job_id: string | null;
  timestamp: string;
  error?: string;
};

export type ScrvnrSectionResult = {
  pass: boolean;
  pass1_score?: number;
  pass2_score?: number;
  pass1_failures?: string[];
  pass2_failures?: string[];
};

export type ScrvnrComposerFeedback = {
  section: string;
  pass: boolean;
  pass1_score: number | null;
  pass2_score: number | null;
  failures: string[];
};

// ── New Property Init ──────────────────────────────────────────────────────

export type NewPropertyConfig = {
  clientId: number;
  tier: WebPropertyTier;
  brandSegment: string;
  targetUrl: string;
  voiceProfileSlug: string | null;  // null = create new (Tier 3 always null)
  reuseExistingDna: boolean;
  assignedTo: string | null;
};

// ── Voice Profile Summary ──────────────────────────────────────────────────
// Returned by adapter.get_profile_summary() — used in DNA Lab and property panels.

export type VoiceProfileSummary = {
  loaded: boolean;
  property_slug: string;
  profile_id?: string;
  brand?: string;
  source_url?: string;
  capture_confidence?: string;
  source_word_count?: number;
  message?: string;
  dna?: {
    reading_level_grade: number | null;
    burstiness: number | null;
    contraction_rate: number | null;
    specificity: string | null;
    formality: number | null;
    warmth: number | null;
    primary_person: string | null;
    trust_pattern: string | null;
    native_constructions_count: number;
    negative_space_count: number;
  };
};
