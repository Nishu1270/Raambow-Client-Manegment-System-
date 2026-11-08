-- Migration: Add quotation and converted project fields to Client table for PostgreSQL / Supabase
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "quotationAmount" DOUBLE PRECISION;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "quotationDetails" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "advanceReceived" DOUBLE PRECISION;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "balancePayment" DOUBLE PRECISION;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'PENDING';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "projectStarted" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "projectDeadline" TIMESTAMP(3);
