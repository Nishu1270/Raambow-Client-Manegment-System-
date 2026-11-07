const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("   RAMBOOW CLIENT MANAGEMENT — EXCEL MODULE TEST SUITE    ");
  console.log("==========================================================\n");

  let adminCookie = "";
  let memberCookie = "";
  let sureshUser = null;

  // -------------------------------------------------------------------------
  // TEST 1: User Logins (Admin & Team Member)
  // -------------------------------------------------------------------------
  console.log("1. Authenticating Admin and Team Member...");
  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@ramboow.com", password: "admin123" }),
    });
    assert(adminRes.ok, "Admin login successful");
    const adminSetCookie = adminRes.headers.get("set-cookie") || "";
    adminCookie = adminSetCookie.split(";")[0];

    const memberRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "suresh@ramboow.com", password: "member123" }),
    });
    assert(memberRes.ok, "Team Member login successful");
    const memberSetCookie = memberRes.headers.get("set-cookie") || "";
    memberCookie = memberSetCookie.split(";")[0];

    sureshUser = await prisma.user.findUnique({ where: { email: "suresh@ramboow.com" } });
    assert(!!sureshUser, `Found Suresh in DB with ID: ${sureshUser?.id}`);
  } catch (err) {
    assert(false, `Authentication failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Template Download
  // -------------------------------------------------------------------------
  console.log("\n2. Verifying Excel Template Download (/api/data/import/template)...");
  try {
    const tmplRes = await fetch(`${BASE_URL}/api/data/import/template`);
    assert(tmplRes.ok, "Template endpoint returned 200 OK");
    assert(
      tmplRes.headers.get("content-type")?.includes("spreadsheetml"),
      "Template returns correct XLSX MIME type"
    );

    const tmplBuffer = Buffer.from(await tmplRes.arrayBuffer());
    const tmplWb = XLSX.read(tmplBuffer, { type: "buffer" });
    assert(tmplWb.SheetNames.includes("Clients Template"), "Template contains 'Clients Template' sheet");

    const tmplJson = XLSX.utils.sheet_to_json(tmplWb.Sheets["Clients Template"]);
    assert(tmplJson.length >= 3, `Template contains sample rows (found ${tmplJson.length})`);
    assert("Client Name" in tmplJson[0], "Template contains 'Client Name' header");
    assert("Phone Number" in tmplJson[0], "Template contains 'Phone Number' header");
  } catch (err) {
    assert(false, `Template test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Permission Verification (Team Member blocked from company import)
  // -------------------------------------------------------------------------
  console.log("\n3. Verifying Import Security & Role Enforcement...");
  try {
    // Team member preview attempt
    const form = new FormData();
    const dummyBlob = new Blob(["test"], { type: "text/csv" });
    form.append("file", dummyBlob, "test.csv");

    const memberPreviewRes = await fetch(`${BASE_URL}/api/data/import/preview`, {
      method: "POST",
      headers: { Cookie: memberCookie },
      body: form,
    });
    assert(memberPreviewRes.status === 403, "Team member blocked from import preview (403 Forbidden)");

    // Team member execute attempt
    const memberExecRes = await fetch(`${BASE_URL}/api/data/import/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: memberCookie },
      body: JSON.stringify({ fileName: "hack.xlsx", rows: [] }),
    });
    assert(memberExecRes.status === 403, "Team member blocked from import execution (403 Forbidden)");

    // Team member history attempt
    const memberHistRes = await fetch(`${BASE_URL}/api/data/import/history`, {
      headers: { Cookie: memberCookie },
    });
    assert(memberHistRes.status === 403, "Team member blocked from import history (403 Forbidden)");
  } catch (err) {
    assert(false, `Permission check failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Excel Import Preview & Validation (Admin)
  // -------------------------------------------------------------------------
  console.log("\n4. Verifying Import Preview, Normalization, & Duplicate Detection...");
  try {
    // Ensure clean state before import test
    await prisma.client.deleteMany({
      where: { phone: { in: ["+91 98765 43210", "+91 98765 43297"] } },
    });

    // Construct test workbook with various cases
    const testRows = [
      {
        "Client Name": "Rohan Verma",
        "Phone Number": "9876543210", // Raw 10 digits
        "Company Name": "Verma Technologies",
        Email: "rohan@vermatech.in",
        Location: "Bengaluru",
        Service: "Web Development",
        Status: "Interested",
        "Assigned Team Member": "Rajesh Verma",
      },
      {
        "Client Name": "Duplicate In File Rohan",
        "Phone Number": "+91 98765 43210", // In-file duplicate of row 1
        "Company Name": "Verma Tech Duplicate",
        Email: "rohan2@vermatech.in",
        Status: "New",
      },
      {
        "Client Name": "Duplicate Ananya DB",
        "Phone Number": "+91 98301 98765", // Existing client in dev.db (Ananya Roy)
        "Company Name": "Roy Enterprise",
        Status: "Follow-up",
      },
      {
        "Client Name": "Invalid Phone Client",
        "Phone Number": "12345", // Bad length
        "Company Name": "Bad Phone Co",
        Status: "New",
      },
      {
        "Client Name": "", // Missing name
        "Phone Number": "9876543299",
        "Company Name": "No Name LLC",
        Status: "New",
      },
      {
        "Client Name": "Invalid Email Client",
        "Phone Number": "9876543298",
        Email: "not-an-email-format", // Invalid email regex
        Status: "New",
      },
      {
        "Client Name": "Neha Gupta",
        "Phone Number": "09876543297", // 11 digits starting with 0
        "Company Name": "Gupta Logistics",
        Email: "neha@gupta.com",
        Service: "Mobile App Development",
        Status: "Future",
        "Expected Start Date": "March 2027",
        "Future Interest Reason": "Opening Mumbai office next year",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(testRows);
    XLSX.utils.book_append_sheet(wb, ws, "Upload Test");
    const testBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Send to preview endpoint
    const formData = new FormData();
    const testBlob = new Blob([testBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    formData.append("file", testBlob, "test_leads.xlsx");

    const previewRes = await fetch(`${BASE_URL}/api/data/import/preview`, {
      method: "POST",
      headers: { Cookie: adminCookie },
      body: formData,
    });

    assert(previewRes.ok, "Import preview returned 200 OK");
    const previewData = await previewRes.json();

    assert(previewData.totalRows === 7, `Total rows recognized is 7 (got ${previewData.totalRows})`);
    assert(previewData.validCount === 2, `Valid count is 2 (got ${previewData.validCount})`);
    assert(previewData.duplicateCount === 2, `Duplicate count is 2 (got ${previewData.duplicateCount})`);
    assert(previewData.invalidCount === 3, `Invalid count is 3 (got ${previewData.invalidCount})`);

    // Verify phone normalizations
    const rohanRow = previewData.rows.find((r) => r.name === "Rohan Verma");
    assert(rohanRow?.phone === "+91 98765 43210", `Phone normalized to '+91 98765 43210' (got ${rohanRow?.phone})`);

    const nehaRow = previewData.rows.find((r) => r.name === "Neha Gupta");
    assert(nehaRow?.phone === "+91 98765 43297", `0-prefixed phone normalized to '+91 98765 43297' (got ${nehaRow?.phone})`);

    // Verify DB duplicate detection
    const dbDupRow = previewData.rows.find((r) => r.name === "Duplicate Ananya DB");
    assert(dbDupRow?.isDuplicateInDb === true, "Detected duplicate in database against +91 98301 98765");
    assert(!!dbDupRow?.existingClientId, `Identified existing client ID: ${dbDupRow?.existingClientId}`);

    // Verify In-file duplicate detection
    const fileDupRow = previewData.rows.find((r) => r.name === "Duplicate In File Rohan");
    assert(fileDupRow?.isDuplicateInFile === true, "Detected in-file duplicate");

    // -----------------------------------------------------------------------
    // TEST 5: Execute Import (Skip Duplicates Mode)
    // -----------------------------------------------------------------------
    console.log("\n5. Verifying Import Execution with 'skip' Duplicates Mode...");
    const execRes = await fetch(`${BASE_URL}/api/data/import/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        fileName: "test_leads.xlsx",
        rows: previewData.rows,
        duplicateHandling: "skip",
        defaultAssigneeId: sureshUser.id,
      }),
    });

    assert(execRes.ok, "Import execution returned 200 OK");
    const execData = await execRes.json();

    assert(execData.importedCount === 2, `Imported 2 fresh records (got ${execData.importedCount})`);
    assert(execData.skippedCount === 2, `Skipped 2 duplicate records (got ${execData.skippedCount})`);
    assert(execData.failedCount === 3, `Recorded 3 failed rows (got ${execData.failedCount})`);

    // Verify DB records landed
    const rohanDb = await prisma.client.findUnique({ where: { phone: "+91 98765 43210" } });
    assert(!!rohanDb && rohanDb.name === "Rohan Verma", "Rohan Verma exists in database");

    const nehaDb = await prisma.client.findUnique({ where: { phone: "+91 98765 43297" } });
    assert(!!nehaDb && nehaDb.status === "FUTURE" && nehaDb.expectedStart === "March 2027", "Neha Gupta saved with FUTURE status and expected start date");

    // Verify ImportHistory record
    const historyRecord = await prisma.importHistory.findFirst({
      where: { fileName: "test_leads.xlsx" },
      orderBy: { createdAt: "desc" },
    });
    assert(!!historyRecord, "ImportHistory record was created in database");
    assert(historyRecord?.importedRows === 2, `History recorded importedRows: ${historyRecord?.importedRows}`);
    assert(historyRecord?.skippedRows === 2, `History recorded skippedRows: ${historyRecord?.skippedRows}`);
    assert(historyRecord?.failedRows === 3, `History recorded failedRows: ${historyRecord?.failedRows}`);
    assert(historyRecord?.status === "PARTIAL", `History status is 'PARTIAL' (got ${historyRecord?.status})`);

    // -----------------------------------------------------------------------
    // TEST 6: Execute Import (Update Duplicates Mode)
    // -----------------------------------------------------------------------
    console.log("\n6. Verifying Import Execution with 'update' Duplicates Mode...");
    const updateRows = [
      {
        rowNumber: 2,
        name: "Rohan Verma",
        phone: "+91 98765 43210",
        companyName: "Verma Global Solutions Pvt Ltd",
        status: "CONVERTED",
        isDuplicateInDb: true,
        existingClientId: rohanDb.id,
        errors: [],
        warnings: [],
      },
    ];

    const updateExecRes = await fetch(`${BASE_URL}/api/data/import/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        fileName: "update_leads.xlsx",
        rows: updateRows,
        duplicateHandling: "update",
      }),
    });

    assert(updateExecRes.ok, "Update execution returned 200 OK");
    const updateExecData = await updateExecRes.json();
    assert(updateExecData.updatedCount === 1, `Updated count is 1 (got ${updateExecData.updatedCount})`);

    const rohanUpdated = await prisma.client.findUnique({ where: { id: rohanDb.id } });
    assert(rohanUpdated?.companyName === "Verma Global Solutions Pvt Ltd", "Rohan company name was successfully updated");
    assert(rohanUpdated?.status === "CONVERTED", "Rohan status was successfully updated to CONVERTED");

    // -----------------------------------------------------------------------
    // TEST 7: Failed Rows Download Endpoint
    // -----------------------------------------------------------------------
    console.log("\n7. Verifying Failed Rows Download (/api/data/import/failed-download)...");
    const failedDlRes = await fetch(`${BASE_URL}/api/data/import/failed-download`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ failedRecords: execData.failedRecords }),
    });

    assert(failedDlRes.ok, "Failed download returned 200 OK");
    const failedDlBuffer = Buffer.from(await failedDlRes.arrayBuffer());
    const failedWb = XLSX.read(failedDlBuffer, { type: "buffer" });
    assert(failedWb.SheetNames.includes("Failed Rows"), "Workbook contains 'Failed Rows' sheet");
    const failedRowsJson = XLSX.utils.sheet_to_json(failedWb.Sheets["Failed Rows"]);
    assert(failedRowsJson.length === 3, `Contains 3 failed rows with error reasons (found ${failedRowsJson.length})`);
    assert("Error Reason(s)" in failedRowsJson[0], "Error reasons column is present");

    // -----------------------------------------------------------------------
    // TEST 8: Excel Export (Admin Scope & Multi-sheet formatting)
    // -----------------------------------------------------------------------
    console.log("\n8. Verifying Excel Export for Admin (All Records & Multi-Sheet)...");
    const adminExportRes = await fetch(`${BASE_URL}/api/data/export?status=ALL`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminExportRes.ok, "Admin export returned 200 OK");
    const adminExportBuffer = Buffer.from(await adminExportRes.arrayBuffer());
    const adminExportWb = XLSX.read(adminExportBuffer, { type: "buffer" });

    assert(adminExportWb.SheetNames.includes("Clients"), "Export workbook contains 'Clients' sheet");
    assert(adminExportWb.SheetNames.includes("Call History"), "Export workbook contains 'Call History' sheet");
    assert(adminExportWb.SheetNames.includes("Future Clients"), "Export workbook contains 'Future Clients' sheet");
    assert(adminExportWb.SheetNames.includes("Follow-ups"), "Export workbook contains 'Follow-ups' sheet");

    const exportedClients = XLSX.utils.sheet_to_json(adminExportWb.Sheets["Clients"]);
    assert(exportedClients.length >= 34, `Admin exported all company records (found ${exportedClients.length} clients)`);

    // -----------------------------------------------------------------------
    // TEST 9: Excel Export (Team Member Scope Isolation)
    // -----------------------------------------------------------------------
    console.log("\n9. Verifying Excel Export Scoping for Team Member (Suresh)...");
    const memberExportRes = await fetch(`${BASE_URL}/api/data/export?status=ALL`, {
      headers: { Cookie: memberCookie },
    });
    assert(memberExportRes.ok, "Team Member export returned 200 OK");
    const memberExportBuffer = Buffer.from(await memberExportRes.arrayBuffer());
    const memberExportWb = XLSX.read(memberExportBuffer, { type: "buffer" });

    const memberExportedClients = XLSX.utils.sheet_to_json(memberExportWb.Sheets["Clients"]);
    // In dev.db, Suresh has 11 assigned clients + 1 Neha (assigned to Suresh via defaultAssignee) = 12
    console.log(`  -> Suresh received ${memberExportedClients.length} clients`);
    assert(memberExportedClients.length > 0, "Suresh received assigned clients");
    assert(
      memberExportedClients.every((c) => c["Assigned To"] === "Suresh Patel"),
      "Zero data leak: 100% of exported clients belong strictly to Suresh Patel"
    );

    // -----------------------------------------------------------------------
    // TEST 10: Status Filter Export
    // -----------------------------------------------------------------------
    console.log("\n10. Verifying Status-Filtered Excel Export...");
    const futureExportRes = await fetch(`${BASE_URL}/api/data/export?status=FUTURE`, {
      headers: { Cookie: adminCookie },
    });
    assert(futureExportRes.ok, "Future status export returned 200 OK");
    const futureExportBuffer = Buffer.from(await futureExportRes.arrayBuffer());
    const futureExportWb = XLSX.read(futureExportBuffer, { type: "buffer" });
    const futureClients = XLSX.utils.sheet_to_json(futureExportWb.Sheets["Clients"]);
    assert(
      futureClients.every((c) => c["Status"] === "FUTURE"),
      `All exported records have status 'FUTURE' (found ${futureClients.length})`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Import History API
    // -------------------------------------------------------------------------
    console.log("\n11. Verifying Import History API for Admin...");
    const histRes = await fetch(`${BASE_URL}/api/data/import/history`, {
      headers: { Cookie: adminCookie },
    });
    assert(histRes.ok, "Import history returned 200 OK");
    const histData = await histRes.json();
    assert(histData.histories?.length >= 2, `Retrieved ${histData.histories?.length} import history logs`);
    assert(histData.histories[0].uploadedBy?.email === "admin@ramboow.com", "Uploader email recorded correctly");

    // -------------------------------------------------------------------------
    // CLEANUP: Clean up test created rows
    // -------------------------------------------------------------------------
    console.log("\n12. Cleaning up test data...");
    await prisma.client.deleteMany({
      where: {
        phone: { in: ["+91 98765 43210", "+91 98765 43297"] },
      },
    });
    await prisma.importHistory.deleteMany({
      where: {
        fileName: { in: ["test_leads.xlsx", "update_leads.xlsx"] },
      },
    });

    const finalCount = await prisma.client.count();
    assert(finalCount === 32, `Database returned to original pristine state: 32 clients (found ${finalCount})`);
  } catch (err) {
    assert(false, `Unexpected error during test execution: ${err.message}`);
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

runTests();
