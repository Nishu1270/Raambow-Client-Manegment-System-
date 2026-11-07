/**
 * Dynamic Prisma Schema Preparation Utility
 * 
 * Automatically ensures prisma/schema.prisma is configured with the correct
 * datasource provider based on the execution environment:
 * 
 * - Vercel / Production / PostgreSQL: Configures 'postgresql' provider with directUrl.
 * - Local Development / SQLite: Configures 'sqlite' provider pointing to dev.db.
 */

const fs = require("fs");
const path = require("path");

const projectDir = path.join(__dirname, "..");
const schemaPath = path.join(projectDir, "prisma", "schema.prisma");

function loadEnv() {
  const envFiles = [".env.supabase", ".env.production", ".env.local", ".env"];
  for (const fileName of envFiles) {
    const filePath = path.join(projectDir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let val = match[2] || "";
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val.trim();
            }
          }
        }
      } catch (e) {}
    }
  }
}

function main() {
  loadEnv();

  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const dbUrl = process.env.DATABASE_URL || "";
  const isPostgresUrl = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
  const forcePostgres = process.argv.includes("--postgres") || process.env.PRISMA_MODE === "postgres";
  const forceSqlite = process.argv.includes("--sqlite") || process.env.PRISMA_MODE === "sqlite";

  let targetProvider = "sqlite";
  if (forcePostgres || ((isVercel || isPostgresUrl) && !forceSqlite)) {
    targetProvider = "postgresql";
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(`Error: ${schemaPath} does not exist.`);
    process.exit(1);
  }

  let schemaContent = fs.readFileSync(schemaPath, "utf-8");

  if (targetProvider === "postgresql") {
    schemaContent = schemaContent.replace(
      /datasource db \{[\s\S]*?\}/,
      `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
    );
    fs.writeFileSync(schemaPath, schemaContent, "utf-8");
    console.log("✓ [Prisma Setup] Configured schema.prisma for PostgreSQL (Cloud / Vercel Production Mode)");
  } else {
    schemaContent = schemaContent.replace(
      /datasource db \{[\s\S]*?\}/,
      `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
    );
    fs.writeFileSync(schemaPath, schemaContent, "utf-8");
    console.log("✓ [Prisma Setup] Configured schema.prisma for SQLite (Local Development Mode)");
  }
}

main();

