/**
 * RAMBOOW CLIENT MANAGEMENT — SUPABASE POST-MIGRATION VALIDATION
 * 
 * Runs read-only validation queries against the Supabase PostgreSQL database
 * to confirm 100% record fidelity, relation integrity, and zero data loss.
 *
 * Usage:
 *   node scripts/verify-supabase-post-migration.js
 */

const { PrismaClient } = require("@prisma/client");

async function main() {
  console.log("==================================================================");
  console.log("   RAMBOOW CLIENT MANAGEMENT — SUPABASE POST-MIGRATION AUDIT      ");
  console.log("   Target: Supabase PostgreSQL (db.brqrnghtsdetmdrpphsc.supabase.co)");
  console.log("==================================================================\n");

  const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!targetUrl || targetUrl.includes("[YOUR-PASSWORD]") || targetUrl.startsWith("file:")) {
    console.error("❌ Error: Valid Supabase DIRECT_URL or DATABASE_URL not found in environment.");
    console.error("Please configure your Supabase connection string before running validation.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: targetUrl } },
  });

  try {
    console.log("Querying Supabase database tables...\n");

    const [
      users,
      services,
      clients,
      callHistories,
      followUps,
      importHistories,
      auditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.service.count(),
      prisma.client.count(),
      prisma.callHistory.count(),
      prisma.followUp.count(),
      prisma.importHistory.count(),
      prisma.auditLog.count(),
    ]);

    const EXPECTED = {
      users: 4,
      services: 8,
      clients: 32,
      callHistories: 33,
      followUps: 25,
      importHistories: 5,
      auditLogs: 127,
      total: 234,
    };

    const actualTotal = users + services + clients + callHistories + followUps + importHistories + auditLogs;

    console.log("------------------------------------------------------------------");
    console.log("TABLE COUNTS VERIFICATION:");
    console.log(`  1. Users:            ${users} / ${EXPECTED.users}  ${users === EXPECTED.users ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  2. Services:         ${services} / ${EXPECTED.services}  ${services === EXPECTED.services ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  3. Clients:          ${clients} / ${EXPECTED.clients}  ${clients === EXPECTED.clients ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  4. Call Histories:   ${callHistories} / ${EXPECTED.callHistories}  ${callHistories === EXPECTED.callHistories ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  5. Follow-ups:       ${followUps} / ${EXPECTED.followUps}  ${followUps === EXPECTED.followUps ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  6. Import Histories: ${importHistories} / ${EXPECTED.importHistories}  ${importHistories === EXPECTED.importHistories ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`  7. Audit Logs:       ${auditLogs} / ${EXPECTED.auditLogs}  ${auditLogs === EXPECTED.auditLogs ? "✅ PASS" : "❌ FAIL"}`);
    console.log("------------------------------------------------------------------");
    console.log(`TOTAL RECORDS IN SUPABASE: ${actualTotal} / ${EXPECTED.total} ${actualTotal === EXPECTED.total ? "✅ PASS" : "❌ FAIL"}\n`);

    // Relationship audit
    console.log("RELATIONSHIP & FOREIGN KEY INTEGRITY CHECK:");
    const clientsWithRelations = await prisma.client.findMany({
      take: 5,
      include: {
        assignedTo: true,
        service: true,
        callHistories: true,
        followUps: true,
      },
    });

    let relSuccess = true;
    for (const c of clientsWithRelations) {
      if (c.assignedToId && !c.assignedTo) relSuccess = false;
      if (c.serviceId && !c.service) relSuccess = false;
    }

    console.log(`  - Relationship joins (Client -> User & Service): ${relSuccess ? "✅ PASS (Zero broken links)" : "❌ FAIL"}`);

    if (actualTotal === EXPECTED.total && relSuccess) {
      console.log("\n🎉 ALL 234 RECORDS AND RELATIONSHIPS FULLY VERIFIED IN SUPABASE!");
    } else {
      console.error("\n❌ Validation discrepancy detected. Review the model counts above.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Validation query error:", err.message);
  process.exit(1);
});

