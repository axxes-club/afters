-- CreateTable
CREATE TYPE "FeatureType" AS ENUM ('EVENTS', 'DASHBOARD', 'LOGIN', 'REGISTRATION', 'TICKETING', 'PROFILE', 'PAYMENTS', 'API');

-- AlterTable
ALTER TABLE "SystemStatus" ADD COLUMN "featureType" "FeatureType";

-- CreateIndex
CREATE UNIQUE INDEX "SystemStatus_feature_featureType_key" ON "SystemStatus"("feature", "featureType");