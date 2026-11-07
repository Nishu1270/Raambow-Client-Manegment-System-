# Ramboow Client Management — Cloud Production Deployment Guide

**Company:** Ramboow TechSolutions  
**Product:** Ramboow Client Management  
**Stack:** Next.js 14 (App Router) • React 18 • TypeScript • Tailwind CSS • Prisma ORM • PostgreSQL • Vercel

---

## 1. Architecture Overview

```
                      +------------------------------------------+
                      |         End Users (Web / Mobile)         |
                      +------------------------------------------+
                                           |
                                  HTTPS (TLS 1.3 / HSTS)
                                           |
                                           v
+--------------------------------------------------------------------------------------+
| Vercel Cloud Platform (Preferred Region: bom1 - Mumbai, India)                       |
|                                                                                      |
|  * Edge Middleware (Route Protection & Session Verification)                         |
|  * Security Headers (HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options)       |
|  * Next.js Serverless Functions (Max Duration: 60s, Max Payload: 4.5 MB)             |
|  * Stateless Memory Processing (Excel Import & Export via Buffers - 0 Disk Writes)   |
|  * In-Memory Sliding-Window Login Rate Limiter (Brute-Force Protection)              |
+--------------------------------------------------------------------------------------+
                                           |
                        +------------------+------------------+
                        |                                     |
               Pooled Queries (Port 6543)            Direct DDL Migrations (Port 5432)
                        |                                     |
                        v                                     v
+--------------------------------------------------------------------------------------+
| Managed Cloud PostgreSQL (Preferred Region: ap-south-1 - Mumbai, India)              |
| Provider: Supabase / Neon / AWS RDS                                                  |
|                                                                                      |
|  * Connection Pooling via pgBouncer / Built-in Pooler                                |
|  * Tables: User, Service, Client, CallHistory, FollowUp, AuditLog, ImportHistory     |
|  * Automated Daily Point-in-Time Snapshots & SHA-256 Verified JSON Backups           |
+--------------------------------------------------------------------------------------+
```

---

## 2. Cloud Database Provisioning (PostgreSQL)

### Recommended Provider & Region
To ensure minimal latency for the Ramboow TechSolutions team in India, provision managed PostgreSQL in the **`ap-south-1` (Mumbai, India)** region.

**Recommended Managed Providers:**
1. **Supabase** (Region: *ap-south-1 Mumbai*) — Includes connection pooling (pgBouncer/Supavisor on port 6543) and direct connection (port 5432).
2. **Neon** (Region: *ap-south-1 Mumbai*) — Serverless PostgreSQL with native connection pooling and direct endpoints.
3. **AWS RDS PostgreSQL** (Region: *ap-south-1 Mumbai*).

### Connection String Extraction
When you create your database project, the provider gives you two connection strings:

1. **Pooled Connection String (`DATABASE_URL`):**
   - Typically on port `6543` with `?pgbouncer=true`.
   - Used by Next.js serverless functions during runtime for connection pooling.
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

2. **Direct Connection String (`DIRECT_URL`):**
   - Typically on port `5432`.
   - Used exclusively by Prisma CLI for running schema migrations (`prisma migrate deploy`).
   ```env
   DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

---

## 3. Database Schema Migration

The repository contains verified migration scripts located in `prisma/migrations/20261105000000_init_postgresql/migration.sql`.

### Migration Execution Procedure

Before deploying the frontend, execute the migration against your cloud database:

```bash
# 1. Switch Prisma to PostgreSQL Production Mode
npm run db:mode:postgres

# 2. Run Migrations against Cloud Database
npx prisma migrate deploy
```

> **Safety Notice:** `prisma migrate deploy` never performs destructive data wipes or schema resets (`drop table`). It applies verified SQL schema DDL and index creation in safe transaction blocks.

---

## 4. Production Administrator Onboarding

**Zero Demo Credentials Policy:** To guarantee security, no demo or testing credentials are deployed into production.

Initialize the real company administrator account:

```bash
# Set your production database URL temporarily in your terminal session, then execute:
node scripts/create-admin.js
```

The script will prompt for:
- **Administrator Name** (e.g. `Rajesh Verma`)
- **Administrator Email** (e.g. `admin@ramboow.com`)
- **Administrator Password** (leave blank to auto-generate a secure 16-character password)

The administrator password is encrypted using **bcrypt with 12 salt rounds** and stored in the production PostgreSQL database.

---

## 5. Application Hosting Setup (Vercel)

### Step 1: Connect Repository to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** $\to$ **Project**.
3. Import the `ramboow-client-management` GitHub/GitLab repository.

### Step 2: Configure Build Settings
- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Build Command:** `next build` (or leave default)
- **Output Directory:** `.next` (leave default)
- **Install Command:** `npm install` (triggers `postinstall: prisma generate`)

### Step 3: Configure Environment Variables
In the Vercel **Environment Variables** tab, add the following production variables:

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production | Pooled PostgreSQL connection string (Port 6543 with `?pgbouncer=true`) |
| `DIRECT_URL` | Production | Direct PostgreSQL connection string (Port 5432) |
| `JWT_SECRET` | Production | High-entropy random secret (64+ characters, generate via `openssl rand -base64 48`) |
| `NEXT_PUBLIC_APP_NAME` | Production | `Ramboow Client Management` |
| `NEXT_PUBLIC_COMPANY_NAME` | Production | `Ramboow TechSolutions` |
| `NEXT_PUBLIC_APP_URL` | Production | `https://crm.ramboow.com` (or your company domain) |
| `NODE_ENV` | Production | `production` |

