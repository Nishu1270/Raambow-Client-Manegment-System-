/**
 * RAMBOOW CLIENT MANAGEMENT — DATABASE BACKUP UTILITY
 * Exports a full, lossless, integrity-checked snapshot of the database.
 * Supports both PostgreSQL and SQLite environments.
 *
 * Usage:
 *   node scripts/backup-db.js
 *
 * Output:
 *   backups/backup_ramboow_crm_<timestamp>.json
 *   backups/backup.log
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, "..", "backups");

function logBackupEvent(message) {
  const logFile = path.join(BACKUP_DIR, "backup.log");
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logFile, entry, "utf-8");
  } catch (err) {
    console.error("Failed to write to backup.log:", err.message);
  }
}

async function runBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  logBackupEvent("=== Starting Database Backup ===");

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup_ramboow_crm_${timestamp}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);

    // Fetch all relational tables in topological order
    const [users, services, clients, callHistories, followUps, auditLogs, importHistories] =
      await Promise.all([
        prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.service.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.client.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.callHistory.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.followUp.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.auditLog.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.importHistory.findMany({ orderBy: { createdAt: "asc" } }),
      ]);

    const backupPayload = {
      meta: {
        application: "Ramboow Client Management",
        company: "Ramboow TechSolutions",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        counts: {
          users: users.length,
          services: services.length,
          clients: clients.length,
          callHistories: callHistories.length,
          followUps: followUps.length,
          auditLogs: auditLogs.length,
          importHistories: importHistories.length,
        },
      },
      data: {
        users,
        services,
        clients,
        callHistories,
        followUps,
        auditLogs,
        importHistories,
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);

    // Calculate SHA-256 checksum for tamper and corruption detection
    const sha256 = crypto.createHash("sha256").update(jsonString).digest("hex");
    backupPayload.meta.sha256 = sha256;

    fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), "utf-8");

    const summary =
      `SUCCESS: Backup completed -> ${backupFileName}\n` +
      `  - Users: ${users.length}\n` +
      `  - Services: ${services.length}\n` +
      `  - Clients: ${clients.length}\n` +
      `  - Call History: ${callHistories.length}\n` +
      `  - Follow-ups: ${followUps.length}\n` +
      `  - Import History: ${importHistories.length}\n` +
      `  - Audit Logs: ${auditLogs.length}\n` +
      `  - SHA256: ${sha256}`;

    logBackupEvent(summary);

    // Retention policy: Clean up backups older than 30 days locally
    cleanOldBackups(30);

    return { success: true, filePath: backupFilePath, sha256 };
  } catch (error) {
    logBackupEvent(`FAILURE: Backup aborted with error: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function cleanOldBackups(retentionDays = 30) {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const f of files) {
      if (f.startsWith("backup_ramboow_crm_") && f.endsWith(".json")) {
        const fullPath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
          logBackupEvent(`Pruned old backup file beyond ${retentionDays}-day retention: ${f}`);
        }
      }
    }
  } catch (err) {
    console.error("Backup cleanup error:", err.message);
  }
}

if (require.main === module) {
  runBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runBackup };

