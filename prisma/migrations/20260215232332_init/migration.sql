-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('master', 'sales');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('available', 'scheduled', 'contacted', 'follow_up', 'paperwork', 'won', 'lost_rejection', 'lost_deferred');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('one_time', 'monthly', 'annual');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'sales',
    "territory_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cities" TEXT[],
    "zip_codes" TEXT[],
    "states" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_sources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "cost_per_lead" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "business_name" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "territory_id" INTEGER,
    "assigned_to" INTEGER,
    "lead_source_id" INTEGER,
    "status" "LeadStatus" NOT NULL DEFAULT 'available',
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain_rating" INTEGER,
    "current_rank" INTEGER,
    "review_count" INTEGER,
    "review_avg" DECIMAL(3,2),
    "intel_last_updated" TIMESTAMP(3),
    "intel_needs_refresh" BOOLEAN NOT NULL DEFAULT false,
    "deal_value_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deal_value_one_time" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deal_value_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deal_value_annual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mrr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "arr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ltv_estimated" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_history" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "old_status" "LeadStatus",
    "new_status" "LeadStatus" NOT NULL,
    "time_in_previous_stage" INTEGER,
    "notes" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_intel" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "domain_rating" INTEGER,
    "current_rank" INTEGER,
    "backlinks" INTEGER,
    "review_count" INTEGER,
    "review_avg" DECIMAL(3,2),
    "site_speed_mobile" INTEGER,
    "site_speed_desktop" INTEGER,
    "competitors" JSONB,
    "dr_gap" INTEGER,
    "backlink_gap" INTEGER,
    "review_gap" INTEGER,
    "speed_gap_mobile" INTEGER,
    "speed_gap_desktop" INTEGER,
    "keyword_gaps" JSONB,
    "recommended_package" TEXT,
    "estimated_time_to_rank_1" INTEGER,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "api_costs" DECIMAL(10,4) NOT NULL DEFAULT 0.03,

    CONSTRAINT "competitive_intel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "pricing_model" "PricingModel" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_products" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_at_sale" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "final_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "executive_summary" TEXT,
    "phased_recommendations" JSONB,
    "pricing_breakdown" JSONB,
    "pdf_url" TEXT,
    "file_size" INTEGER,
    "sent_via_email" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_metrics" (
    "id" SERIAL NOT NULL,
    "stage" TEXT NOT NULL,
    "territory_id" INTEGER,
    "user_id" INTEGER,
    "date" DATE NOT NULL,
    "leads_count" INTEGER NOT NULL DEFAULT 0,
    "leads_entered" INTEGER NOT NULL DEFAULT 0,
    "leads_exited" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2),
    "avg_time_in_stage" INTEGER,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rep_performance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "period" TEXT NOT NULL,
    "leads_assigned" INTEGER NOT NULL DEFAULT 0,
    "leads_contacted" INTEGER NOT NULL DEFAULT 0,
    "leads_won" INTEGER NOT NULL DEFAULT 0,
    "leads_lost" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2),
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mrr_added" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "arr_added" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ltv_added" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avg_deal_size" DECIMAL(10,2),
    "notes_added" INTEGER NOT NULL DEFAULT 0,
    "work_orders_sent" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" INTEGER,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rep_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_territory_id_idx" ON "users"("territory_id");

-- CreateIndex
CREATE INDEX "leads_territory_id_idx" ON "leads"("territory_id");

-- CreateIndex
CREATE INDEX "leads_assigned_to_idx" ON "leads"("assigned_to");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_city_zip_code_idx" ON "leads"("city", "zip_code");

-- CreateIndex
CREATE INDEX "leads_lead_source_id_idx" ON "leads"("lead_source_id");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "leads_territory_id_status_idx" ON "leads"("territory_id", "status");

-- CreateIndex
CREATE INDEX "leads_assigned_to_status_idx" ON "leads"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "notes_lead_id_idx" ON "notes"("lead_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_created_at_idx" ON "notes"("created_at" DESC);

-- CreateIndex
CREATE INDEX "lead_history_lead_id_idx" ON "lead_history"("lead_id");

-- CreateIndex
CREATE INDEX "lead_history_user_id_idx" ON "lead_history"("user_id");

-- CreateIndex
CREATE INDEX "lead_history_changed_at_idx" ON "lead_history"("changed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "competitive_intel_lead_id_key" ON "competitive_intel"("lead_id");

-- CreateIndex
CREATE INDEX "competitive_intel_fetched_at_idx" ON "competitive_intel"("fetched_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "deal_products_lead_id_idx" ON "deal_products"("lead_id");

-- CreateIndex
CREATE INDEX "deal_products_product_id_idx" ON "deal_products"("product_id");

-- CreateIndex
CREATE INDEX "work_orders_lead_id_idx" ON "work_orders"("lead_id");

-- CreateIndex
CREATE INDEX "work_orders_user_id_idx" ON "work_orders"("user_id");

-- CreateIndex
CREATE INDEX "work_orders_sent_via_email_idx" ON "work_orders"("sent_via_email");

-- CreateIndex
CREATE INDEX "stage_metrics_date_idx" ON "stage_metrics"("date" DESC);

-- CreateIndex
CREATE INDEX "stage_metrics_stage_idx" ON "stage_metrics"("stage");

-- CreateIndex
CREATE INDEX "stage_metrics_territory_id_idx" ON "stage_metrics"("territory_id");

-- CreateIndex
CREATE INDEX "stage_metrics_user_id_idx" ON "stage_metrics"("user_id");

-- CreateIndex
CREATE INDEX "rep_performance_user_id_idx" ON "rep_performance"("user_id");

-- CreateIndex
CREATE INDEX "rep_performance_date_idx" ON "rep_performance"("date" DESC);

-- CreateIndex
CREATE INDEX "rep_performance_period_idx" ON "rep_performance"("period");

-- CreateIndex
CREATE UNIQUE INDEX "rep_performance_user_id_date_period_key" ON "rep_performance"("user_id", "date", "period");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_lead_source_id_fkey" FOREIGN KEY ("lead_source_id") REFERENCES "lead_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_intel" ADD CONSTRAINT "competitive_intel_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_products" ADD CONSTRAINT "deal_products_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_products" ADD CONSTRAINT "deal_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_metrics" ADD CONSTRAINT "stage_metrics_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_metrics" ADD CONSTRAINT "stage_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rep_performance" ADD CONSTRAINT "rep_performance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
