-- CreateTable
CREATE TABLE "gbp_snapshots" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "search_views" INTEGER,
    "map_views" INTEGER,
    "website_clicks" INTEGER,
    "phone_clicks" INTEGER,
    "direction_clicks" INTEGER,
    "review_count" INTEGER,
    "review_avg" DOUBLE PRECISION,
    "new_reviews" INTEGER,
    "photos_count" INTEGER,
    "posts_count" INTEGER,
    "previous_search_views" INTEGER,
    "previous_map_views" INTEGER,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "scan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gbp_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gbp_snapshots_client_id_scan_date_idx" ON "gbp_snapshots"("client_id", "scan_date" DESC);

-- AddForeignKey
ALTER TABLE "gbp_snapshots" ADD CONSTRAINT "gbp_snapshots_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
