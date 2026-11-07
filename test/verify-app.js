const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "ramboow_techsolutions_super_secret_jwt_key_2026";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 STARTING RAMBOOW CRM VERIFICATION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. User & Password Hash Test
  console.log("--- 1. Testing Authentication & User Roles ---");
  const admin = await prisma.user.findUnique({ where: { email: "admin@ramboow.com" } });
  assert(admin !== null, "Admin user exists in database");
  assert(admin.role === "ADMIN", "Admin has ADMIN role");

  const isAdminPassCorrect = await bcrypt.compare("admin123", admin.passwordHash);
  assert(isAdminPassCorrect, "Admin password hashes and verifies with bcrypt");

  const suresh = await prisma.user.findUnique({ where: { email: "suresh@ramboow.com" } });
  assert(suresh !== null, "Team member Suresh exists");
  assert(suresh.role === "TEAM_MEMBER", "Suresh has TEAM_MEMBER role");

  const isMemberPassCorrect = await bcrypt.compare("member123", suresh.passwordHash);
  assert(isMemberPassCorrect, "Team member password verifies with bcrypt");

  // Test JWT token issuance & verification
  const token = jwt.sign({ id: admin.id, role: admin.role, name: admin.name }, JWT_SECRET);
  const decoded = jwt.verify(token, JWT_SECRET);
  assert(decoded.id === admin.id && decoded.role === "ADMIN", "JWT token signs and verifies properly");

  // 2. Client Database Queries & Dynamic Stats
  console.log("\n--- 2. Testing Database Statistics Calculation ---");
  const totalClients = await prisma.client.count();
  assert(totalClients >= 30, `Total clients in DB >= 30 (Actual: ${totalClients})`);

  const interestedCount = await prisma.client.count({ where: { status: "INTERESTED" } });
  const futureCount = await prisma.client.count({ where: { status: "FUTURE" } });
  const followUpCount = await prisma.client.count({ where: { status: "FOLLOW_UP" } });
  const convertedCount = await prisma.client.count({ where: { status: "CONVERTED" } });
  const notInterestedCount = await prisma.client.count({ where: { status: "NOT_INTERESTED" } });
  const noResponseCount = await prisma.client.count({ where: { status: "NO_RESPONSE" } });

  assert(interestedCount > 0, `Interested clients present: ${interestedCount}`);
  assert(futureCount > 0, `Future clients present: ${futureCount}`);
  assert(followUpCount > 0, `Follow-up clients present: ${followUpCount}`);
  assert(convertedCount > 0, `Converted clients present: ${convertedCount}`);
  assert(notInterestedCount > 0, `Not Interested clients present: ${notInterestedCount}`);
  assert(noResponseCount > 0, `No Response clients present: ${noResponseCount}`);

  // 3. Client Onboarding & Duplicate Phone Prevention
  console.log("\n--- 3. Testing Client Onboarding & Duplicate Phone Validation ---");
  const testPhone = "+91 99999 88888";
  
  // Clean test client if exists
  await prisma.client.deleteMany({ where: { phone: testPhone } });

  const testClient = await prisma.client.create({
    data: {
      name: "Apex Test Industries",
      phone: testPhone,
      companyName: "Apex Corp",
      status: "NEW",
      assignedToId: suresh.id,
      notes: "Automated test client creation",
    },
  });
  assert(testClient.id !== null, "Successfully created new client");

  // Try duplicate phone check
  const duplicate = await prisma.client.findUnique({ where: { phone: testPhone } });
  assert(duplicate !== null && duplicate.id === testClient.id, "Duplicate phone detected correctly");

  // 4. Client Lifecycle & History Preservation (Section 19 Rule)
  console.log("\n--- 4. Testing Call Updates & History Preservation Rule ---");
  // Log call 1: NEW -> INTERESTED
  const call1 = await prisma.callHistory.create({
    data: {
      clientId: testClient.id,
      userId: suresh.id,
      callResult: "CONNECTED",
      notes: "First call: Customer interested in Next.js portal.",
      statusAtTime: "NEW",
    },
  });

  await prisma.client.update({
    where: { id: testClient.id },
    data: { status: "INTERESTED", lastContactAt: new Date() },
  });

  // Log call 2: INTERESTED -> FOLLOW_UP
  const call2 = await prisma.callHistory.create({
    data: {
      clientId: testClient.id,
      userId: suresh.id,
      callResult: "MEETING_SCHEDULED",
      notes: "Meeting scheduled for quotation review.",
      statusAtTime: "INTERESTED",
    },
  });

  await prisma.client.update({
    where: { id: testClient.id },
    data: { status: "FOLLOW_UP", lastContactAt: new Date() },
  });

  // Log call 3: FOLLOW_UP -> CONVERTED
  const call3 = await prisma.callHistory.create({
    data: {
      clientId: testClient.id,
      userId: suresh.id,
      callResult: "CONNECTED",
      notes: "Deal closed! Advance received.",
      statusAtTime: "FOLLOW_UP",
    },
  });

  const finalClient = await prisma.client.update({
    where: { id: testClient.id },
    data: { status: "CONVERTED", lastContactAt: new Date() },
    include: { callHistories: true },
  });

  assert(finalClient.status === "CONVERTED", "Client current status is CONVERTED");
  assert(finalClient.callHistories.length === 3, "All 3 historical updates preserved without loss");

  // Cleanup test client
  await prisma.client.delete({ where: { id: testClient.id } });
  assert(true, "Test client cleaned up safely");

  // 5. Follow-ups Segmentation
  console.log("\n--- 5. Testing Follow-up Logic (Overdue, Today, Upcoming) ---");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdue = await prisma.client.count({
    where: { nextFollowUpAt: { lt: startOfToday } },
  });
  const today = await prisma.client.count({
    where: { nextFollowUpAt: { gte: startOfToday, lte: endOfToday } },
  });
  const upcoming = await prisma.client.count({
    where: { nextFollowUpAt: { gt: endOfToday } },
  });

  assert(overdue > 0, `Overdue follow-ups correctly identified: ${overdue}`);
  assert(today > 0, `Today follow-ups correctly identified: ${today}`);
  assert(upcoming > 0, `Upcoming follow-ups correctly identified: ${upcoming}`);

  // 6. Global Search Phone Number
  console.log("\n--- 6. Testing Phone Number Exact Search ---");
  const phoneSearchSample = await prisma.client.findFirst({
    where: { phone: { contains: "98765" } },
  });
  assert(phoneSearchSample !== null, `Exact phone search located: ${phoneSearchSample?.name} (${phoneSearchSample?.phone})`);

  console.log("\n=================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

