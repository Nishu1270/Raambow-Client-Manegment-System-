-- ============================================================================
-- RAMBOOW CLIENT MANAGEMENT — PRODUCTION DATABASE SCHEMA MIGRATION
-- Target: Managed Cloud PostgreSQL (Supabase / Neon / AWS RDS / GCP Cloud SQL)
-- Region: Preferred ap-south-1 (Mumbai, India)
-- ============================================================================

-- 1. Create User Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEAM_MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 2. Create Service Table
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- 3. Create Client Table
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "companyName" TEXT,
    "location" TEXT,
    "serviceId" TEXT,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "expectedStart" TEXT,
    "futureReason" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- 4. Create CallHistory Table
CREATE TABLE "CallHistory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callResult" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "statusAtTime" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallHistory_pkey" PRIMARY KEY ("id")
);

-- 5. Create FollowUp Table
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- 6. Create AuditLog Table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 7. Create ImportHistory Table
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "skippedRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES & CONSTRAINTS
-- ============================================================================

-- User Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Service Indexes
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- Client Indexes
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_phone_idx" ON "Client"("phone");
CREATE INDEX "Client_assignedToId_idx" ON "Client"("assignedToId");
CREATE INDEX "Client_nextFollowUpAt_idx" ON "Client"("nextFollowUpAt");

-- CallHistory Indexes
CREATE INDEX "CallHistory_clientId_idx" ON "CallHistory"("clientId");
CREATE INDEX "CallHistory_userId_idx" ON "CallHistory"("userId");
CREATE INDEX "CallHistory_calledAt_idx" ON "CallHistory"("calledAt");

-- FollowUp Indexes
CREATE INDEX "FollowUp_clientId_idx" ON "FollowUp"("clientId");
CREATE INDEX "FollowUp_userId_idx" ON "FollowUp"("userId");
CREATE INDEX "FollowUp_scheduledAt_idx" ON "FollowUp"("scheduledAt");
CREATE INDEX "FollowUp_completed_idx" ON "FollowUp"("completed");

-- AuditLog Indexes
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ImportHistory Indexes
CREATE INDEX "ImportHistory_uploadedById_idx" ON "ImportHistory"("uploadedById");
CREATE INDEX "ImportHistory_createdAt_idx" ON "ImportHistory"("createdAt");

-- ============================================================================
-- FOREIGN KEY RELATIONS
-- ============================================================================

ALTER TABLE "Client" ADD CONSTRAINT "Client_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

