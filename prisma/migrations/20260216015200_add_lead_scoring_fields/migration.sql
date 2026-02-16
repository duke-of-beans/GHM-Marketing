-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "close_score" INTEGER,
ADD COLUMN     "distance_from_metro" DECIMAL(6,1),
ADD COLUMN     "impact_score" INTEGER,
ADD COLUMN     "market_type" TEXT,
ADD COLUMN     "pitch_angle" TEXT,
ADD COLUMN     "priority_tier" TEXT,
ADD COLUMN     "suppression_signal" TEXT,
ADD COLUMN     "wealth_score" TEXT;
