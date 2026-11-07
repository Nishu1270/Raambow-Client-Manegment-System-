/**
 * Script to switch Prisma datasource between PostgreSQL (Cloud Production) and SQLite (Local Development)
 * Usage:
 *   node scripts/switch-db-provider.js postgresql
 *   node scripts/switch-db-provider.js sqlite
 */

const fs = require("fs");
const path = require("path");

const targetProvider = process.argv[2]?.toLowerCase();

if (!["postgresql", "sqlite"].includes(targetProvider)) {
  console.error("Usage: node scripts/switch-db-provider.js <postgresql|sqlite>");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schemaContent = fs.readFileSync(schemaPath, "utf-8");

if (targetProvider === "postgresql") {
  // Replace datasource block with PostgreSQL & connection pooling directUrl
  schemaContent = schemaContent.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
  );
  console.log("✓ Switched prisma/schema.prisma to PostgreSQL (Cloud Production Mode)");
  console.log("  - Provider: postgresql");
  console.log("  - Connection pooling: directUrl enabled");
} else {
  // Replace datasource block with SQLite
  schemaContent = schemaContent.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
  console.log("✓ Switched prisma/schema.prisma to SQLite (Local Development Mode)");
  console.log("  - Provider: sqlite");
  console.log("  - File database: dev.db");
}

fs.writeFileSync(schemaPath, schemaContent, "utf-8");

