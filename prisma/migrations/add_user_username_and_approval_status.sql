-- Migration: Add username and approvalStatus to User table for PostgreSQL / Supabase
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';

-- Unique constraint on username
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Index on approvalStatus
CREATE INDEX IF NOT EXISTS "User_approvalStatus_idx" ON "User"("approvalStatus");
