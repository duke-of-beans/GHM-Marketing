-- Sprint 21-B: TeamFeed UX overhaul
-- Adds edit tracking and @mention storage to team_messages

ALTER TABLE "team_messages"
  ADD COLUMN "edited_at"  TIMESTAMP(3),
  ADD COLUMN "mentions"   JSONB;
