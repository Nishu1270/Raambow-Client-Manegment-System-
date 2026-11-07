ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE INDEX IF NOT EXISTS "User_approvalStatus_idx" ON "User"("approvalStatus");

