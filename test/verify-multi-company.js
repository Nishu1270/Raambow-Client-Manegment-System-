const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== MULTI-COMPANY FUNCTIONAL TEST SUITE ===");

  try {
    // 1. Verify existing projects default to RAAMBOW
    console.log("\n[Test 1] Verifying existing projects default to RAAMBOW...");
    const existingClients = await prisma.client.findMany({
      select: { id: true, name: true, company: true },
    });
    console.log(`Found ${existingClients.length} existing clients in database.`);
    for (const c of existingClients) {
      if (c.company !== "RAAMBOW" && c.company !== "KATERNGERS") {
        throw new Error(`Client ${c.name} (${c.id}) has invalid company: ${c.company}`);
      }
      console.log(` - Client "${c.name}": Company = ${c.company} (PASS)`);
    }

    // 2. Create a test project for RAAMBOW
    console.log("\n[Test 2] Creating a test project for RAAMBOW...");
    const testRaambow = await prisma.client.create({
      data: {
        name: "Test Alpha Raambow Project",
        phone: "+91 99999 11111",
        companyName: "Alpha Enterprises",
        company: "RAAMBOW",
        status: "NEW",
        notes: "Automated test project for RAAMBOW",
      },
    });
    console.log(`Created RAAMBOW project ID: ${testRaambow.id}, Company: ${testRaambow.company}`);
    if (testRaambow.company !== "RAAMBOW") throw new Error("Expected company to be RAAMBOW");

    // 3. Create a test project for KATERNGERS
    console.log("\n[Test 3] Creating a test project for KATERNGERS...");
    const testKaterngers = await prisma.client.create({
      data: {
        name: "Test Beta Katerngers Project",
        phone: "+91 99999 22222",
        companyName: "Beta Corp",
        company: "KATERNGERS",
        status: "INTERESTED",
        notes: "Automated test project for KATERNGERS",
      },
    });
    console.log(`Created KATERNGERS project ID: ${testKaterngers.id}, Company: ${testKaterngers.company}`);
    if (testKaterngers.company !== "KATERNGERS") throw new Error("Expected company to be KATERNGERS");

    // 4. Test Editing a project's company (RAAMBOW -> KATERNGERS and vice versa)
    console.log("\n[Test 4] Editing project company (RAAMBOW -> KATERNGERS)...");
    const updatedProject = await prisma.client.update({
      where: { id: testRaambow.id },
      data: { company: "KATERNGERS" },
    });
    console.log(`Updated project ID ${updatedProject.id} company to: ${updatedProject.company}`);
    if (updatedProject.company !== "KATERNGERS") throw new Error("Expected updated company to be KATERNGERS");

    // Revert back
    const revertedProject = await prisma.client.update({
      where: { id: testRaambow.id },
      data: { company: "RAAMBOW" },
    });
    if (revertedProject.company !== "RAAMBOW") throw new Error("Expected reverted company to be RAAMBOW");
    console.log(`Reverted project ID ${revertedProject.id} company back to: ${revertedProject.company} (PASS)`);

    // 5. Test Filtering projects by company
    console.log("\n[Test 5] Querying filtered projects by company...");
    const raambowList = await prisma.client.findMany({
      where: { company: "RAAMBOW" },
      select: { id: true, name: true, company: true },
    });
    console.log(`RAAMBOW filter returned ${raambowList.length} project(s).`);
    if (!raambowList.some((p) => p.id === testRaambow.id)) {
      throw new Error("Filtered RAAMBOW list missing testRaambow");
    }
    if (raambowList.some((p) => p.company !== "RAAMBOW")) {
      throw new Error("Filtered RAAMBOW list contained non-RAAMBOW project");
    }

    const katerngersList = await prisma.client.findMany({
      where: { company: "KATERNGERS" },
      select: { id: true, name: true, company: true },
    });
    console.log(`KATERNGERS filter returned ${katerngersList.length} project(s).`);
    if (!katerngersList.some((p) => p.id === testKaterngers.id)) {
      throw new Error("Filtered KATERNGERS list missing testKaterngers");
    }
    if (katerngersList.some((p) => p.company !== "KATERNGERS")) {
      throw new Error("Filtered KATERNGERS list contained non-KATERNGERS project");
    }
    console.log("Filtering verification passed! (PASS)");

    // 6. Clean up test records
    console.log("\n[Cleanup] Removing temporary test records...");
    await prisma.client.deleteMany({
      where: { id: { in: [testRaambow.id, testKaterngers.id] } },
    });
    console.log("Cleaned up test records cleanly.");

    console.log("\n>>> ALL MULTI-COMPANY FUNCTIONAL TESTS PASSED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

