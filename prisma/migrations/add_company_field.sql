-- Migration: Add company field for Multi-Company Project Management (PostgreSQL / Supabase)
-- Defaults existing records to 'RAAMBOW' so no existing project data is lost or broken.
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "company" TEXT NOT NULL DEFAULT 'RAAMBOW';

-- Index for high-performance filtering by company
CREATE INDEX IF NOT EXISTS "Client_company_idx" ON "Client"("company");
