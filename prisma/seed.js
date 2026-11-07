const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding for Ramboow Client Management...");

  // Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.callHistory.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleaned existing tables.");

  // 1. Create Services
  const servicesData = [
    { name: "Website Development", description: "Modern, responsive, fast corporate and landing websites" },
    { name: "Mobile App Development", description: "iOS and Android apps using React Native / Flutter / Native" },
    { name: "Custom CRM & ERP", description: "Tailored enterprise workflow and client management software" },
    { name: "Cloud & DevOps Solutions", description: "AWS, GCP, Azure infrastructure migration, CI/CD, and scaling" },
    { name: "UI/UX Design & Branding", description: "Product design, wireframing, design systems, and identity" },
    { name: "E-Commerce Platforms", description: "Scalable B2B & B2C online shopping experiences and payment integrations" },
    { name: "API & System Integration", description: "High-performance microservices, webhooks, and third-party integrations" },
  ];

  const services = {};
  for (const s of servicesData) {
    const created = await prisma.service.create({ data: s });
    services[s.name] = created.id;
  }
  console.log(`✅ Created ${Object.keys(services).length} services.`);

  // 2. Create Users (Admin & Team Members)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);
  const memberPasswordHash = await bcrypt.hash("member123", salt);

  const admin = await prisma.user.create({
    data: {
      name: "Rajesh Verma",
      email: "admin@ramboow.com",
      phone: "+91 98201 11222",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const suresh = await prisma.user.create({
    data: {
      name: "Suresh Patel",
      email: "suresh@ramboow.com",
      phone: "+91 98201 22333",
      passwordHash: memberPasswordHash,
      role: "TEAM_MEMBER",
    },
  });

  const kiran = await prisma.user.create({
    data: {
      name: "Kiran Sharma",
      email: "kiran@ramboow.com",
      phone: "+91 98201 33444",
      passwordHash: memberPasswordHash,
      role: "TEAM_MEMBER",
    },
  });

  const anita = await prisma.user.create({
    data: {
      name: "Anita Desai",
      email: "anita@ramboow.com",
      phone: "+91 98201 44555",
      passwordHash: memberPasswordHash,
      role: "TEAM_MEMBER",
    },
  });

  console.log("✅ Created 4 users (1 Admin: Rajesh, 3 Members: Suresh, Kiran, Anita).");

  // Current reference date: Nov 4, 2026
  const now = new Date("2026-11-04T12:00:00Z");

  // Helper for dates
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // 3. Create 32 Realistic Clients across diverse Indian and Global businesses
  const clientsData = [
    // --- INTERESTED ---
    {
      name: "Ravi Kumar",
      phone: "+91 98765 43210",
      email: "ravi@abctraders.in",
      companyName: "ABC Traders",
      location: "Mumbai, Maharashtra",
      serviceName: "Website Development",
      assignedTo: suresh.id,
      status: "INTERESTED",
      notes: "Wholesale distributor looking for an ultra-fast modern product showcase catalog website with inquiry generation.",
      lastContactAt: daysAgo(1), // Nov 3, 2026
      nextFollowUpAt: daysAhead(1), // Tomorrow: Nov 5, 2026 11:30 AM
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Initial discovery call. Discussed product catalog needs, estimated 25 pages, wants Next.js tech stack.",
          statusAtTime: "NEW",
          calledAt: daysAgo(5),
          nextFollowUpAt: daysAgo(3),
        },
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Shared Ramboow corporate presentation and rough scope. Client liked the clean design aesthetic.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(3),
          nextFollowUpAt: daysAgo(1),
        },
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Customer asked for final quotation with payment schedule. Sending quotation today.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(1),
          nextFollowUpAt: daysAhead(1),
        },
      ],
    },
    {
      name: "Vikram Malhotra",
      phone: "+91 98111 22334",
      email: "vikram@malhotratex.com",
      companyName: "Malhotra Textiles",
      location: "Surat, Gujarat",
      serviceName: "E-Commerce Platforms",
      assignedTo: suresh.id,
      status: "INTERESTED",
      notes: "B2B fabric manufacturer wanting a private portal for bulk order booking.",
      lastContactAt: daysAgo(2),
      nextFollowUpAt: daysAhead(2),
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Walked through B2B e-commerce capabilities. Very interested in GST invoice automation.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(2),
          nextFollowUpAt: daysAhead(2),
        },
      ],
    },
    {
      name: "Pooja Hegde",
      phone: "+91 98220 55441",
      email: "pooja@zenithclinics.com",
      companyName: "Zenith Dental Clinics",
      location: "Bengaluru, Karnataka",
      serviceName: "Website Development",
      assignedTo: kiran.id,
      status: "INTERESTED",
      notes: "Multi-branch dental chain needing a responsive website with online appointment scheduling.",
      lastContactAt: daysAgo(1),
      nextFollowUpAt: daysAhead(3),
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Reviewed their current sluggish WordPress site. Emphasized modern speed and SEO benefits.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(1),
          nextFollowUpAt: daysAhead(3),
        },
      ],
    },
    {
      name: "Amit Singhal",
      phone: "+91 98334 66778",
      email: "amit@singhalfintech.io",
      companyName: "Singhal Financial Services",
      location: "Gurugram, Haryana",
      serviceName: "Custom CRM & ERP",
      assignedTo: anita.id,
      status: "INTERESTED",
      notes: "Needs secure loan application workflow management dashboard with role-based access.",
      lastContactAt: daysAgo(3),
      nextFollowUpAt: daysAhead(1),
      history: [
        {
          userId: anita.id,
          callResult: "CONNECTED",
          notes: "Technical discussion with their IT lead. Outlined architecture and data security standards.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(3),
          nextFollowUpAt: daysAhead(1),
        },
      ],
    },
    {
      name: "David Ross",
      phone: "+1 415 890 2341",
      email: "david@luminaudio.com",
      companyName: "Lumin Audio Systems",
      location: "Austin, Texas, USA",
      serviceName: "UI/UX Design & Branding",
      assignedTo: kiran.id,
      status: "INTERESTED",
      notes: "Hardware audio brand refreshing their mobile app user interface.",
      lastContactAt: daysAgo(2),
      nextFollowUpAt: daysAhead(4),
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Showed Ramboow UI design portfolio. Client impressed with dark/light theme work.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(2),
          nextFollowUpAt: daysAhead(4),
        },
      ],
    },

    // --- FOLLOW_UP ---
    {
      name: "Meera Krishnan",
      phone: "+91 97401 88992",
      email: "meera@ayurwellness.in",
      companyName: "AyurVeda Naturals",
      location: "Kochi, Kerala",
      serviceName: "E-Commerce Platforms",
      assignedTo: suresh.id,
      status: "FOLLOW_UP",
      notes: "High priority follow-up. Waiting for their board decision on technology partner.",
      lastContactAt: daysAgo(2),
      nextFollowUpAt: now, // TODAY! Nov 4, 2026
      history: [
        {
          userId: suresh.id,
          callResult: "CALL_LATER",
          notes: "Board meeting is in progress this morning. Asked to call at 4:30 PM today.",
          statusAtTime: "FOLLOW_UP",
          calledAt: daysAgo(2),
          nextFollowUpAt: now,
        },
      ],
    },
    {
      name: "Sanjay Gupta",
      phone: "+91 98100 44556",
      email: "sanjay@guptasteels.com",
      companyName: "Gupta Steel & Tubes",
      location: "Faridabad, Haryana",
      serviceName: "Website Development",
      assignedTo: kiran.id,
      status: "FOLLOW_UP",
      notes: "Needs industrial equipment catalog with PDF download support.",
      lastContactAt: daysAgo(1),
      nextFollowUpAt: now, // TODAY!
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Discussed quotation figures. Promised to confirm order advance today.",
          statusAtTime: "FOLLOW_UP",
          calledAt: daysAgo(1),
          nextFollowUpAt: now,
        },
      ],
    },
    {
      name: "Naveen Reddy",
      phone: "+91 99887 76655",
      email: "naveen@reddyinfra.co",
      companyName: "Reddy Infrastructure",
      location: "Hyderabad, Telangana",
      serviceName: "Custom CRM & ERP",
      assignedTo: anita.id,
      status: "FOLLOW_UP",
      notes: "OVERDUE follow up. Requires tender tracking software.",
      lastContactAt: daysAgo(4),
      nextFollowUpAt: daysAgo(1), // OVERDUE: Nov 3, 2026
      history: [
        {
          userId: anita.id,
          callResult: "NO_RESPONSE",
          notes: "Called on mobile, rang out. Left WhatsApp confirmation for follow-up.",
          statusAtTime: "FOLLOW_UP",
          calledAt: daysAgo(4),
          nextFollowUpAt: daysAgo(1),
        },
      ],
    },
    {
      name: "Pradeep Joshi",
      phone: "+91 97233 11988",
      email: "pradeep@joshiadvisory.com",
      companyName: "Joshi & Co Chartered Accountants",
      location: "Ahmedabad, Gujarat",
      serviceName: "Website Development",
      assignedTo: suresh.id,
      status: "FOLLOW_UP",
      notes: "Corporate compliance portal for taxation clients.",
      lastContactAt: daysAgo(3),
      nextFollowUpAt: daysAhead(2),
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Reviewed draft scope document. Client discussing with partners.",
          statusAtTime: "FOLLOW_UP",
          calledAt: daysAgo(3),
          nextFollowUpAt: daysAhead(2),
        },
      ],
    },

    // --- FUTURE CLIENTS ---
    {
      name: "Arun Varma",
      phone: "+91 98450 12345",
      email: "arun@varmaelectronics.com",
      companyName: "Varma Electronics & Retail",
      location: "Bengaluru, Karnataka",
      serviceName: "Custom CRM & ERP",
      assignedTo: suresh.id,
      status: "FUTURE",
      expectedStart: "January 2027",
      notes: "Expanding warehouse in Q1. Explicitly stated: 'Will start ERP implementation after January 2027 financial audit.'",
      lastContactAt: daysAgo(6),
      nextFollowUpAt: new Date("2026-12-15T10:00:00Z"),
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Very solid conversation. Company is relocating warehouse in December. Wants full implementation kicked off in January 2027.",
          statusAtTime: "FUTURE",
          calledAt: daysAgo(6),
          nextFollowUpAt: new Date("2026-12-15T10:00:00Z"),
        },
      ],
    },
    {
      name: "Ananya Roy",
      phone: "+91 98301 98765",
      email: "ananya@royheritage.com",
      companyName: "Roy Heritage Hotels",
      location: "Kolkata, West Bengal",
      serviceName: "Website Development",
      assignedTo: kiran.id,
      status: "FUTURE",
      expectedStart: "March 2027",
      notes: "Renovating property. Said: 'Not now, please call us in February before the summer season.'",
      lastContactAt: daysAgo(8),
      nextFollowUpAt: new Date("2027-02-10T11:00:00Z"),
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Currently managing property renovation. Will need new luxury booking website ready by April.",
          statusAtTime: "FUTURE",
          calledAt: daysAgo(8),
          nextFollowUpAt: new Date("2027-02-10T11:00:00Z"),
        },
      ],
    },
    {
      name: "Dr. K. Srinivas",
      phone: "+91 98490 67123",
      email: "drks@srinivasmed.org",
      companyName: "Srinivas Specialty Clinics",
      location: "Visakhapatnam, AP",
      serviceName: "Mobile App Development",
      assignedTo: anita.id,
      status: "FUTURE",
      expectedStart: "April 2027",
      notes: "Annual budget allocation happens in April. Keep in warm contact.",
      lastContactAt: daysAgo(10),
      nextFollowUpAt: new Date("2027-03-20T10:30:00Z"),
      history: [
        {
          userId: anita.id,
          callResult: "CONNECTED",
          notes: "Doctor likes the patient tele-consult app idea. Budget already locked for this FY.",
          statusAtTime: "FUTURE",
          calledAt: daysAgo(10),
          nextFollowUpAt: new Date("2027-03-20T10:30:00Z"),
        },
      ],
    },
    {
      name: "Marcus Schmidt",
      phone: "+49 30 55667788",
      email: "m.schmidt@berlinlogistik.de",
      companyName: "Schmidt Logistik GmbH",
      location: "Berlin, Germany",
      serviceName: "Cloud & DevOps Solutions",
      assignedTo: suresh.id,
      status: "FUTURE",
      expectedStart: "Q2 2027",
      notes: "Migrating on-prem servers to GCP. Tender opens in Q2 2027.",
      lastContactAt: daysAgo(12),
      nextFollowUpAt: new Date("2027-01-15T14:00:00Z"),
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Initial discovery on Kubernetes migration. Scheduled technical check-in for mid January.",
          statusAtTime: "FUTURE",
          calledAt: daysAgo(12),
          nextFollowUpAt: new Date("2027-01-15T14:00:00Z"),
        },
      ],
    },

    // --- THINKING ---
    {
      name: "Harish Chawla",
      phone: "+91 98110 99881",
      email: "harish@chawlaspices.com",
      companyName: "Chawla Spices & Condiments",
      location: "Amritsar, Punjab",
      serviceName: "E-Commerce Platforms",
      assignedTo: kiran.id,
      status: "THINKING",
      notes: "Comparing our quotation with Shopify standard plans. Weighing custom development benefits.",
      lastContactAt: daysAgo(2),
      nextFollowUpAt: daysAhead(5),
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Sent cost comparison document showing lower transaction fees on custom stack.",
          statusAtTime: "THINKING",
          calledAt: daysAgo(2),
          nextFollowUpAt: daysAhead(5),
        },
      ],
    },
    {
      name: "Divya Nair",
      phone: "+91 98471 22338",
      email: "divya@zenithpublishers.in",
      companyName: "Zenith Educational Books",
      location: "Chennai, Tamil Nadu",
      serviceName: "Website Development",
      assignedTo: anita.id,
      status: "THINKING",
      notes: "Internal committee reviewing digital strategy.",
      lastContactAt: daysAgo(4),
      nextFollowUpAt: daysAhead(3),
      history: [
        {
          userId: anita.id,
          callResult: "CONNECTED",
          notes: "Presented live demo of dynamic book sample previewer. Waiting for director feedback.",
          statusAtTime: "THINKING",
          calledAt: daysAgo(4),
          nextFollowUpAt: daysAhead(3),
        },
      ],
    },

    // --- CONVERTED ---
    {
      name: "Rameshwar Sen",
      phone: "+91 98290 87654",
      email: "rameshwar@sensolar.in",
      companyName: "Sen Solar Technologies",
      location: "Jaipur, Rajasthan",
      serviceName: "Website Development",
      assignedTo: suresh.id,
      status: "CONVERTED",
      notes: "Deal closed! Advanced payment received for corporate website + interactive solar savings calculator.",
      lastContactAt: daysAgo(1),
      nextFollowUpAt: daysAhead(14),
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Initial inquiry from website contact form.",
          statusAtTime: "NEW",
          calledAt: daysAgo(18),
        },
        {
          userId: suresh.id,
          callResult: "MEETING_SCHEDULED",
          notes: "Virtual demo of solar ROI calculator widget.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(12),
        },
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Final negotiation on project delivery milestones.",
          statusAtTime: "FOLLOW_UP",
          calledAt: daysAgo(4),
        },
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Contract signed, 40% advance milestone paid. Onboarding kickoff scheduled.",
          statusAtTime: "CONVERTED",
          calledAt: daysAgo(1),
        },
      ],
    },
    {
      name: "Kavita Rao",
      phone: "+91 98800 33211",
      email: "kavita@nexusretail.com",
      companyName: "Nexus Apparel Studio",
      location: "Bengaluru, Karnataka",
      serviceName: "E-Commerce Platforms",
      assignedTo: kiran.id,
      status: "CONVERTED",
      notes: "Signed agreement for headless e-commerce store with omnichannel inventory sync.",
      lastContactAt: daysAgo(3),
      nextFollowUpAt: null,
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Contract executed. Shared staging server environment details with client team.",
          statusAtTime: "CONVERTED",
          calledAt: daysAgo(3),
        },
      ],
    },
    {
      name: "Tariq Mansoor",
      phone: "+971 50 123 4567",
      email: "tariq@gulfmarineholdings.ae",
      companyName: "Gulf Marine Logistics",
      location: "Dubai, UAE",
      serviceName: "Custom CRM & ERP",
      assignedTo: anita.id,
      status: "CONVERTED",
      notes: "Full vessel crew and cargo dispatch management dashboard.",
      lastContactAt: daysAgo(5),
      nextFollowUpAt: null,
      history: [
        {
          userId: anita.id,
          callResult: "CONNECTED",
          notes: "Final scope freeze and purchase order received. Project sprint 1 starting.",
          statusAtTime: "CONVERTED",
          calledAt: daysAgo(5),
        },
      ],
    },

    // --- NEW ---
    {
      name: "Balaji Swaminathan",
      phone: "+91 98410 77119",
      email: "balaji@swamiagri.com",
      companyName: "Swami Agri Biotech",
      location: "Coimbatore, Tamil Nadu",
      serviceName: "Website Development",
      assignedTo: suresh.id,
      status: "NEW",
      notes: "Fresh lead received via website contact form. Inquired about organic fertilizer catalog website.",
      lastContactAt: null,
      nextFollowUpAt: daysAhead(1),
      history: [],
    },
    {
      name: "Sneha Kapadia",
      phone: "+91 98250 44321",
      email: "sneha@kapadiagems.com",
      companyName: "Kapadia Gems & Diamonds",
      location: "Surat, Gujarat",
      serviceName: "UI/UX Design & Branding",
      assignedTo: kiran.id,
      status: "NEW",
      notes: "Wants a luxury branding kit and mobile app UI mockups.",
      lastContactAt: null,
      nextFollowUpAt: daysAhead(1),
      history: [],
    },
    {
      name: "Rajeev Nambiar",
      phone: "+91 94470 55123",
      email: "rajeev@cochinship.com",
      companyName: "Cochin Ship Spares",
      location: "Kochi, Kerala",
      serviceName: "Custom CRM & ERP",
      assignedTo: anita.id,
      status: "NEW",
      notes: "Needs warehouse inventory barcode tracking software.",
      lastContactAt: null,
      nextFollowUpAt: daysAhead(2),
      history: [],
    },
    {
      name: "Farhan Qureshi",
      phone: "+91 98200 99112",
      email: "farhan@citycloud.in",
      companyName: "CityCloud Network Solutions",
      location: "Mumbai, Maharashtra",
      serviceName: "Cloud & DevOps Solutions",
      assignedTo: admin.id,
      status: "NEW",
      notes: "Direct referral from existing enterprise client.",
      lastContactAt: null,
      nextFollowUpAt: daysAhead(1),
      history: [],
    },

    // --- NO_RESPONSE ---
    {
      name: "Deepak Rawat",
      phone: "+91 98180 77665",
      email: "deepak@rawatpackers.com",
      companyName: "Rawat Logistics & Packers",
      location: "Noida, UP",
      serviceName: "Website Development",
      assignedTo: suresh.id,
      status: "NO_RESPONSE",
      notes: "Called 3 times over past week. No answer. Sent introductory email.",
      lastContactAt: daysAgo(2),
      nextFollowUpAt: daysAhead(3),
      history: [
        {
          userId: suresh.id,
          callResult: "NO_RESPONSE",
          notes: "Phone rang, unanswered.",
          statusAtTime: "NEW",
          calledAt: daysAgo(7),
          nextFollowUpAt: daysAgo(4),
        },
        {
          userId: suresh.id,
          callResult: "NO_RESPONSE",
          notes: "Second attempt, busy tone.",
          statusAtTime: "NO_RESPONSE",
          calledAt: daysAgo(4),
          nextFollowUpAt: daysAgo(2),
        },
        {
          userId: suresh.id,
          callResult: "NO_RESPONSE",
          notes: "Third attempt. No response. Will retry once next week.",
          statusAtTime: "NO_RESPONSE",
          calledAt: daysAgo(2),
          nextFollowUpAt: daysAhead(3),
        },
      ],
    },
    {
      name: "Sunil Bakshi",
      phone: "+91 98720 11223",
      email: "sunil@bakshifoods.in",
      companyName: "Bakshi Frozen Foods",
      location: "Ludhiana, Punjab",
      serviceName: "E-Commerce Platforms",
      assignedTo: kiran.id,
      status: "NO_RESPONSE",
      notes: "Switched off on two consecutive call attempts.",
      lastContactAt: daysAgo(3),
      nextFollowUpAt: daysAhead(2),
      history: [
        {
          userId: kiran.id,
          callResult: "BUSY",
          notes: "Number engaged both times.",
          statusAtTime: "NO_RESPONSE",
          calledAt: daysAgo(3),
          nextFollowUpAt: daysAhead(2),
        },
      ],
    },

    // --- NOT_INTERESTED ---
    {
      name: "Nilesh Shah",
      phone: "+91 98211 44557",
      email: "nilesh@shahplastics.com",
      companyName: "Shah Plastic Moulds",
      location: "Thane, Maharashtra",
      serviceName: "Website Development",
      assignedTo: suresh.id,
      status: "NOT_INTERESTED",
      notes: "Already hired local freelance designer last month. Not looking for external vendor.",
      lastContactAt: daysAgo(5),
      nextFollowUpAt: null,
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Client mentioned they signed with another vendor 3 weeks ago. Closed inquiry politely.",
          statusAtTime: "NOT_INTERESTED",
          calledAt: daysAgo(5),
        },
      ],
    },
    {
      name: "Gaurav Agarwal",
      phone: "+91 98390 66771",
      email: "gaurav@agarwalauto.in",
      companyName: "Agarwal Auto Components",
      location: "Kanpur, UP",
      serviceName: "Custom CRM & ERP",
      assignedTo: anita.id,
      status: "NOT_INTERESTED",
      notes: "Opted to continue with manual Excel bookkeeping for now. Low budget.",
      lastContactAt: daysAgo(7),
      nextFollowUpAt: null,
      history: [
        {
          userId: anita.id,
          callResult: "CONNECTED",
          notes: "Client said our minimum project fee exceeds their current fiscal budget.",
          statusAtTime: "NOT_INTERESTED",
          calledAt: daysAgo(7),
        },
      ],
    },

    // --- LOST ---
    {
      name: "Prakash Verma",
      phone: "+91 98711 00998",
      email: "prakash@vermatravels.com",
      companyName: "Verma Luxury Tours",
      location: "New Delhi, Delhi",
      serviceName: "Mobile App Development",
      assignedTo: kiran.id,
      status: "LOST",
      notes: "Competitor offered 50% discount and client opted for low-cost template builder.",
      lastContactAt: daysAgo(9),
      nextFollowUpAt: null,
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Client informed us they went with a local agency due to pricing constraints.",
          statusAtTime: "LOST",
          calledAt: daysAgo(9),
        },
      ],
    },

    // Additional active accounts to bring total to 30+
    {
      name: "Siddharth Bose",
      phone: "+91 98311 33445",
      email: "siddharth@bosecreative.in",
      companyName: "Bose Creative Studio",
      location: "Kolkata, WB",
      serviceName: "UI/UX Design & Branding",
      assignedTo: suresh.id,
      status: "INTERESTED",
      notes: "Seeking UI design partner for fintech clients.",
      lastContactAt: daysAgo(1),
      nextFollowUpAt: daysAhead(2),
      history: [
        {
          userId: suresh.id,
          callResult: "MEETING_SCHEDULED",
          notes: "Demo scheduled for Friday 3 PM.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(1),
          nextFollowUpAt: daysAhead(2),
        },
      ],
    },
    {
      name: "Anil Deshmukh",
      phone: "+91 98231 66554",
      email: "anil@deshmukhengineering.com",
      companyName: "Deshmukh Heavy Engineering",
      location: "Pune, Maharashtra",
      serviceName: "Website Development",
      assignedTo: kiran.id,
      status: "INTERESTED",
      notes: "Wants bilingual English & German corporate website for export marketing.",
      lastContactAt: daysAgo(2),
      nextFollowUpAt: daysAhead(3),
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "Discussed multi-language architecture on Next.js.",
          statusAtTime: "INTERESTED",
          calledAt: daysAgo(2),
          nextFollowUpAt: daysAhead(3),
        },
      ],
    },
    {
      name: "Leena Thomas",
      phone: "+91 94460 88221",
      email: "leena@thomaspharma.in",
      companyName: "Thomas Pharmaceuticals",
      location: "Thrissur, Kerala",
      serviceName: "Custom CRM & ERP",
      assignedTo: anita.id,
      status: "FOLLOW_UP",
      notes: "Batch expiry tracking system.",
      lastContactAt: daysAgo(1),
      nextFollowUpAt: now, // TODAY!
      history: [
        {
          userId: anita.id,
          callResult: "CONNECTED",
          notes: "Clarified FDA compliance logging needs. Callback requested today.",
          statusAtTime: "FOLLOW_UP",
          calledAt: daysAgo(1),
          nextFollowUpAt: now,
        },
      ],
    },
    {
      name: "Rohan Oberoi",
      phone: "+91 98140 33990",
      email: "rohan@oberoigastronomy.com",
      companyName: "Oberoi Gourmet Foods",
      location: "Chandigarh",
      serviceName: "E-Commerce Platforms",
      assignedTo: suresh.id,
      status: "FUTURE",
      expectedStart: "February 2027",
      notes: "Launching artisanal cheese line in Feb 2027. Needs D2C cold-chain storefront.",
      lastContactAt: daysAgo(4),
      nextFollowUpAt: new Date("2027-01-10T11:00:00Z"),
      history: [
        {
          userId: suresh.id,
          callResult: "CONNECTED",
          notes: "Plant setup completing in January. Will finalize website in February.",
          statusAtTime: "FUTURE",
          calledAt: daysAgo(4),
          nextFollowUpAt: new Date("2027-01-10T11:00:00Z"),
        },
      ],
    },
    {
      name: "Karthik Sundaram",
      phone: "+91 98401 55667",
      email: "karthik@sundaramlogistics.com",
      companyName: "Sundaram Freight Logistics",
      location: "Chennai, TN",
      serviceName: "Cloud & DevOps Solutions",
      assignedTo: kiran.id,
      status: "CONVERTED",
      notes: "Cloud migration and container orchestration completed. Maintenance SLA active.",
      lastContactAt: daysAgo(6),
      nextFollowUpAt: null,
      history: [
        {
          userId: kiran.id,
          callResult: "CONNECTED",
          notes: "SLA sign-off complete.",
          statusAtTime: "CONVERTED",
          calledAt: daysAgo(6),
        },
      ],
    },
  ];

  for (const c of clientsData) {
    const serviceId = services[c.serviceName] || Object.values(services)[0];
    const client = await prisma.client.create({
      data: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        companyName: c.companyName,
        location: c.location,
        serviceId: serviceId,
        assignedToId: c.assignedTo,
        status: c.status,
        notes: c.notes,
        expectedStart: c.expectedStart || null,
        lastContactAt: c.lastContactAt,
        nextFollowUpAt: c.nextFollowUpAt,
        createdAt: c.lastContactAt ? daysAgo(15) : now,
      },
    });

    // Create call histories
    if (c.history && c.history.length > 0) {
      for (const h of c.history) {
        await prisma.callHistory.create({
          data: {
            clientId: client.id,
            userId: h.userId,
            callResult: h.callResult,
            notes: h.notes,
            statusAtTime: h.statusAtTime,
            calledAt: h.calledAt,
            nextFollowUpAt: h.nextFollowUpAt || null,
          },
        });
      }
    }

    // If next follow-up is set, create a FollowUp record
    if (c.nextFollowUpAt) {
      await prisma.followUp.create({
        data: {
          clientId: client.id,
          userId: c.assignedTo || admin.id,
          scheduledAt: c.nextFollowUpAt,
          notes: `Follow-up for ${c.companyName || c.name} - ${c.notes ? c.notes.slice(0, 60) : 'General follow up'}`,
          completed: false,
        },
      });
    }
  }

  console.log(`✅ Seeded ${clientsData.length} clients with full call histories and follow-ups!`);
  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

