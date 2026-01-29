-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "SystemHealth" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'DEPRECATED', 'CONSTRUCTION', 'DEPLOYING', 'DOWN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "SystemStatus" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "status" "SystemHealth" NOT NULL DEFAULT 'OPERATIONAL',
    "message" TEXT,
    "plannedEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemStatus_feature_key" ON "SystemStatus"("feature");
