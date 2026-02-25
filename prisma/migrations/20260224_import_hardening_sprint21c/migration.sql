-- Sprint 21-C: Import hardening — rollback FK + external ID dedup
-- Adds pm_import_session_id and pm_external_id to client_tasks

ALTER TABLE "client_tasks"
  ADD COLUMN "pm_import_session_id" INTEGER,
  ADD COLUMN "pm_external_id"       TEXT;

-- Index for fast duplicate detection: source + externalId per client
CREATE INDEX IF NOT EXISTS "idx_client_tasks_pm_dedup"
  ON "client_tasks"("pm_external_id", "client_id")
  WHERE "pm_external_id" IS NOT NULL;
