-- CreateTable
CREATE TABLE "client_profiles" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "business_name" TEXT NOT NULL,
    "retainer_amount" DECIMAL(10,2) NOT NULL DEFAULT 2400,
    "health_score" INTEGER NOT NULL DEFAULT 50,
    "scan_frequency" TEXT NOT NULL DEFAULT 'biweekly',
    "voice_profile_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "onboarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_scan_at" TIMESTAMP(3),
    "next_scan_at" TIMESTAMP(3),

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_competitors" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "business_name" TEXT NOT NULL,
    "domain" TEXT,
    "google_place_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_domains" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hosting" TEXT NOT NULL,
    "wp_url" TEXT,
    "wp_username" TEXT,
    "wp_app_password" TEXT,
    "vercel_project_id" TEXT,
    "github_repo" TEXT,
    "template_used" TEXT,
    "ownership_type" TEXT NOT NULL DEFAULT 'ghm',
    "dns_verified" BOOLEAN NOT NULL DEFAULT false,
    "ssl_active" BOOLEAN NOT NULL DEFAULT false,
    "content_count" INTEGER NOT NULL DEFAULT 0,
    "last_deployed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_tasks" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'P3',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "assigned_to" TEXT,
    "target_keywords" JSONB,
    "competitor_ref" TEXT,
    "content_brief" JSONB,
    "draft_content" TEXT,
    "approved_content" TEXT,
    "deployed_url" TEXT,
    "outcome_metrics" JSONB,
    "due_date" TIMESTAMP(3),
    "scan_id" INTEGER,
    "domain_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deployed_at" TIMESTAMP(3),
    "measured_at" TIMESTAMP(3),

    CONSTRAINT "client_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_notes" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "task_id" INTEGER,
    "author_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_scans" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "scan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_data" JSONB NOT NULL,
    "competitors" JSONB NOT NULL,
    "deltas" JSONB NOT NULL,
    "alerts" JSONB NOT NULL,
    "health_score" INTEGER NOT NULL,
    "api_costs" JSONB,
    "status" TEXT NOT NULL DEFAULT 'complete',

    CONSTRAINT "competitive_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_reports" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "pdf_url" TEXT,
    "sent_to_client" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_runs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vertical" TEXT NOT NULL,
    "locations" JSONB NOT NULL,
    "filters" JSONB NOT NULL,
    "results_count" INTEGER NOT NULL,
    "pushed_count" INTEGER NOT NULL DEFAULT 0,
    "results_cache" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_presets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "locations" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_lead_id_key" ON "client_profiles"("lead_id");

-- CreateIndex
CREATE INDEX "client_competitors_client_id_idx" ON "client_competitors"("client_id");

-- CreateIndex
CREATE INDEX "client_domains_client_id_idx" ON "client_domains"("client_id");

-- CreateIndex
CREATE INDEX "client_tasks_client_id_status_idx" ON "client_tasks"("client_id", "status");

-- CreateIndex
CREATE INDEX "client_tasks_client_id_category_idx" ON "client_tasks"("client_id", "category");

-- CreateIndex
CREATE INDEX "client_tasks_client_id_priority_idx" ON "client_tasks"("client_id", "priority");

-- CreateIndex
CREATE INDEX "client_notes_client_id_type_idx" ON "client_notes"("client_id", "type");

-- CreateIndex
CREATE INDEX "client_notes_client_id_is_pinned_idx" ON "client_notes"("client_id", "is_pinned");

-- CreateIndex
CREATE INDEX "client_notes_task_id_idx" ON "client_notes"("task_id");

-- CreateIndex
CREATE INDEX "competitive_scans_client_id_scan_date_idx" ON "competitive_scans"("client_id", "scan_date" DESC);

-- CreateIndex
CREATE INDEX "client_reports_client_id_type_idx" ON "client_reports"("client_id", "type");

-- CreateIndex
CREATE INDEX "discovery_runs_user_id_idx" ON "discovery_runs"("user_id");

-- CreateIndex
CREATE INDEX "discovery_runs_created_at_idx" ON "discovery_runs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_competitors" ADD CONSTRAINT "client_competitors_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_domains" ADD CONSTRAINT "client_domains_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_scans" ADD CONSTRAINT "competitive_scans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_reports" ADD CONSTRAINT "client_reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
