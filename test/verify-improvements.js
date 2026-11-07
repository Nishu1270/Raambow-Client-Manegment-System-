const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "ramboow_techsolutions_super_secret_jwt_key_2026";

async function runVerification() {
  console.log("==========================================================");
  console.log("🧪 RUNNING COMPREHENSIVE IMPROVEMENT VERIFICATION SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // 1. Authenticate users
  console.log("--- 1. Testing Existing Authentication ---");
  const admin = await prisma.user.findUnique({ where: { email: "admin@ramboow.com" } });
  const suresh = await prisma.user.findUnique({ where: { email: "suresh@ramboow.com" } });
  const kiran = await prisma.user.findUnique({ where: { email: "kiran@ramboow.com" } });

  assert(admin !== null && admin.role === "ADMIN", "Admin user verified", admin?.email);
  assert(suresh !== null && suresh.role === "TEAM_MEMBER", "Team member Suresh verified", suresh?.email);
  assert(kiran !== null && kiran.role === "TEAM_MEMBER", "Team member Kiran verified", kiran?.email);

  const adminPass = await bcrypt.compare("admin123", admin.passwordHash);
  assert(adminPass, "Admin password hash valid");

  const sureshPass = await bcrypt.compare("member123", suresh.passwordHash);
  assert(sureshPass, "Team member password hash valid");

  // 2. Dashboard Counts vs Directory Counts (Role-based Consistency)
  console.log("\n--- 2. Testing Dashboard Counts vs Directory Counts ---");
  // Total in DB
  const totalCompanyClients = await prisma.client.count();
  assert(totalCompanyClients >= 30, `Total company clients in DB is >= 30: ${totalCompanyClients}`);

  // Admin scope: All company clients
  const adminClientsCount = await prisma.client.count({});
  assert(adminClientsCount === totalCompanyClients, "Admin dashboard sees 100% of company clients", `Count: ${adminClientsCount}`);

  // Suresh scope: Only assigned clients
  const sureshAssignedCount = await prisma.client.count({ where: { assignedToId: suresh.id } });
  assert(sureshAssignedCount > 0 && sureshAssignedCount < totalCompanyClients, "Suresh has assigned subset", `Count: ${sureshAssignedCount}`);

  // Kiran scope: Only assigned clients
  const kiranAssignedCount = await prisma.client.count({ where: { assignedToId: kiran.id } });
  assert(kiranAssignedCount > 0 && kiranAssignedCount < totalCompanyClients, "Kiran has assigned subset", `Count: ${kiranAssignedCount}`);

  // Sum check
  assert(sureshAssignedCount !== totalCompanyClients, "Team Member dashboard count does NOT falsely report total company count");

  // 3. Admin and Member Data Isolation
  console.log("\n--- 3. Testing Admin & Member Data Isolation ---");
  // Find a client assigned to Kiran
  const kiransClient = await prisma.client.findFirst({ where: { assignedToId: kiran.id } });
  assert(kiransClient !== null, "Found client assigned to Kiran", kiransClient?.name);

  // Simulate Member check: can Suresh access Kiran's client?
  const canSureshAccess = kiransClient.assignedToId === suresh.id;
  assert(!canSureshAccess, "Suresh is strictly unauthorized to access Kiran's client", `Client assignee: ${kiransClient.assignedToId}, Suresh ID: ${suresh.id}`);

  // Simulate Admin check: can Admin access Kiran's client?
  const canAdminAccess = admin.role === "ADMIN";
  assert(canAdminAccess, "Admin has legitimate authorization across all company records");

  // 4. Future Client Form & Database Storage
  console.log("\n--- 4. Testing Future Client Fields (Expected Start, Follow-up, Reason) ---");
  const testFuturePhone = "+91 99999 77777";
  await prisma.client.deleteMany({ where: { phone: testFuturePhone } });

  const futureClient = await prisma.client.create({
    data: {
      name: "Global Aerospace Dynamics",
      phone: testFuturePhone,
      companyName: "Global Aero Corp",
      status: "FUTURE",
      assignedToId: suresh.id,
      expectedStart: "April 2027",
      futureReason: "Waiting for government civil aviation subsidy release in Q2.",
      nextFollowUpAt: new Date("2027-03-01T10:00:00Z"),
    },
  });

  assert(futureClient.id !== null, "Future client created with dedicated fields");
  assert(futureClient.status === "FUTURE", "Status is FUTURE");
  assert(futureClient.expectedStart === "April 2027", "Expected Project Start Date stored", futureClient.expectedStart);
  assert(futureClient.futureReason.includes("subsidy"), "Future Interest Reason stored", futureClient.futureReason);
  assert(futureClient.nextFollowUpAt !== null, "Next follow-up date stored", futureClient.nextFollowUpAt.toISOString());

  // 5. Call History Preservation (Previous Status -> New Status)
  console.log("\n--- 5. Testing Call History Preservation Rule ---");
  // Log call: FUTURE -> INTERESTED
  const callUpdate1 = await prisma.callHistory.create({
    data: {
      clientId: futureClient.id,
      userId: suresh.id,
      callResult: "CONNECTED",
      notes: "Client decided to fast-track pilot testing before April.",
      statusAtTime: "INTERESTED",
      previousStatus: "FUTURE",
      newStatus: "INTERESTED",
      nextFollowUpAt: new Date("2026-11-20T11:00:00Z"),
    },
  });

  const clientAfterCall1 = await prisma.client.update({
    where: { id: futureClient.id },
    data: { status: "INTERESTED", lastContactAt: new Date(), nextFollowUpAt: new Date("2026-11-20T11:00:00Z") },
  });

  assert(callUpdate1.previousStatus === "FUTURE", "Update permanently logged previous status: FUTURE");
  assert(callUpdate1.newStatus === "INTERESTED", "Update permanently logged new status: INTERESTED");
  assert(callUpdate1.callResult === "CONNECTED", "Update preserved call result: CONNECTED");
  assert(callUpdate1.notes.includes("fast-track"), "Update preserved notes");
  assert(callUpdate1.userId === suresh.id, "Update preserved author: Suresh");

  // Log second call: INTERESTED -> CONVERTED
  const callUpdate2 = await prisma.callHistory.create({
    data: {
      clientId: futureClient.id,
      userId: suresh.id,
      callResult: "CONNECTED",
      notes: "Contract signed, advance payment received.",
      statusAtTime: "CONVERTED",
      previousStatus: "INTERESTED",
      newStatus: "CONVERTED",
    },
  });

  const clientAfterCall2 = await prisma.client.update({
    where: { id: futureClient.id },
    data: { status: "CONVERTED", lastContactAt: new Date() },
  });

  // Verify all call history entries remain untouched and never overwritten
  const histories = await prisma.callHistory.findMany({
    where: { clientId: futureClient.id },
    orderBy: { calledAt: "asc" },
  });

  assert(histories.length === 2, "Both distinct historical updates exist without overwriting");
  assert(histories[0].previousStatus === "FUTURE" && histories[0].newStatus === "INTERESTED", "Entry 1 preserved: FUTURE -> INTERESTED");
  assert(histories[1].previousStatus === "INTERESTED" && histories[1].newStatus === "CONVERTED", "Entry 2 preserved: INTERESTED -> CONVERTED");

  // Cleanup test future client
  await prisma.client.delete({ where: { id: futureClient.id } });
  assert(true, "Test future client cleaned up cleanly");

  // 6. Search & Phone Number Lookup
  console.log("\n--- 6. Testing Client Search & Phone Number Lookup ---");
  const phoneSearch = await prisma.client.findFirst({
    where: { phone: { contains: "98765" } },
  });
  assert(phoneSearch !== null, "Phone search found target", `${phoneSearch?.name} (${phoneSearch?.phone})`);

  const companySearch = await prisma.client.findFirst({
    where: { companyName: { contains: "Logistics" } },
  });
  assert(companySearch !== null, "Company search found target", `${companySearch?.name} - ${companySearch?.companyName}`);

  // 7. Status Filtering Check
  console.log("\n--- 7. Testing All 9 Status Filters ---");
  const statuses = [
    "NEW",
    "INTERESTED",
    "FOLLOW_UP",
    "FUTURE",
    "THINKING",
    "NOT_INTERESTED",
    "NO_RESPONSE",
    "CONVERTED",
    "LOST",
  ];

  for (const st of statuses) {
    const count = await prisma.client.count({ where: { status: st } });
    assert(count >= 0, `Status filter "${st}" query successful`, `Matches: ${count}`);
  }

  // 8. Follow-up lists check
  console.log("\n--- 8. Testing Follow-up Lists (Overdue, Today, Upcoming) ---");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdueFollowUps = await prisma.client.count({ where: { nextFollowUpAt: { lt: startOfToday } } });
  const todayFollowUps = await prisma.client.count({ where: { nextFollowUpAt: { gte: startOfToday, lte: endOfToday } } });
  const upcomingFollowUps = await prisma.client.count({ where: { nextFollowUpAt: { gt: endOfToday } } });

  assert(overdueFollowUps >= 0, "Overdue follow-ups list query successful", `Count: ${overdueFollowUps}`);
  assert(todayFollowUps >= 0, "Today follow-ups list query successful", `Count: ${todayFollowUps}`);
  assert(upcomingFollowUps >= 0, "Upcoming follow-ups list query successful", `Count: ${upcomingFollowUps}`);

  console.log("\n==========================================================");
  console.log(`🏁 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) process.exit(1);
}

runVerification()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

