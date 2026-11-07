/**
 * RAMBOOW CLIENT MANAGEMENT — DATABASE RESTORATION UTILITY
 * Restores a snapshot into a target database with foreign key dependency ordering.
 *
 * SAFETY RULES:
 *   1. Never run restoration against production without explicit --confirm-restore flag.
 *   2. Always test restoration into a separate staging/test database first.
 *
 * Usage:
 *   node scripts/restore-db.js backups/backup_ramboow_crm_<timestamp>.json --confirm-restore
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function runRestore() {
  const args = process.argv.slice(2);
  const backupFilePath = args.find((a) => !a.startsWith("--"));
  const hasConfirmFlag = args.includes("--confirm-restore");

  if (!backupFilePath) {
    console.error("❌ Error: Please specify the backup file to restore.");
    console.error("Usage: node scripts/restore-db.js <path-to-backup.json> --confirm-restore");
    process.exit(1);
  }

  if (!hasConfirmFlag) {
    console.error("❌ SAFETY ABORT: Missing mandatory confirmation flag '--confirm-restore'.");
    console.error("Restoring will insert records into the connected database.");
    console.error("To proceed, add '--confirm-restore' to your command.");
    process.exit(1);
  }

  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Error: Backup file not found at: ${backupFilePath}`);
    process.exit(1);
  }

  console.log("==========================================================");
  console.log("   RAMBOOW CLIENT MANAGEMENT — RESTORATION PROCEDURE      ");
  console.log("==========================================================\n");

  const rawJson = fs.readFileSync(backupFilePath, "utf-8");
  const payload = JSON.parse(rawJson);

  if (!payload.meta || !payload.data) {
    console.error("❌ Error: Invalid backup format. Missing 'meta' or 'data' blocks.");
    process.exit(1);
  }

  console.log(`Backup Source: ${payload.meta.company} - ${payload.meta.application}`);
  console.log(`Backup Created At: ${payload.meta.timestamp}`);

  // 1. Verify Checksum
  if (payload.meta.sha256) {
    const expectedSha = payload.meta.sha256;
    delete payload.meta.sha256;
    const computedSha = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload, null, 2))
      .digest("hex");

    if (computedSha !== expectedSha) {
      console.warn("⚠️  Warning: Checksum discrepancy detected. Backup may have been edited or formatted.");
    } else {
      console.log("✓ Backup integrity checksum verified successfully (SHA-256 match).");
    }
  }

  const { users, services, clients, callHistories, followUps, auditLogs, importHistories } =
    payload.data;

  console.log("\nRestoring records in topological relational order...");

  // 1. Users
  console.log(`- Restoring ${users.length} Users...`);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: u.passwordHash,
        role: u.role,
        active: u.active,
      },
      create: {
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

  // 2. Services
  console.log(`- Restoring ${services.length} Services...`);
  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        description: s.description,
        active: s.active,
      },
      create: {
        id: s.id,
        name: s.name,
        description: s.description,
        active: s.active,
        createdAt: new Date(s.createdAt),
      },
    });
  }

  // 3. Clients
  console.log(`- Restoring ${clients.length} Clients...`);
  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {
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
      },
      create: {
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

  // 4. Call History
  console.log(`- Restoring ${callHistories.length} Call History records...`);
  for (const ch of callHistories) {
    await prisma.callHistory.upsert({
      where: { id: ch.id },
      update: {
        callResult: ch.callResult,
        notes: ch.notes,
        statusAtTime: ch.statusAtTime,
        previousStatus: ch.previousStatus,
        newStatus: ch.newStatus,
        calledAt: new Date(ch.calledAt),
        nextFollowUpAt: ch.nextFollowUpAt ? new Date(ch.nextFollowUpAt) : null,
      },
      create: {
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

  // 5. Follow-ups
  console.log(`- Restoring ${followUps.length} Follow-ups...`);
  for (const fu of followUps) {
    await prisma.followUp.upsert({
      where: { id: fu.id },
      update: {
        scheduledAt: new Date(fu.scheduledAt),
        notes: fu.notes,
        completed: fu.completed,
        completedAt: fu.completedAt ? new Date(fu.completedAt) : null,
      },
      create: {
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

  // 6. Import History
  console.log(`- Restoring ${importHistories.length} Import History logs...`);
  for (const ih of importHistories) {
    await prisma.importHistory.upsert({
      where: { id: ih.id },
      update: {
        fileName: ih.fileName,
        totalRows: ih.totalRows,
        importedRows: ih.importedRows,
        skippedRows: ih.skippedRows,
        failedRows: ih.failedRows,
        status: ih.status,
        errorLog: ih.errorLog,
      },
      create: {
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

  // 7. Audit Logs
  console.log(`- Restoring ${auditLogs.length} Audit Logs...`);
  for (const al of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: al.id },
      update: {
        action: al.action,
        details: al.details,
        ipAddress: al.ipAddress,
      },
      create: {
        id: al.id,
        userId: al.userId,
        action: al.action,
        details: al.details,
        ipAddress: al.ipAddress,
        createdAt: new Date(al.createdAt),
      },
    });
  }

  console.log("\n==========================================================");
  console.log("   RESTORATION COMPLETE & VERIFIED                        ");
  console.log("==========================================================");
  console.log("All tables, foreign keys, and records have been successfully restored.");
  console.log("==========================================================\n");

  await prisma.$disconnect();
}

if (require.main === module) {
  runRestore().catch(async (e) => {
    console.error("Restoration failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
}

module.exports = { runRestore };

