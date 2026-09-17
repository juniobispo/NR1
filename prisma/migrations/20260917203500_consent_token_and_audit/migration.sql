-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('SELF', 'RH_MANUAL');

-- AlterTable: consent_records — audit fields for who submitted and from where
ALTER TABLE "consent_records" ADD COLUMN "submittedBy" "ConsentSource" NOT NULL DEFAULT 'RH_MANUAL';
ALTER TABLE "consent_records" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "consent_records" ADD COLUMN "userAgent" TEXT;

-- AlterTable: employees — public consent link token
ALTER TABLE "employees" ADD COLUMN "consentToken" TEXT;

-- Backfill existing rows with a random token (Prisma's cuid() default only applies at the app level for new rows).
-- gen_random_uuid() is built into PostgreSQL 13+, no extension required.
UPDATE "employees" SET "consentToken" = replace(gen_random_uuid()::text, '-', '') WHERE "consentToken" IS NULL;

ALTER TABLE "employees" ALTER COLUMN "consentToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_consentToken_key" ON "employees"("consentToken");
