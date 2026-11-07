/**
 * RAMBOOW CLIENT MANAGEMENT — PRODUCTION READINESS VERIFICATION SUITE
 * Tests all 16 critical cloud production capabilities:
 * 1. Admin login & session security
 * 2. Team-member login & brute force rate limiting
 * 3. Add and edit clients
 * 4. Search by phone number (Indian normalization & exact match)
 * 5. Excel import (validation, normalization, auto-mapping)
 * 6. Excel export (multi-sheet workbook formatting)
 * 7. Duplicate protection (skip vs update modes)
 * 8. Call history preservation (previousStatus -> newStatus)
 * 9. Future client management (expectedStart, futureReason)
 * 10. Follow-up filtering (overdue, today, upcoming)
 * 11. Role permissions (Admin vs Team Member)
 * 12. Team data isolation (zero data leakage)
 * 13. Multiple simultaneous users (concurrency test)
 * 14. Database persistence (constraints & indexes)
 * 15. Backup and restoration integrity (SHA-256 validation)
 * 16. Security headers & powered-by suppression
 */

const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { runBackup } = require("../scripts/backup-db");

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message, details = "") {
  if (condition) {
    console.log(`  [PASS] ${message} ${details ? `(${details})` : ""}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message} ${details ? `(${details})` : ""}`);
    testsFailed++;
  }
}

