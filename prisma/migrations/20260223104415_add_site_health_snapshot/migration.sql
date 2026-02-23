-- CreateTable
CREATE TABLE "site_health_snapshots" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "performance_mobile" INTEGER,
    "performance_desktop" INTEGER,
    "lcp" DOUBLE PRECISION,
    "tbt" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "ttfb" DOUBLE PRECISION,
    "fcp" DOUBLE PRECISION,
    "seo_score" INTEGER,
    "accessibility_score" INTEGER,
    "best_practices_score" INTEGER,
    "previous_mobile" INTEGER,
    "previous_desktop" INTEGER,
    "scan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_health_snapshots_client_id_scan_date_idx" ON "site_health_snapshots"("client_id", "scan_date" DESC);

-- CreateIndex
CREATE INDEX "site_health_snapshots_domain_id_scan_date_idx" ON "site_health_snapshots"("domain_id", "scan_date" DESC);

-- AddForeignKey
ALTER TABLE "site_health_snapshots" ADD CONSTRAINT "site_health_snapshots_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_health_snapshots" ADD CONSTRAINT "site_health_snapshots_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "client_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