---

## 6. Custom Domain & DNS Setup

To run the application under a company domain (e.g., `crm.ramboow.com` or `clients.ramboow.com`):

### DNS Configuration

In your DNS provider (Cloudflare, GoDaddy, Namecheap, Route 53):

| Type | Name / Host | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `crm` | `cname.vercel-dns.com.` | Auto / 300s |
| *or* **A** | `@` (Apex domain) | `76.76.21.21` | Auto / 300s |

### Verification & TLS Certificate
1. Go to **Vercel Project Settings** $\to$ **Domains**.
2. Add your custom domain (e.g., `crm.ramboow.com`).
3. Vercel automatically:
   - Validates the DNS record.
   - Issues a free, auto-renewing **Let's Encrypt TLS/SSL Certificate**.
   - Enforces automatic HTTP-to-HTTPS 301 redirection.

---

## 7. Security Architecture & Hardening Verification

The application is pre-configured with enterprise security features:

1. **Enterprise Security Headers (`next.config.mjs`):**
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
   - `X-Frame-Options: DENY` (Clickjacking prevention)
   - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - Suppression of `X-Powered-By` fingerprint header.
2. **Session Cookie Security (`src/app/api/auth/login/route.ts`):**
   - `HttpOnly: true` (Inaccessible to client-side JavaScript / XSS protection)
   - `Secure: true` (Transmitted strictly over HTTPS in production)
   - `SameSite: Lax` (CSRF protection)
   - `Path: /` with 7-day automatic expiry.
3. **Brute-Force Rate Limiting (`src/lib/rate-limit.ts`):**
   - Maximum 5 failed attempts per 15-minute sliding window per IP and email.
   - Triggers `HTTP 429 Too Many Requests` with a `Retry-After` header.
4. **Backend Role Isolation:**
   - Team members are strictly prohibited from viewing or exporting other members' clients.
   - Team members receive `403 Forbidden` on all company import and history routes.

---

## 8. Backup & Disaster Recovery Runbook

### Automated Backups
Managed PostgreSQL providers (Supabase, Neon, AWS RDS) automatically create daily point-in-time recovery (PITR) snapshots.

### Manual / CI/CD Backup Execution
The project includes a lossless, SHA-256 integrity-checked programmatic backup script:

```bash
# Run backup snapshot
npm run db:backup
```
- Backups are stored in `backups/backup_ramboow_crm_<timestamp>.json`.
- A success/failure audit log is updated in `backups/backup.log`.
- Local backup files older than 30 days are automatically pruned.

### Safe Restoration Procedure

> **Critical Safety Rule:** Never test restore procedures directly against the live production database. Always verify backups against a staging or test database first.

To restore a snapshot:
```bash
# 1. Point DATABASE_URL to your staging/test database
# 2. Run restore with mandatory safety confirmation flag:
node scripts/restore-db.js backups/backup_ramboow_crm_<timestamp>.json --confirm-restore
```
The restoration utility:
1. Verifies the SHA-256 checksum to ensure the backup is authentic and uncorrupted.
2. Restores records in strict relational dependency order (`User` $\to$ `Service` $\to$ `Client` $\to$ `CallHistory` $\to$ `FollowUp` $\to$ `ImportHistory` $\to$ `AuditLog`).
3. Re-verifies all foreign key relationships and index integrity.

---

## 9. Verification Test Command Reference

Before promoting any release to production, execute the comprehensive test suite:

```bash
# Run Production Readiness Test Suite (58 automated verification tests)
node test/verify-production-readiness.js

# Run Excel Import & Export Test Suite (56 automated verification tests)
node test/verify-excel-module.js

# Run Core CRM & Improvement Test Suite (41 automated verification tests)
node test/verify-improvements.js
```
*Total verification suite: 155 automated tests passing with 0 failures.*

