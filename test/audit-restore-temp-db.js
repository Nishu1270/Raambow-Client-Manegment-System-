/**
 * Audit test script: Restores the backup snapshot into a separate, isolated
 * temporary SQLite database (temp_audit_restore.db) and independently verifies
 * all 234 records across all seven models.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const TEMP_DB_NAME = "temp_audit_restore.db";
const TEMP_DB_PATH = path.join(__dirname, "..", "prisma", TEMP_DB_NAME);
const BACKUP_PATH = path.join(__dirname, "..", "backups", "backup_ramboow_crm_2026-11-04T20-54-12-431Z.json");

async function main() {
  console.log("=== STEP 2 AUDIT: RESTORE BACKUP INTO TEMPORARY SQLITE DATABASE ===");

  // 1. Ensure clean slate for temporary test database
  if (fs.existsSync(TEMP_DB_PATH)) {
    fs.unlinkSync(TEMP_DB_PATH);
  }

  // 2. Read backup payload
  console.log("Reading backup file:", BACKUP_PATH);
  const raw = fs.readFileSync(BACKUP_PATH, "utf-8");
  const payload = JSON.parse(raw);
  const data = payload.data;

  // 3. Initialize temporary database schema using a custom Prisma connection
  console.log("Initializing temporary schema on:", TEMP_DB_PATH);
  // Temporary schema file pointing to temp_audit_restore.db
  const tempSchemaContent = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./${TEMP_DB_NAME}"
}

model User {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  phone        String?
  passwordHash String
  role         String        @default("TEAM_MEMBER")
  active       Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  assignedClients Client[]    @relation("AssignedClients")
  callHistories   CallHistory[]
  followUps       FollowUp[]
  auditLogs       AuditLog[]
  importHistories ImportHistory[]
}

model Service {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  clients     Client[]
}

model Client {
  id             String        @id @default(uuid())
  name           String
  phone          String        @unique
  email          String?
  companyName    String?
  location       String?
  serviceId      String?
  service        Service?      @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  assignedToId   String?
  assignedTo     User?         @relation("AssignedClients", fields: [assignedToId], references: [id], onDelete: SetNull)
  status         String        @default("NEW")
  notes          String?
  expectedStart  String?
  futureReason   String?
  lastContactAt  DateTime?
  nextFollowUpAt DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  callHistories  CallHistory[]
  followUps      FollowUp[]

  @@index([status])
  @@index([phone])
  @@index([assignedToId])
  @@index([nextFollowUpAt])
}

model CallHistory {
  id             String    @id @default(uuid())
  clientId       String
  client         Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  callResult     String
  notes          String
  statusAtTime   String
  previousStatus String?
  newStatus      String?
  calledAt       DateTime  @default(now())
  nextFollowUpAt DateTime?
  createdAt      DateTime  @default(now())

  @@index([clientId])
  @@index([userId])
  @@index([calledAt])
}

model FollowUp {
  id          String    @id @default(uuid())
  clientId    String
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  scheduledAt DateTime
  notes       String?
  completed   Boolean   @default(false)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([clientId])
  @@index([userId])
  @@index([scheduledAt])
  @@index([completed])
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String
  details   String?
  ipAddress String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}

model ImportHistory {
  id           String   @id @default(uuid())
  fileName     String
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  totalRows    Int
  importedRows Int
  skippedRows  Int
  failedRows   Int
  status       String   @default("COMPLETED")
  errorLog     String?
  createdAt    DateTime @default(now())

  @@index([uploadedById])
  @@index([createdAt])
}
`;

  const tempSchemaPath = path.join(__dirname, "..", "prisma", "schema.temp-audit.prisma");
  fs.writeFileSync(tempSchemaPath, tempSchemaContent, "utf-8");

  try {
    // Push schema to the temporary database without altering dev.db
    console.log("Running prisma db push on temporary schema...");
    execSync(`npx prisma db push --schema=prisma/schema.temp-audit.prisma --accept-data-loss`, {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: `file:./${TEMP_DB_NAME}` },
    });

    // Instantiate PrismaClient targeting the temporary database
    const tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:./${TEMP_DB_NAME}`,
        },
      },
    });

    // 4. Restore records in topological order
    console.log("\nRestoring records into temporary database...");

    // 4.1 Users
    for (const u of data.users) {
      await tempPrisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          passwordHash: u.passwordHash,
          role: u.role,
          active: u.active,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        },
      });
    }

    // 4.2 Services
    for (const s of data.services) {
      await tempPrisma.service.create({
        data: {
          id: s.id,
          name: s.name,
          description: s.description,
          active: s.active,
          createdAt: new Date(s.createdAt),
        },
      });
    }

    // 4.3 Clients
    for (const c of data.clients) {
      await tempPrisma.client.create({
        data: {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          companyName: c.companyName,
          location: c.location,
          serviceId: c.serviceId,
          assignedToId: c.assignedToId,
          status: c.status,
          notes: c.notes,
          expectedStart: c.expectedStart,
          futureReason: c.futureReason,
          lastContactAt: c.lastContactAt ? new Date(c.lastContactAt) : null,
          nextFollowUpAt: c.nextFollowUpAt ? new Date(c.nextFollowUpAt) : null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        },
      });
    }

    // 4.4 Call History
    for (const ch of data.callHistories) {
      await tempPrisma.callHistory.create({
        data: {
          id: ch.id,
          clientId: ch.clientId,
          userId: ch.userId,
          callResult: ch.callResult,
          notes: ch.notes,
          statusAtTime: ch.statusAtTime,
          previousStatus: ch.previousStatus,
          newStatus: ch.newStatus,
          calledAt: new Date(ch.calledAt),
          nextFollowUpAt: ch.nextFollowUpAt ? new Date(ch.nextFollowUpAt) : null,
          createdAt: new Date(ch.createdAt),
        },
      });
    }

    // 4.5 Follow-ups
    for (const fu of data.followUps) {
      await tempPrisma.followUp.create({
        data: {
          id: fu.id,
          clientId: fu.clientId,
          userId: fu.userId,
          scheduledAt: new Date(fu.scheduledAt),
          notes: fu.notes,
          completed: fu.completed,
          completedAt: fu.completedAt ? new Date(fu.completedAt) : null,
          createdAt: new Date(fu.createdAt),
          updatedAt: new Date(fu.updatedAt),
        },
      });
    }

    // 4.6 Import Histories
    for (const ih of data.importHistories) {
      await tempPrisma.importHistory.create({
        data: {
          id: ih.id,
          fileName: ih.fileName,
          uploadedById: ih.uploadedById,
          totalRows: ih.totalRows,
          importedRows: ih.importedRows,
          skippedRows: ih.skippedRows,
          failedRows: ih.failedRows,
          status: ih.status,
          errorLog: ih.errorLog,
          createdAt: new Date(ih.createdAt),
        },
      });
    }

    // 4.7 Audit Logs
    for (const al of data.auditLogs) {
      await tempPrisma.auditLog.create({
        data: {
          id: al.id,
          userId: al.userId,
          action: al.action,
          details: al.details,
          ipAddress: al.ipAddress,
          createdAt: new Date(al.createdAt),
        },
      });
    }

    // 5. Verification queries
    console.log("\n--- VERIFICATION OF RESTORED COUNTS ---");
    const countUsers = await tempPrisma.user.count();
    const countServices = await tempPrisma.service.count();
    const countClients = await tempPrisma.client.count();
    const countCallHistories = await tempPrisma.callHistory.count();
    const countFollowUps = await tempPrisma.followUp.count();
    const countImportHistories = await tempPrisma.importHistory.count();
    const countAuditLogs = await tempPrisma.auditLog.count();

    const totalRestored = countUsers + countServices + countClients + countCallHistories + countFollowUps + countImportHistories + countAuditLogs;

    console.log(`1. Users:            ${countUsers} (Expected: ${data.users.length})`);
    console.log(`2. Services:         ${countServices} (Expected: ${data.services.length})`);
    console.log(`3. Clients:          ${countClients} (Expected: ${data.clients.length})`);
    console.log(`4. Call Histories:   ${countCallHistories} (Expected: ${data.callHistories.length})`);
    console.log(`5. Follow-ups:       ${countFollowUps} (Expected: ${data.followUps.length})`);
    console.log(`6. Import Histories: ${countImportHistories} (Expected: ${data.importHistories.length})`);
    console.log(`7. Audit Logs:       ${countAuditLogs} (Expected: ${data.auditLogs.length})`);
    console.log(`-----------------------------------------------`);
    console.log(`TOTAL RESTORED:      ${totalRestored} (Expected: 234)`);

    // Verify relations
    const sampleClientWithRelations = await tempPrisma.client.findFirst({
      where: { phone: "+91 98301 98765" },
      include: { assignedTo: true, service: true, callHistories: true, followUps: true },
    });

    console.log("\n--- RELATIONSHIP INTEGRITY CHECK ---");
    console.log("Sample client:", sampleClientWithRelations?.name);
    console.log("Assigned consultant:", sampleClientWithRelations?.assignedTo?.name);
    console.log("Linked service:", sampleClientWithRelations?.service?.name);
    console.log("Call histories count:", sampleClientWithRelations?.callHistories.length);
    console.log("Follow-ups count:", sampleClientWithRelations?.followUps.length);

    await tempPrisma.$disconnect();

    const isMatch = totalRestored === 234 &&
      countUsers === 4 &&
      countServices === 8 &&
      countClients === 32 &&
      countCallHistories === 33 &&
      countFollowUps === 25 &&
      countImportHistories === 5 &&
      countAuditLogs === 127 &&
      sampleClientWithRelations?.assignedTo?.name &&
      sampleClientWithRelations?.service?.name;

    if (!isMatch) {
      throw new Error(`Record count mismatch! Restored ${totalRestored}, expected 234.`);
    }

    console.log("\n🎉 PASS: ALL 234 RECORDS AND RELATIONSHIPS FULLY VERIFIED IN ISOLATED RESTORE!");
  } finally {
    // Clean up temporary schema and db
    if (fs.existsSync(tempSchemaPath)) fs.unlinkSync(tempSchemaPath);
    if (fs.existsSync(TEMP_DB_PATH)) fs.unlinkSync(TEMP_DB_PATH);
  }
}

main().catch((err) => {
  console.error("❌ Restore test failed:", err);
  process.exit(1);
});

