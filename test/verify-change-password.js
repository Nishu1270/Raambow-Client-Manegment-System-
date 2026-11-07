/**
 * Test script for verifying Change Password and Admin Reset Password features.
 * Validates:
 * 1. Minimum 12-character enforcement
 * 2. Bcrypt current password verification
 * 3. Mismatch and identical password rejection
 * 4. Invalidation of old credentials and login with new password
 * 5. Role-based protection on Admin Reset Password (non-admin receives 403)
 * 6. Admin can reset member password to >= 12 characters
 * 7. Audit log generation
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING CHANGE PASSWORD & RESET VERIFICATION ===");
  const prisma = new PrismaClient();

  try {
    // 0. Ensure Suresh Patel's password is set to baseline 'member123'
    console.log("\n[Setup] Resetting Suresh Patel password to baseline 'member123'...");
    const initialHash = await bcrypt.hash("member123", 10);
    await prisma.user.updateMany({
      where: { email: "suresh@ramboow.com" },
      data: { passwordHash: initialHash },
    });
    console.log("✔ Suresh Patel baseline password ready.");

    // 1. Log in as Suresh Patel (Team Member)
    console.log("\n[Test 1] Logging in as Suresh Patel (member)...");
    const sureshLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "suresh@ramboow.com", password: "member123" }),
    });

    if (!sureshLoginRes.ok) {
      throw new Error(`Suresh initial login failed: ${sureshLoginRes.status}`);
    }
    const sureshCookie = sureshLoginRes.headers.get("set-cookie");
    console.log("✔ Suresh logged in successfully. Auth cookie obtained.");

    // 2. Attempt Change Password with < 12 chars
    console.log("\n[Test 2] Attempting Change Password with short password (< 12 chars)...");
    const shortRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sureshCookie },
      body: JSON.stringify({
        currentPassword: "member123",
        newPassword: "short1",
        confirmPassword: "short1",
      }),
    });
    const shortData = await shortRes.json();
    console.log(`Status: ${shortRes.status}, Error: "${shortData.error}"`);
    if (shortRes.status !== 400 || !shortData.error.includes("12 characters")) {
      throw new Error("Failed: Short password was not rejected properly!");
    }
    console.log("✔ Short password (< 12 chars) correctly rejected with 400.");

    // 3. Attempt Change Password with incorrect current password
    console.log("\n[Test 3] Attempting Change Password with wrong current password...");
    const wrongRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sureshCookie },
      body: JSON.stringify({
        currentPassword: "WrongPassword123!",
        newPassword: "ValidNewPassword2026#",
        confirmPassword: "ValidNewPassword2026#",
      }),
    });
    const wrongData = await wrongRes.json();
    console.log(`Status: ${wrongRes.status}, Error: "${wrongData.error}"`);
    if (wrongRes.status !== 400 || !wrongData.error.toLowerCase().includes("incorrect")) {
      throw new Error("Failed: Incorrect current password was not rejected properly!");
    }
    console.log("✔ Incorrect current password correctly rejected with 400.");

    // 4. Attempt Change Password with confirmation mismatch
    console.log("\n[Test 4] Attempting Change Password with mismatched confirmation...");
    const mismatchRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sureshCookie },
      body: JSON.stringify({
        currentPassword: "member123",
        newPassword: "ValidNewPassword2026#",
        confirmPassword: "MismatchPassword2026#",
      }),
    });
    const mismatchData = await mismatchRes.json();
    console.log(`Status: ${mismatchRes.status}, Error: "${mismatchData.error}"`);
    if (mismatchRes.status !== 400 || !mismatchData.error.toLowerCase().includes("match")) {
      throw new Error("Failed: Mismatched confirmation was not rejected properly!");
    }
    console.log("✔ Mismatched confirmation correctly rejected with 400.");

    // 5. Successful Change Password to >= 12 chars
    console.log("\n[Test 5] Successfully changing Suresh's password to 12+ char secure password...");
    const NEW_SURESH_PASSWORD = "SureshPatel2026!Secure";
    const changeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sureshCookie },
      body: JSON.stringify({
        currentPassword: "member123",
        newPassword: NEW_SURESH_PASSWORD,
        confirmPassword: NEW_SURESH_PASSWORD,
      }),
    });
    const changeData = await changeRes.json();
    console.log(`Status: ${changeRes.status}, Message: "${changeData.message}"`);
    if (changeRes.status !== 200) {
      throw new Error(`Failed to change password: ${JSON.stringify(changeData)}`);
    }
    console.log("✔ Suresh's password changed successfully.");

    // 6. Test old password fails to log in
    console.log("\n[Test 6] Verifying old password ('member123') can NO LONGER log in...");
    const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "suresh@ramboow.com", password: "member123" }),
    });
    console.log(`Old password login status: ${oldLoginRes.status}`);
    if (oldLoginRes.status === 200) {
      throw new Error("Security Alert: Old password still worked after change!");
    }
    console.log("✔ Old password rejected with 401 as expected.");

    // 7. Test new password successfully logs in
    console.log("\n[Test 7] Verifying new password logs in successfully...");
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "suresh@ramboow.com", password: NEW_SURESH_PASSWORD }),
    });
    if (!newLoginRes.ok) {
      throw new Error(`New password failed to log in: ${newLoginRes.status}`);
    }
    const updatedSureshCookie = newLoginRes.headers.get("set-cookie");
    console.log("✔ New password authenticated successfully!");

    // 8. Test Non-Admin calling Admin Reset Password route -> 403 Forbidden
    console.log("\n[Test 8] Testing non-admin attempting to reset member password...");
    const nonAdminResetRes = await fetch(`${BASE_URL}/api/team/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: updatedSureshCookie },
      body: JSON.stringify({
        userId: "any-user-id",
        newPassword: "UnauthorizedReset123!",
      }),
    });
    console.log(`Non-admin reset status: ${nonAdminResetRes.status}`);
    if (nonAdminResetRes.status !== 403) {
      throw new Error(`Security Alert: Non-admin was not blocked from resetting passwords (got ${nonAdminResetRes.status})`);
    }
    console.log("✔ Non-admin correctly received 403 Forbidden on reset-password endpoint.");

    // 9. Admin logs in and resets Suresh's password
    console.log("\n[Test 9] Admin logging in to test Admin Password Reset...");
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@ramboow.com", password: "admin123" }),
    });
    if (!adminLoginRes.ok) {
      throw new Error("Admin login failed!");
    }
    const adminCookie = adminLoginRes.headers.get("set-cookie");
    console.log("✔ Admin logged in successfully.");

    // Find Suresh's user record in DB
    const sureshUser = await prisma.user.findUnique({
      where: { email: "suresh@ramboow.com" },
    });
    if (!sureshUser) throw new Error("Suresh user record not found in DB!");

    const ADMIN_ASSIGNED_PASSWORD = "AdminAssignedPass2026!";
    console.log(`\n[Test 10] Admin resetting Suresh's password to '${ADMIN_ASSIGNED_PASSWORD}'...`);
    const adminResetRes = await fetch(`${BASE_URL}/api/team/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        userId: sureshUser.id,
        newPassword: ADMIN_ASSIGNED_PASSWORD,
      }),
    });
    const adminResetData = await adminResetRes.json();
    console.log(`Status: ${adminResetRes.status}, Message: "${adminResetData.message}"`);
    if (adminResetRes.status !== 200) {
      throw new Error(`Admin reset failed: ${JSON.stringify(adminResetData)}`);
    }
    console.log("✔ Admin successfully reset Suresh's password.");

    // 11. Test Suresh can log in with admin-assigned password
    console.log("\n[Test 11] Verifying Suresh logs in with the admin-assigned password...");
    const sureshAfterAdminResetLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "suresh@ramboow.com", password: ADMIN_ASSIGNED_PASSWORD }),
    });
    if (!sureshAfterAdminResetLogin.ok) {
      throw new Error("Suresh failed to log in with admin-assigned password!");
    }
    console.log("✔ Suresh logged in successfully with admin-assigned password.");

    // 12. Verify Audit Logs
    console.log("\n[Test 12] Checking AuditLog entries...");
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ["PASSWORD_CHANGED", "ADMIN_RESET_MEMBER_PASSWORD"] },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    console.log(`Found ${recentLogs.length} password-related audit log entries:`);
    recentLogs.forEach((log) => {
      console.log(` - Action: ${log.action}, Details: ${log.details}`);
    });
    if (recentLogs.length < 2) {
      throw new Error("Audit logs for password changes were not found!");
    }
    console.log("✔ Audit log entries recorded properly.");

    // 13. Restore Suresh's password back to 'member123' so standard test suites work
    console.log("\n[Test 13] Restoring Suresh's original test password ('member123')...");
    const originalHash = await bcrypt.hash("member123", 10);
    await prisma.user.update({
      where: { id: sureshUser.id },
      data: { passwordHash: originalHash },
    });
    console.log("✔ Suresh's password safely restored to original baseline.");

    // 14. Verify Admin can change their own password via /api/auth/change-password
    console.log("\n[Test 14] Verifying Admin can change their own password via /api/auth/change-password...");
    const ADMIN_NEW_PASS = "AdminNewSecurePass2026!";
    const adminChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        currentPassword: "admin123",
        newPassword: ADMIN_NEW_PASS,
        confirmPassword: ADMIN_NEW_PASS,
      }),
    });
    const adminChangeData = await adminChangeRes.json();
    console.log(`Status: ${adminChangeRes.status}, Message: "${adminChangeData.message}"`);
    if (adminChangeRes.status !== 200) {
      throw new Error(`Admin failed to change password: ${JSON.stringify(adminChangeData)}`);
    }
    console.log("✔ Admin successfully changed own password.");

    // 15. Restore Admin's password back to 'admin123'
    console.log("\n[Test 15] Restoring Admin password back to 'admin123'...");
    const adminOriginalHash = await bcrypt.hash("admin123", 10);
    await prisma.user.update({
      where: { email: "admin@ramboow.com" },
      data: { passwordHash: adminOriginalHash },
    });
    console.log("✔ Admin password restored to baseline 'admin123'.");

    console.log("\n=======================================================");
    console.log("🎉 ALL CHANGE PASSWORD & RESET VERIFICATION TESTS PASSED!");
    console.log("=======================================================\n");
  } finally {
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