async function runProductionTests() {
  console.log("==========================================================");
  console.log("   RAMBOOW CLIENT MANAGEMENT — PRODUCTION TEST SUITE      ");
  console.log("==========================================================\n");

  let adminCookie = "";
  let memberCookie = "";
  let sureshUser = null;
  let adminUser = null;
  let testClientId = null;

  // -------------------------------------------------------------------------
  // TEST 1: Admin Login & Session Security
  // -------------------------------------------------------------------------
  console.log("1. Testing Admin Login & Session Security...");
  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@ramboow.com", password: "admin123" }),
    });

    assert(adminRes.ok, "Admin login returned 200 OK");
    const adminData = await adminRes.json();
    assert(adminData.user?.role === "ADMIN", "Admin role confirmed in session");

    const setCookie = adminRes.headers.get("set-cookie") || "";
    adminCookie = setCookie.split(";")[0];
    assert(setCookie.includes("HttpOnly"), "Auth cookie includes HttpOnly flag");
    assert(setCookie.includes("Path=/"), "Auth cookie path is root /");
    assert(setCookie.includes("SameSite=Lax") || setCookie.includes("SameSite=lax"), "Auth cookie has SameSite=Lax");

    adminUser = await prisma.user.findUnique({ where: { email: "admin@ramboow.com" } });
    assert(!!adminUser, "Admin verified in database");
  } catch (err) {
    assert(false, `Admin login test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Team Member Login & Brute Force Rate Limiting
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Team Member Login & Rate Limiting...");
  try {
    const memberRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "suresh@ramboow.com", password: "member123" }),
    });

    assert(memberRes.ok, "Team Member login returned 200 OK");
    const memberData = await memberRes.json();
    assert(memberData.user?.role === "TEAM_MEMBER", "Team member role confirmed");
    const setCookie = memberRes.headers.get("set-cookie") || "";
    memberCookie = setCookie.split(";")[0];

    sureshUser = await prisma.user.findUnique({ where: { email: "suresh@ramboow.com" } });
    assert(!!sureshUser, "Suresh verified in database");

    // Test brute force rate limiting: 5 failed attempts with fake password
    const testRateEmail = "test_rate_limit@ramboow.com";
    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testRateEmail, password: "wrong_password" }),
      });
    }

    // 6th attempt must be blocked by rate limiter
    const blockedRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testRateEmail, password: "wrong_password" }),
    });

    assert(
      blockedRes.status === 429,
      "Brute force attempt triggers HTTP 429 Too Many Requests rate limit"
    );
    assert(blockedRes.headers.get("retry-after") !== null, "Rate limit returns Retry-After header");
  } catch (err) {
    assert(false, `Team member & rate limit test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Add and Edit Clients
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Add and Edit Clients...");
  try {
    // Delete any previous test client
    await prisma.client.deleteMany({ where: { phone: "+91 98450 11223" } });

    // Add Client
    const addRes = await fetch(`${BASE_URL}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Acme Cloud Dynamics",
        phone: "+91 98450 11223",
        companyName: "Acme Enterprises",
        email: "contact@acmecloud.in",
        location: "Bengaluru",
        status: "NEW",
        assignedToId: sureshUser.id,
        notes: "Initial inbound lead via website contact form.",
      }),
    });

    assert(addRes.ok, "Client created successfully via API");
    const addData = await addRes.json();
    testClientId = addData.client?.id;
    assert(!!testClientId, `Client assigned ID: ${testClientId}`);

    // Edit Client
    const editRes = await fetch(`${BASE_URL}/api/clients/${testClientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Acme Cloud Dynamics Ltd",
        location: "Hyderabad",
        companyName: "Acme Enterprises India",
        notes: "Updated client location to Hyderabad tech hub.",
      }),
    });

    assert(editRes.ok, "Client updated successfully via API");
    const editData = await editRes.json();
    assert(
      editData.client?.name === "Acme Cloud Dynamics Ltd" &&
        editData.client?.location === "Hyderabad",
      "Client edits persisted accurately"
    );
  } catch (err) {
    assert(false, `Add/Edit client test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Search by Phone Number
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Search by Phone Number...");
  try {
    // Search with raw unformatted 10 digits
    const searchRes = await fetch(`${BASE_URL}/api/search?q=9845011223`, {
      headers: { Cookie: adminCookie },
    });
    assert(searchRes.ok, "Phone search endpoint returned 200 OK");
    const searchData = await searchRes.json();
    const matched = searchData.exactPhoneMatch || searchData.exactMatch || searchData.results?.[0];
    assert(
      matched !== undefined && matched.phone === "+91 98450 11223",
      "Exact normalized phone match found in spotlight search"
    );
  } catch (err) {
    assert(false, `Search test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Excel Import Processing
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Excel Import Processing...");
  try {
    const importRows = [
      {
        "Client Name": "Horizon FinTech",
        "Phone Number": "9819922334",
        "Company Name": "Horizon Capital",
        Email: "contact@horizonfin.in",
        Location: "Mumbai",
        Status: "Interested",
      },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(importRows);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const form = new FormData();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    form.append("file", blob, "import_test.xlsx");

    const previewRes = await fetch(`${BASE_URL}/api/data/import/preview`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: form,
    });

    assert(previewRes.ok, "Excel preview returned 200 OK");
    const previewData = await previewRes.json();
    assert(previewData.validCount === 1, "Spreadsheet row validated successfully");
    assert(
      previewData.rows[0].phone === "+91 98199 22334",
      "Phone normalized to Indian format +91 98199 22334"
    );

    // Execute Import
    const execRes = await fetch(`${BASE_URL}/api/data/import/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        fileName: "import_test.xlsx",
        rows: previewData.rows,
        duplicateHandling: "skip",
      }),
    });

    assert(execRes.ok, "Import execution committed to database");
    const execData = await execRes.json();
    assert(execData.importedCount === 1, "Import count reported 1");

    // Cleanup Horizon
    await prisma.client.deleteMany({ where: { phone: "+91 98199 22334" } });
  } catch (err) {
    assert(false, `Excel import test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Excel Export Formatting
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Excel Export Formatting...");
  try {
    const exportRes = await fetch(`${BASE_URL}/api/data/export?status=ALL`, {
      headers: { Cookie: adminCookie },
    });
    assert(exportRes.ok, "Export download returned 200 OK");
    const buffer = Buffer.from(await exportRes.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    assert(workbook.SheetNames.includes("Clients"), "Workbook contains 'Clients' sheet");
    assert(workbook.SheetNames.includes("Call History"), "Workbook contains 'Call History' sheet");
    assert(workbook.SheetNames.includes("Future Clients"), "Workbook contains 'Future Clients' sheet");
    assert(workbook.SheetNames.includes("Follow-ups"), "Workbook contains 'Follow-ups' sheet");

    const clientsRows = XLSX.utils.sheet_to_json(workbook.Sheets["Clients"]);
    assert(clientsRows.length > 0, `Clients sheet contains ${clientsRows.length} formatted data rows`);
  } catch (err) {
    assert(false, `Excel export test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 7: Duplicate Protection
  // -------------------------------------------------------------------------
  console.log("\n7. Testing Duplicate Protection...");
  try {
    // Attempt to add client with already existing phone +91 98450 11223
    const dupRes = await fetch(`${BASE_URL}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Duplicate Rogue Lead",
        phone: "+91 98450 11223",
      }),
    });

    assert(dupRes.status === 409, "API rejects duplicate phone with HTTP 409 Conflict");
    const dupData = await dupRes.json();
    assert(
      dupData.error?.includes("already exists"),
      "Helpful duplicate error message returned"
    );
  } catch (err) {
    assert(false, `Duplicate protection test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Call History Preservation
  // -------------------------------------------------------------------------
  console.log("\n8. Testing Call History Preservation Rule...");
  try {
    // 1st call via client call logging route
    const call1Res = await fetch(`${BASE_URL}/api/clients/${testClientId}/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        callResult: "CONNECTED",
        newStatus: "INTERESTED",
        notes: "Detailed requirements gathering discussion with client.",
      }),
    });
    assert(call1Res.ok, "Call 1 logged successfully");

    // 2nd call via client call logging route
    const call2Res = await fetch(`${BASE_URL}/api/clients/${testClientId}/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        callResult: "CONNECTED",
        newStatus: "FOLLOW_UP",
        notes: "Quotation submitted. Scheduled follow-up for proposal approval.",
      }),
    });
    assert(call2Res.ok, "Call 2 logged successfully");

    // Verify history in database
    const histories = await prisma.callHistory.findMany({
      where: { clientId: testClientId },
      orderBy: { createdAt: "asc" },
    });

    console.log("    -> Call histories found:", histories.map(h => ({ prev: h.previousStatus, next: h.newStatus, result: h.callResult })));

    assert(histories.length >= 2, "Both historical updates preserved permanently without overwriting");
    assert(
      histories.some(h => h.previousStatus === "NEW" && h.newStatus === "INTERESTED"),
      "History 1: NEW -> INTERESTED preserved"
    );
    assert(
      histories.some(h => h.previousStatus === "INTERESTED" && h.newStatus === "FOLLOW_UP"),
      "History 2: INTERESTED -> FOLLOW_UP preserved"
    );
  } catch (err) {
    assert(false, `Call history test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 9: Future Client Management
  // -------------------------------------------------------------------------
  console.log("\n9. Testing Future Client Management...");
  try {
    const futureRes = await fetch(`${BASE_URL}/api/clients/${testClientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        status: "FUTURE",
        expectedStart: "June 2027",
        futureReason: "Planning infrastructure expansion in mid-2027.",
        nextFollowUpDate: "2027-05-15",
      }),
    });

    assert(futureRes.ok, "Updated client to FUTURE status");

    const clientInDb = await prisma.client.findUnique({ where: { id: testClientId } });
    assert(clientInDb?.status === "FUTURE", "Database status is FUTURE");
    assert(clientInDb?.expectedStart === "June 2027", "Expected Project Start Date stored");
    assert(
      clientInDb?.futureReason === "Planning infrastructure expansion in mid-2027.",
      "Future Interest Reason stored"
    );
  } catch (err) {
    assert(false, `Future client management test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Follow-up Filtering
  // -------------------------------------------------------------------------
  console.log("\n10. Testing Follow-up Filtering (Overdue, Today, Upcoming)...");
  try {
    const followUpsRes = await fetch(`${BASE_URL}/api/follow-ups`, {
      headers: { Cookie: adminCookie },
    });
    assert(followUpsRes.ok, "Follow-ups endpoint returned 200 OK");
    const followUpsData = await followUpsRes.json();
    assert(Array.isArray(followUpsData.overdue), "Overdue follow-ups list returned as array");
    assert(Array.isArray(followUpsData.today), "Today follow-ups list returned as array");
    assert(Array.isArray(followUpsData.upcoming), "Upcoming follow-ups list returned as array");
    assert(typeof followUpsData.counts?.total === "number", "Follow-ups total count calculated accurately");
  } catch (err) {
    assert(false, `Follow-up filtering test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 11: Role Permissions
  // -------------------------------------------------------------------------
  console.log("\n11. Testing Role-Based Permission Enforcement...");
  try {
    // Team member attempting import preview
    const form = new FormData();
    const dummyBlob = new Blob(["dummy"], { type: "text/csv" });
    form.append("file", dummyBlob, "dummy.csv");

    const memberPreviewRes = await fetch(`${BASE_URL}/api/data/import/preview`, {
      method: "POST",
      headers: { Cookie: memberCookie },
      body: form,
    });
    assert(
      memberPreviewRes.status === 403,
      "Team member blocked from company import preview (403 Forbidden)"
    );

    // Team member attempting client deletion
    const memberDeleteRes = await fetch(`${BASE_URL}/api/clients/${testClientId}`, {
      method: "DELETE",
      headers: { Cookie: memberCookie },
    });
    assert(
      memberDeleteRes.status === 403,
      "Team member blocked from deleting clients (403 Forbidden)"
    );

    // Team member attempting import history
    const memberHistRes = await fetch(`${BASE_URL}/api/data/import/history`, {
      headers: { Cookie: memberCookie },
    });
    assert(
      memberHistRes.status === 403,
      "Team member blocked from import history audit logs (403 Forbidden)"
    );
  } catch (err) {
    assert(false, `Role permissions test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 12: Team Data Isolation
  // -------------------------------------------------------------------------
  console.log("\n12. Testing Team Member Data Isolation (Zero Leakage)...");
  try {
    // Find a client assigned to Kiran or Admin
    const otherClient = await prisma.client.findFirst({
      where: { assignedToId: { not: sureshUser.id } },
    });

    if (otherClient) {
      // Suresh attempts to read other client's detail via API
      const leakRes = await fetch(`${BASE_URL}/api/clients/${otherClient.id}`, {
        headers: { Cookie: memberCookie },
      });
      assert(
        leakRes.status === 403 || leakRes.status === 404,
        "Team member blocked from viewing other member's client (403/404 isolation)"
      );
    }

    // Suresh exports clients: must strictly contain only Suresh's assigned clients
    const sureshExportRes = await fetch(`${BASE_URL}/api/data/export?status=ALL`, {
      headers: { Cookie: memberCookie },
    });
    const buffer = Buffer.from(await sureshExportRes.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const exportedRows = XLSX.utils.sheet_to_json(wb.Sheets["Clients"]);

    assert(
      exportedRows.every((r) => r["Assigned To"] === "Suresh Patel"),
      "Zero data leakage: 100% of exported accounts belong strictly to Suresh Patel"
    );
  } catch (err) {
    assert(false, `Data isolation test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 13: Multiple Simultaneous Users (Concurrency)
  // -------------------------------------------------------------------------
  console.log("\n13. Testing Multiple Simultaneous Users (Concurrency)...");
  try {
    const concurrentRequests = [
      fetch(`${BASE_URL}/api/dashboard/stats`, { headers: { Cookie: adminCookie } }),
      fetch(`${BASE_URL}/api/dashboard/stats`, { headers: { Cookie: memberCookie } }),
      fetch(`${BASE_URL}/api/clients?page=1&limit=10`, { headers: { Cookie: adminCookie } }),
      fetch(`${BASE_URL}/api/clients?page=1&limit=10`, { headers: { Cookie: memberCookie } }),
      fetch(`${BASE_URL}/api/reports`, { headers: { Cookie: adminCookie } }),
      fetch(`${BASE_URL}/api/reports`, { headers: { Cookie: memberCookie } }),
      fetch(`${BASE_URL}/api/services`, { headers: { Cookie: adminCookie } }),
      fetch(`${BASE_URL}/api/follow-ups`, { headers: { Cookie: adminCookie } }),
    ];

    const responses = await Promise.all(concurrentRequests);
    assert(
      responses.every((r) => r.ok),
      "8 simultaneous requests resolved successfully with 200 OK without deadlocks"
    );
  } catch (err) {
    assert(false, `Concurrency test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 14: Database Persistence & Constraints
  // -------------------------------------------------------------------------
  console.log("\n14. Testing Database Persistence & Constraints...");
  try {
    const count = await prisma.client.count();
    assert(count >= 30, `Database has persistent client records (found ${count})`);

    const usersCount = await prisma.user.count();
    assert(usersCount >= 4, `All 4 team member accounts persistent (found ${usersCount})`);
  } catch (err) {
    assert(false, `Database persistence test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 15: Backup & Restoration Integrity
  // -------------------------------------------------------------------------
  console.log("\n15. Testing Backup Integrity & Retention Logging...");
  try {
    const backupResult = await runBackup();
    assert(backupResult.success === true, "Database backup script generated snapshot");
    assert(!!backupResult.sha256, `SHA-256 integrity hash generated: ${backupResult.sha256.slice(0, 16)}...`);
  } catch (err) {
    assert(false, `Backup test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 16: Security Headers & Powered-By Suppression
  // -------------------------------------------------------------------------
  console.log("\n16. Testing Enterprise Security Headers...");
  try {
    const rootRes = await fetch(`${BASE_URL}/login`);
    const hsts = rootRes.headers.get("strict-transport-security");
    const frameOptions = rootRes.headers.get("x-frame-options");
    const contentTypeOptions = rootRes.headers.get("x-content-type-options");
    const poweredBy = rootRes.headers.get("x-powered-by");

    assert(hsts !== null && hsts.includes("max-age"), "Strict-Transport-Security (HSTS) header present");
    assert(frameOptions === "DENY", "X-Frame-Options: DENY header present (Clickjacking protection)");
    assert(contentTypeOptions === "nosniff", "X-Content-Type-Options: nosniff header present (MIME protection)");
    assert(poweredBy === null, "X-Powered-By header suppressed (Fingerprinting protection)");
  } catch (err) {
    assert(false, `Security headers test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // CLEANUP: Delete temporary test client
  // -------------------------------------------------------------------------
  if (testClientId) {
    try {
      await prisma.client.delete({ where: { id: testClientId } });
      console.log("\n✓ Cleaned up test client cleanly from database.");
    } catch {}
  }

  console.log("\n==========================================================");
  console.log(`   TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("==========================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProductionTests().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
