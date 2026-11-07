# Ramboow Client Management
### Brand: **Ramboow TechSolutions**
> *"Modern solutions. Clean execution."*

A modern, fast, and practical internal client and phone-number management web application built for **Ramboow TechSolutions**. Designed using Ramboow's visual language: Midnight Navy typography, rich crimson red accents, soft ambient glows, rounded cards, and a spacious corporate aesthetic.

---

## 🚀 Live Local Application
The production server is currently running and accessible at:
👉 **[http://localhost:3000](http://localhost:3000)**

### 🔑 Demo Login Accounts

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Rajesh Verma | `admin@ramboow.com` | `admin123` | Full portfolio, team stats, delete/edit, all assignees |
| **Team Member** | Suresh Patel | `suresh@ramboow.com` | `member123` | Assigned clients, log calls, change status, follow-ups |
| **Team Member** | Kiran Sharma | `kiran@ramboow.com` | `member123` | Assigned clients, log calls, change status, follow-ups |
| **Team Member** | Anita Desai | `anita@ramboow.com` | `member123` | Assigned clients, log calls, change status, follow-ups |

*(Quick-fill buttons are also available right on the login screen for instant one-click testing.)*

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons
- **Backend:** Next.js Route Handlers (`force-dynamic` API endpoints)
- **Database & ORM:** Prisma ORM, normalized relational models
  - **Local Development:** SQLite (`file:./dev.db`) with zero setup required
  - **Production:** 100% PostgreSQL ready (simply set `provider = "postgresql"` and `DATABASE_URL` in `.env`)
- **Authentication:** Secure HTTP-only cookies, JSON Web Tokens (JWT), bcryptjs password hashing

---

## ✨ Features Implemented

1. **Dashboard:**
   - Dynamic greeting: *"Good Morning / Afternoon / Evening, [User Name]"*
   - Real-time clickable statistic cards:
     - Total Clients
     - New
     - Interested
     - Follow-up
     - Future
     - Thinking
     - Not Interested
     - Converted
     - No Response
   - Priority urgent alerts: **Overdue Follow-ups** and **Today's Follow-ups**
   - Live stream of recent call updates logged by the team
2. **Clients Directory:**
   - Multi-facet filters: Status, Assigned Team Member, Service Requirement, Date
   - Instant search across Client Name, Phone Number, Company, and Location
   - Multi-column sorting & pagination
3. **Add Client:**
   - Strict validation: Client Name & Phone Number required
   - **Accidental duplicate phone number prevention**: detects existing phone numbers and links directly to the existing profile
4. **Client Profile & Call History Timeline:**
   - Complete profile header with status pill and quick metrics
   - Chronological audit timeline of every call and meeting:
     - Date & time
     - Caller name
     - Call result badge (`CONNECTED`, `NO_RESPONSE`, `BUSY`, `CALL_LATER`, `WRONG_NUMBER`, `MEETING_SCHEDULED`, `OTHER`)
     - Discussion summary notes
     - Next scheduled follow-up
   - **Important Data Rule:** Never loses history when status changes multiple times
5. **Follow-ups Tracker:**
   - Dedicated sections for **OVERDUE** (urgent visual styling), **TODAY**, and **UPCOMING**
   - One-click *"Log Call"* modal directly from the card
6. **Future Clients Pipeline:**
   - Tailored view for prospects with status = `FUTURE`
   - Tracks target implementation timeline (e.g., *"January 2027"*, *"Q2 2027"*)
   - Automatically surfaces in follow-up reminders when the date arrives without altering status without user action
7. **Global Search Modal (`Ctrl+K`):**
   - Keyboard accessible from anywhere
   - Exact phone number search shows instant client profile card and last call/next follow-up details
8. **Team Management (Admin Only):**
   - Consultant workload breakdown: Total Clients, Interested, Future, Follow-ups, and Converted
   - Direct link to view assigned clients per consultant
   - Add new team member modal
9. **Reports & Analytics:**
   - Portfolio conversion metrics
   - Team member performance comparison table
   - Service requirement demand popularity bars
10. **Data Management:**
    - One-click CSV spreadsheet export of client portfolio

---

## 🗄 Prisma Schema & Database Models

- `User`: Team members and administrators with role-based access
- `Client`: Normalized client records with phone, company, status, assignee, and timestamps
- `CallHistory`: Permanent interaction log preserving status snapshots at time of call
- `FollowUp`: Task tracking for scheduled callbacks
- `Service`: Available technology services
- `AuditLog`: Action audit trail

---

## 🏃 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run database verification test suite
node test/verify-app.js

# Re-seed database with realistic demo data
npm run db:seed
```

