-- CreateEnum
CREATE TYPE "VaultSpace" AS ENUM ('shared', 'private', 'client_reports', 'signed_contracts');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'admin';

-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "churn_reason" TEXT,
ADD COLUMN     "churned_at" TIMESTAMP(3),
ADD COLUMN     "closed_in_month" DATE,
ADD COLUMN     "invoice_day" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "last_invoice_date" TIMESTAMP(3),
ADD COLUMN     "last_payment_date" TIMESTAMP(3),
ADD COLUMN     "locked_residual_amount" DECIMAL(10,2),
ADD COLUMN     "master_manager_id" INTEGER,
ADD COLUMN     "onboarded_month" DATE,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'current',
ADD COLUMN     "payment_terms_days" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "sales_rep_id" INTEGER,
ADD COLUMN     "wave_customer_id" TEXT;

-- AlterTable
ALTER TABLE "client_tasks" ADD COLUMN     "assigned_by_user_id" INTEGER,
ADD COLUMN     "assigned_to_user_id" INTEGER,
ADD COLUMN     "blocked_reason" TEXT,
ADD COLUMN     "checklist_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "estimated_minutes" INTEGER,
ADD COLUMN     "recurring_rule_id" INTEGER,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source_alert_id" INTEGER,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "contractor_email" TEXT,
ADD COLUMN     "contractor_entity_name" TEXT,
ADD COLUMN     "contractor_vendor_id" TEXT,
ADD COLUMN     "dashboard_layout" JSONB,
ADD COLUMN     "permission_preset" TEXT NOT NULL DEFAULT 'sales_basic',
ADD COLUMN     "permissions" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "position_id" INTEGER,
ADD COLUMN     "rep_onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN     "rep_onboarding_step" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "compensation_type" TEXT NOT NULL,
    "default_amount" DECIMAL(10,2),
    "default_frequency" TEXT,
    "dashboard_access_level" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_transitions" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "user_id" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upsell_opportunities" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "scan_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'detected',
    "opportunity_score" INTEGER NOT NULL,
    "gap_category" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "projected_mrr" DECIMAL(10,2) NOT NULL,
    "projected_roi" DECIMAL(5,2),
    "presented_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "response" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upsell_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_compensation_config" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "commission_enabled" BOOLEAN NOT NULL DEFAULT true,
    "commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 1000,
    "residual_enabled" BOOLEAN NOT NULL DEFAULT true,
    "residual_amount" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "residual_start_month" INTEGER NOT NULL DEFAULT 2,
    "master_fee_enabled" BOOLEAN NOT NULL DEFAULT false,
    "master_fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 240,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_compensation_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_compensation_overrides" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "commission_amount" DECIMAL(10,2),
    "residual_amount" DECIMAL(10,2),
    "fee_amount" DECIMAL(10,2),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_compensation_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "month" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "wave_invoice_id" TEXT,
    "wave_bill_id" TEXT,
    "wave_customer_id" TEXT,
    "wave_payment_id" TEXT,
    "payment_method" TEXT,
    "processing_fee" DECIMAL(10,2),
    "source_event_id" TEXT,
    "is_historical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_content" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "content_type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_for" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "metadata" JSONB,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_profiles" (
    "id" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "tonality" TEXT NOT NULL,
    "vocabulary" TEXT[],
    "sentenceStructure" TEXT NOT NULL,
    "formality" INTEGER NOT NULL,
    "enthusiasm" INTEGER NOT NULL,
    "technicality" INTEGER NOT NULL,
    "brevity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "metadata" JSONB,
    "change_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_reports" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_email" TEXT,
    "user_name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'bug',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'new',
    "page_url" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "screen_resolution" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "browser_info" JSONB,
    "console_errors" JSONB,
    "network_errors" JSONB,
    "recent_actions" JSONB,
    "session_data" JSONB,
    "assigned_to" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'high',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" INTEGER,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" SERIAL NOT NULL,
    "default_commission" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "default_residual" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "master_manager_fee" DOUBLE PRECISION NOT NULL DEFAULT 240,
    "upsell_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "residual_tier1_amount" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "residual_tier2_amount" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "residual_tier3_amount" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "residual_tier2_threshold" DOUBLE PRECISION NOT NULL DEFAULT 3000,
    "residual_tier3_threshold" DOUBLE PRECISION NOT NULL DEFAULT 4000,
    "content_studio_enabled" BOOLEAN NOT NULL DEFAULT true,
    "scanning_enabled" BOOLEAN NOT NULL DEFAULT true,
    "voice_capture_enabled" BOOLEAN NOT NULL DEFAULT true,
    "bug_reporting_enabled" BOOLEAN NOT NULL DEFAULT true,
    "scan_frequency_days" INTEGER NOT NULL DEFAULT 30,
    "scan_cost_limit" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "task_assignment_alerts" BOOLEAN NOT NULL DEFAULT true,
    "scan_complete_alerts" BOOLEAN NOT NULL DEFAULT true,
    "push_messages_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_tasks_enabled" BOOLEAN NOT NULL DEFAULT true,
    "openai_api_key" TEXT,
    "google_api_key" TEXT,
    "semrush_api_key" TEXT,
    "ahrefs_api_key" TEXT,
    "default_theme" TEXT NOT NULL DEFAULT 'light',
    "goals_enabled" BOOLEAN NOT NULL DEFAULT false,
    "monthly_deal_target" INTEGER,
    "monthly_revenue_target" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "permission" TEXT,
    "method" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" TEXT NOT NULL,
    "status_code" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,
    "duration" INTEGER,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "audience_type" TEXT NOT NULL DEFAULT 'all',
    "audience_value" TEXT,
    "parent_id" INTEGER,
    "recipient_id" INTEGER,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "attachment_url" TEXT,
    "attachment_name" TEXT,
    "attachment_size" INTEGER,
    "attachment_mime_type" TEXT,
    "attachment_vault_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_message_reads" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_properties" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "brand_segment" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "vercel_project_id" TEXT,
    "voice_profile_slug" TEXT,
    "deploy_status" TEXT NOT NULL DEFAULT 'scaffolded',
    "last_deployed_at" TIMESTAMP(3),
    "dns_verified" BOOLEAN NOT NULL DEFAULT false,
    "ssl_active" BOOLEAN NOT NULL DEFAULT false,
    "ssl_expires_at" TIMESTAMP(3),
    "staleness_threshold_days" INTEGER NOT NULL DEFAULT 90,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dna_captures" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "source_url" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_by" TEXT,
    "token_blob" JSONB NOT NULL,
    "override_count" INTEGER NOT NULL DEFAULT 0,
    "is_superseded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dna_captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dna_token_overrides" (
    "id" SERIAL NOT NULL,
    "capture_id" INTEGER NOT NULL,
    "token_key" TEXT NOT NULL,
    "original_value" TEXT NOT NULL,
    "override_value" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dna_token_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_jobs" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'scaffolded',
    "assigned_to" TEXT,
    "scaffold_manifest" JSONB,
    "page_count" INTEGER NOT NULL DEFAULT 0,
    "pages_cleared" INTEGER NOT NULL DEFAULT 0,
    "pages_approved" INTEGER NOT NULL DEFAULT 0,
    "deploy_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_deploy_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "composer_pages" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '{}',
    "scrvnr_status" TEXT NOT NULL DEFAULT 'unprocessed',
    "last_scrvnr_result" JSONB,
    "review_status" TEXT NOT NULL DEFAULT 'pending',
    "review_note" TEXT,
    "page_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "composer_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrvnr_gate_results" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "property_slug" TEXT NOT NULL,
    "voice_profile_slug" TEXT,
    "gate_open" BOOLEAN NOT NULL,
    "gate_status" TEXT NOT NULL,
    "override_applied" BOOLEAN NOT NULL DEFAULT false,
    "override_note" TEXT,
    "pass1_score" DOUBLE PRECISION NOT NULL,
    "pass1_pass" BOOLEAN NOT NULL,
    "pass2_score" DOUBLE PRECISION,
    "pass2_pass" BOOLEAN,
    "sections_evaluated" TEXT[],
    "failed_sections" TEXT[],
    "raw_result" JSONB NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrvnr_gate_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "generated_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "form_data" JSONB,
    "completed_at" TIMESTAMP(3),
    "submitted_data" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_accessed_at" TIMESTAMP(3),
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_submissions" (
    "id" SERIAL NOT NULL,
    "token_id" INTEGER NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "business_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "business_description" TEXT,
    "primary_services" JSONB,
    "service_areas" TEXT,
    "multi_location" BOOLEAN NOT NULL DEFAULT false,
    "location_count" INTEGER,
    "primary_contact_name" TEXT NOT NULL,
    "primary_contact_title" TEXT,
    "primary_contact_email" TEXT NOT NULL,
    "primary_contact_phone" TEXT NOT NULL,
    "preferred_contact_method" TEXT,
    "billing_same_as_primary" BOOLEAN NOT NULL DEFAULT true,
    "billing_contact_name" TEXT,
    "billing_contact_email" TEXT,
    "billing_contact_phone" TEXT,
    "payment_method" TEXT,
    "requires_po" BOOLEAN NOT NULL DEFAULT false,
    "po_number" TEXT,
    "technical_access" JSONB NOT NULL,
    "competitors" JSONB,
    "competitor_pains" JSONB,
    "competitor_notes" TEXT,
    "content_focus_topics" TEXT,
    "content_avoid_topics" TEXT,
    "tone_preference" TEXT,
    "content_review_pref" TEXT,
    "has_logo" BOOLEAN NOT NULL DEFAULT false,
    "has_brand_guidelines" BOOLEAN NOT NULL DEFAULT false,
    "has_photography" BOOLEAN NOT NULL DEFAULT false,
    "social_profiles" JSONB,
    "directory_listings" TEXT,
    "previous_seo" BOOLEAN NOT NULL DEFAULT false,
    "previous_seo_notes" TEXT,
    "additional_notes" TEXT,
    "ops_checklist" JSONB,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "onboarded_at" TIMESTAMP(3),
    "onboarded_by" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_cost_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feature" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "model_id" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_usd" DOUBLE PRECISION NOT NULL,
    "estimated_cost_usd" DOUBLE PRECISION,
    "latency_ms" INTEGER NOT NULL,
    "quality_score" DOUBLE PRECISION,

    CONSTRAINT "ai_cost_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_records" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "wave_invoice_id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issued_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "paid_amount" DECIMAL(10,2),
    "payment_method" TEXT,
    "wave_view_url" TEXT,
    "line_items" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "enrichment_cache" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cost_usd" DECIMAL(10,6),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrichment_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_cost_logs" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "client_id" INTEGER,
    "cache_hit" BOOLEAN NOT NULL DEFAULT false,
    "cost_usd" DECIMAL(10,6) NOT NULL,
    "latency_ms" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_cost_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_trackers" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "keyword" TEXT NOT NULL,
    "search_volume" INTEGER,
    "difficulty" INTEGER,
    "target_url" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_snapshots" (
    "id" SERIAL NOT NULL,
    "keyword_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "scan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organic_position" INTEGER,
    "local_pack_position" INTEGER,
    "ranking_url" TEXT,
    "local_pack_business" TEXT,
    "serp_features" JSONB,
    "zip_code" TEXT NOT NULL,
    "previous_organic" INTEGER,
    "previous_local_pack" INTEGER,

    CONSTRAINT "rank_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_rank_tasks" (
    "id" SERIAL NOT NULL,
    "task_id" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "keyword_id" INTEGER NOT NULL,
    "zip_code" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "pending_rank_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citation_scans" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "scan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_checked" INTEGER NOT NULL,
    "matches" INTEGER NOT NULL,
    "mismatches" INTEGER NOT NULL,
    "missing" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "health_score" INTEGER NOT NULL,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citation_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directory_health" (
    "id" SERIAL NOT NULL,
    "directory_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "last_success" TIMESTAMP(3),
    "last_failure" TIMESTAMP(3),
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "is_degraded" BOOLEAN NOT NULL DEFAULT false,
    "last_checked_at" TIMESTAMP(3),

    CONSTRAINT "directory_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_ads_connections" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "google_email" TEXT NOT NULL,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sync_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "google_ads_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gbp_connections" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "account_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "google_email" TEXT NOT NULL,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sync_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gbp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_files" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "blob_url" TEXT NOT NULL,
    "space" "VaultSpace" NOT NULL,
    "category" TEXT,
    "uploaded_by" INTEGER NOT NULL,
    "owner_id" INTEGER,
    "client_id" INTEGER,
    "lead_id" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "superseded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vault_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_audits" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "generated_by" INTEGER NOT NULL,
    "rep_name" TEXT,
    "health_score" INTEGER,
    "gap_count" INTEGER,
    "share_token" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_demos" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "generated_by" INTEGER NOT NULL,
    "rep_name" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_demos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'onboarding',
    "priority" TEXT NOT NULL DEFAULT 'P2',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to_id" INTEGER,
    "created_by_id" INTEGER,
    "subject_user_id" INTEGER,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_type" TEXT NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_config" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_create_task" BOOLEAN NOT NULL DEFAULT false,
    "task_template" JSONB,
    "notify_on_trigger" BOOLEAN NOT NULL DEFAULT true,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 1440,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "client_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source_type" TEXT NOT NULL,
    "source_id" INTEGER,
    "metadata" JSONB,
    "rule_id" INTEGER,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" INTEGER,
    "acknowledged_at" TIMESTAMP(3),
    "auto_task_created" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "alert_id" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_alert_links" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "alert_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_alert_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source_status" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "last_check_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "avg_latency_ms" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_source_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_checklist_items" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_checklist_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_task_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" INTEGER,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'P3',
    "checklist_template_id" INTEGER,
    "cron_expression" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_task_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- CreateIndex
CREATE INDEX "task_transitions_task_id_idx" ON "task_transitions"("task_id");

-- CreateIndex
CREATE INDEX "task_transitions_user_id_idx" ON "task_transitions"("user_id");

-- CreateIndex
CREATE INDEX "task_transitions_created_at_idx" ON "task_transitions"("created_at");

-- CreateIndex
CREATE INDEX "upsell_opportunities_client_id_status_idx" ON "upsell_opportunities"("client_id", "status");

-- CreateIndex
CREATE INDEX "upsell_opportunities_status_idx" ON "upsell_opportunities"("status");

-- CreateIndex
CREATE INDEX "upsell_opportunities_opportunity_score_idx" ON "upsell_opportunities"("opportunity_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_compensation_config_user_id_key" ON "user_compensation_config"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_compensation_overrides_client_id_user_id_key" ON "client_compensation_overrides"("client_id", "user_id");

-- CreateIndex
CREATE INDEX "payment_transactions_user_id_month_idx" ON "payment_transactions"("user_id", "month");

-- CreateIndex
CREATE INDEX "payment_transactions_client_id_month_idx" ON "payment_transactions"("client_id", "month");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "client_content_client_id_status_idx" ON "client_content"("client_id", "status");

-- CreateIndex
CREATE INDEX "client_content_client_id_content_type_idx" ON "client_content"("client_id", "content_type");

-- CreateIndex
CREATE INDEX "client_content_scheduled_for_idx" ON "client_content"("scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "voice_profiles_client_id_key" ON "voice_profiles"("client_id");

-- CreateIndex
CREATE INDEX "content_versions_content_id_version_number_idx" ON "content_versions"("content_id", "version_number");

-- CreateIndex
CREATE INDEX "bug_reports_status_priority_idx" ON "bug_reports"("status", "priority");

-- CreateIndex
CREATE INDEX "bug_reports_category_idx" ON "bug_reports"("category");

-- CreateIndex
CREATE INDEX "bug_reports_assigned_to_idx" ON "bug_reports"("assigned_to");

-- CreateIndex
CREATE INDEX "bug_reports_created_at_idx" ON "bug_reports"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "team_messages_author_id_idx" ON "team_messages"("author_id");

-- CreateIndex
CREATE INDEX "team_messages_recipient_id_idx" ON "team_messages"("recipient_id");

-- CreateIndex
CREATE INDEX "team_messages_parent_id_idx" ON "team_messages"("parent_id");

-- CreateIndex
CREATE INDEX "team_messages_created_at_idx" ON "team_messages"("created_at");

-- CreateIndex
CREATE INDEX "team_message_reads_user_id_idx" ON "team_message_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_message_reads_message_id_user_id_key" ON "team_message_reads"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE INDEX "web_properties_client_id_idx" ON "web_properties"("client_id");

-- CreateIndex
CREATE INDEX "web_properties_client_id_brand_segment_idx" ON "web_properties"("client_id", "brand_segment");

-- CreateIndex
CREATE INDEX "web_properties_deploy_status_idx" ON "web_properties"("deploy_status");

-- CreateIndex
CREATE UNIQUE INDEX "web_properties_client_id_slug_key" ON "web_properties"("client_id", "slug");

-- CreateIndex
CREATE INDEX "dna_captures_property_id_idx" ON "dna_captures"("property_id");

-- CreateIndex
CREATE INDEX "dna_captures_property_id_is_superseded_idx" ON "dna_captures"("property_id", "is_superseded");

-- CreateIndex
CREATE INDEX "dna_token_overrides_capture_id_idx" ON "dna_token_overrides"("capture_id");

-- CreateIndex
CREATE INDEX "dna_token_overrides_capture_id_token_key_idx" ON "dna_token_overrides"("capture_id", "token_key");

-- CreateIndex
CREATE INDEX "build_jobs_property_id_idx" ON "build_jobs"("property_id");

-- CreateIndex
CREATE INDEX "build_jobs_property_id_stage_idx" ON "build_jobs"("property_id", "stage");

-- CreateIndex
CREATE INDEX "composer_pages_job_id_idx" ON "composer_pages"("job_id");

-- CreateIndex
CREATE INDEX "composer_pages_job_id_scrvnr_status_idx" ON "composer_pages"("job_id", "scrvnr_status");

-- CreateIndex
CREATE INDEX "composer_pages_job_id_review_status_idx" ON "composer_pages"("job_id", "review_status");

-- CreateIndex
CREATE INDEX "scrvnr_gate_results_page_id_idx" ON "scrvnr_gate_results"("page_id");

-- CreateIndex
CREATE INDEX "scrvnr_gate_results_page_id_evaluated_at_idx" ON "scrvnr_gate_results"("page_id", "evaluated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_tokens_token_key" ON "onboarding_tokens"("token");

-- CreateIndex
CREATE INDEX "onboarding_tokens_token_idx" ON "onboarding_tokens"("token");

-- CreateIndex
CREATE INDEX "onboarding_tokens_lead_id_idx" ON "onboarding_tokens"("lead_id");

-- CreateIndex
CREATE INDEX "onboarding_tokens_status_idx" ON "onboarding_tokens"("status");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_submissions_token_id_key" ON "onboarding_submissions"("token_id");

-- CreateIndex
CREATE INDEX "onboarding_submissions_lead_id_idx" ON "onboarding_submissions"("lead_id");

-- CreateIndex
CREATE INDEX "onboarding_submissions_onboarding_complete_idx" ON "onboarding_submissions"("onboarding_complete");

-- CreateIndex
CREATE INDEX "ai_cost_logs_client_id_idx" ON "ai_cost_logs"("client_id");

-- CreateIndex
CREATE INDEX "ai_cost_logs_feature_idx" ON "ai_cost_logs"("feature");

-- CreateIndex
CREATE INDEX "ai_cost_logs_timestamp_idx" ON "ai_cost_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "ai_cost_logs_client_id_timestamp_idx" ON "ai_cost_logs"("client_id", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_records_wave_invoice_id_key" ON "invoice_records"("wave_invoice_id");

-- CreateIndex
CREATE INDEX "invoice_records_client_id_status_idx" ON "invoice_records"("client_id", "status");

-- CreateIndex
CREATE INDEX "invoice_records_due_date_idx" ON "invoice_records"("due_date");

-- CreateIndex
CREATE INDEX "invoice_records_status_idx" ON "invoice_records"("status");

-- CreateIndex
CREATE INDEX "webhook_events_source_event_type_idx" ON "webhook_events"("source", "event_type");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_source_external_id_key" ON "webhook_events"("source", "external_id");

-- CreateIndex
CREATE INDEX "enrichment_cache_provider_expires_at_idx" ON "enrichment_cache"("provider", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "enrichment_cache_provider_cache_key_key" ON "enrichment_cache"("provider", "cache_key");

-- CreateIndex
CREATE INDEX "enrichment_cost_logs_provider_created_at_idx" ON "enrichment_cost_logs"("provider", "created_at");

-- CreateIndex
CREATE INDEX "enrichment_cost_logs_client_id_created_at_idx" ON "enrichment_cost_logs"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "keyword_trackers_client_id_is_active_idx" ON "keyword_trackers"("client_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_trackers_client_id_keyword_key" ON "keyword_trackers"("client_id", "keyword");

-- CreateIndex
CREATE INDEX "rank_snapshots_keyword_id_scan_date_idx" ON "rank_snapshots"("keyword_id", "scan_date" DESC);

-- CreateIndex
CREATE INDEX "rank_snapshots_client_id_scan_date_idx" ON "rank_snapshots"("client_id", "scan_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pending_rank_tasks_task_id_key" ON "pending_rank_tasks"("task_id");

-- CreateIndex
CREATE INDEX "pending_rank_tasks_resolved_at_idx" ON "pending_rank_tasks"("resolved_at");

-- CreateIndex
CREATE INDEX "pending_rank_tasks_posted_at_idx" ON "pending_rank_tasks"("posted_at");

-- CreateIndex
CREATE INDEX "citation_scans_client_id_scan_date_idx" ON "citation_scans"("client_id", "scan_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "directory_health_directory_key_key" ON "directory_health"("directory_key");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_connections_client_id_key" ON "google_ads_connections"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "gbp_connections_client_id_key" ON "gbp_connections"("client_id");

-- CreateIndex
CREATE INDEX "vault_files_space_category_idx" ON "vault_files"("space", "category");

-- CreateIndex
CREATE INDEX "vault_files_uploaded_by_idx" ON "vault_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "vault_files_owner_id_idx" ON "vault_files"("owner_id");

-- CreateIndex
CREATE INDEX "vault_files_client_id_idx" ON "vault_files"("client_id");

-- CreateIndex
CREATE INDEX "vault_files_lead_id_idx" ON "vault_files"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "prospect_audits_share_token_key" ON "prospect_audits"("share_token");

-- CreateIndex
CREATE INDEX "prospect_audits_lead_id_idx" ON "prospect_audits"("lead_id");

-- CreateIndex
CREATE INDEX "prospect_demos_lead_id_idx" ON "prospect_demos"("lead_id");

-- CreateIndex
CREATE INDEX "admin_tasks_status_priority_idx" ON "admin_tasks"("status", "priority");

-- CreateIndex
CREATE INDEX "admin_tasks_assigned_to_id_status_idx" ON "admin_tasks"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "admin_tasks_category_idx" ON "admin_tasks"("category");

-- CreateIndex
CREATE INDEX "admin_tasks_due_date_idx" ON "admin_tasks"("due_date");

-- CreateIndex
CREATE INDEX "alert_rules_source_type_is_active_idx" ON "alert_rules"("source_type", "is_active");

-- CreateIndex
CREATE INDEX "alert_events_client_id_created_at_idx" ON "alert_events"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "alert_events_type_severity_idx" ON "alert_events"("type", "severity");

-- CreateIndex
CREATE INDEX "alert_events_acknowledged_idx" ON "alert_events"("acknowledged");

-- CreateIndex
CREATE INDEX "alert_events_created_at_idx" ON "alert_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "notification_events_user_id_read_created_at_idx" ON "notification_events"("user_id", "read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notification_events_user_id_created_at_idx" ON "notification_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "task_alert_links_task_id_alert_id_key" ON "task_alert_links"("task_id", "alert_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_source_status_provider_key" ON "data_source_status"("provider");

-- CreateIndex
CREATE INDEX "task_checklist_items_task_id_idx" ON "task_checklist_items"("task_id");

-- CreateIndex
CREATE INDEX "task_checklist_templates_category_is_active_idx" ON "task_checklist_templates"("category", "is_active");

-- CreateIndex
CREATE INDEX "recurring_task_rules_is_active_next_run_at_idx" ON "recurring_task_rules"("is_active", "next_run_at");

-- CreateIndex
CREATE INDEX "client_tasks_assigned_to_user_id_status_idx" ON "client_tasks"("assigned_to_user_id", "status");

-- CreateIndex
CREATE INDEX "client_tasks_assigned_to_user_id_priority_idx" ON "client_tasks"("assigned_to_user_id", "priority");

-- CreateIndex
CREATE INDEX "client_tasks_status_priority_idx" ON "client_tasks"("status", "priority");

-- CreateIndex
CREATE INDEX "client_tasks_due_date_idx" ON "client_tasks"("due_date");

-- CreateIndex
CREATE INDEX "users_position_id_idx" ON "users"("position_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_master_manager_id_fkey" FOREIGN KEY ("master_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_recurring_rule_id_fkey" FOREIGN KEY ("recurring_rule_id") REFERENCES "recurring_task_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_transitions" ADD CONSTRAINT "task_transitions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upsell_opportunities" ADD CONSTRAINT "upsell_opportunities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upsell_opportunities" ADD CONSTRAINT "upsell_opportunities_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upsell_opportunities" ADD CONSTRAINT "upsell_opportunities_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "competitive_scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compensation_config" ADD CONSTRAINT "user_compensation_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compensation_overrides" ADD CONSTRAINT "client_compensation_overrides_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_compensation_overrides" ADD CONSTRAINT "client_compensation_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_content" ADD CONSTRAINT "client_content_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_profiles" ADD CONSTRAINT "voice_profiles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "client_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "team_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_message_reads" ADD CONSTRAINT "team_message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "team_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_message_reads" ADD CONSTRAINT "team_message_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "web_properties" ADD CONSTRAINT "web_properties_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dna_captures" ADD CONSTRAINT "dna_captures_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "web_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dna_token_overrides" ADD CONSTRAINT "dna_token_overrides_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "dna_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_jobs" ADD CONSTRAINT "build_jobs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "web_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composer_pages" ADD CONSTRAINT "composer_pages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "build_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrvnr_gate_results" ADD CONSTRAINT "scrvnr_gate_results_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "composer_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_tokens" ADD CONSTRAINT "onboarding_tokens_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_tokens" ADD CONSTRAINT "onboarding_tokens_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_submissions" ADD CONSTRAINT "onboarding_submissions_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "onboarding_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_submissions" ADD CONSTRAINT "onboarding_submissions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cost_logs" ADD CONSTRAINT "ai_cost_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_records" ADD CONSTRAINT "invoice_records_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_trackers" ADD CONSTRAINT "keyword_trackers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keyword_trackers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citation_scans" ADD CONSTRAINT "citation_scans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_connections" ADD CONSTRAINT "google_ads_connections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gbp_connections" ADD CONSTRAINT "gbp_connections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_files" ADD CONSTRAINT "vault_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_files" ADD CONSTRAINT "vault_files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_files" ADD CONSTRAINT "vault_files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_files" ADD CONSTRAINT "vault_files_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_audits" ADD CONSTRAINT "prospect_audits_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_audits" ADD CONSTRAINT "prospect_audits_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_demos" ADD CONSTRAINT "prospect_demos_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_demos" ADD CONSTRAINT "prospect_demos_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_alert_links" ADD CONSTRAINT "task_alert_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_alert_links" ADD CONSTRAINT "task_alert_links_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alert_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
