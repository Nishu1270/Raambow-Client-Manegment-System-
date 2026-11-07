import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const assignedToId = searchParams.get("assignedToId")?.trim() || "";
    const serviceId = searchParams.get("serviceId")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Strict security: Team member can only ever see their own assigned clients
    const where: Record<string, unknown> = {};

    if (user.role === "TEAM_MEMBER") {
      where.assignedToId = user.id;
    } else if (assignedToId && assignedToId !== "ALL") {
      where.assignedToId = assignedToId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (serviceId && serviceId !== "ALL") {
      where.serviceId = serviceId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { location: { contains: search } },
        { futureReason: { contains: search } },
      ];
    }

    // Determine sort order
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "recentlyContacted") {
      orderBy = { lastContactAt: "desc" };
    } else if (sortBy === "upcomingFollowUp") {
      orderBy = { nextFollowUpAt: "asc" };
    } else if (sortBy === "name") {
      orderBy = { name: "asc" };
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          service: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { callHistories: true } },
        },
      }),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      companyName,
      email,
      location,
      serviceId,
      assignedToId,
      status = "NEW",
      notes,
      expectedStart,
      futureReason,
      nextFollowUpDate,
      nextFollowUpTime,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Client Name is required." },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Phone Number is required." },
        { status: 400 }
      );
    }

    const trimmedPhone = phone.trim();

    // Check duplicate phone
    const existing = await prisma.client.findUnique({
      where: { phone: trimmedPhone },
      select: { id: true, name: true, companyName: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A client with phone number ${trimmedPhone} already exists: "${existing.name}" (${existing.companyName || "No Company"}).`,
          existingClientId: existing.id,
        },
        { status: 409 }
      );
    }

    // Determine assignee
    let targetAssignee = assignedToId;
    if (user.role === "TEAM_MEMBER") {
      targetAssignee = user.id; // Team member can only assign to self
    } else if (!targetAssignee) {
      targetAssignee = user.id;
    }

    // Combine follow-up date and time if provided
    let nextFollowUpAt: Date | null = null;
    if (nextFollowUpDate) {
      const timeStr = nextFollowUpTime || "10:00";
      nextFollowUpAt = new Date(`${nextFollowUpDate}T${timeStr}:00`);
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        phone: trimmedPhone,
        companyName: companyName?.trim() || null,
        email: email?.trim() || null,
        location: location?.trim() || null,
        serviceId: serviceId || null,
        assignedToId: targetAssignee,
        status: status,
        notes: notes?.trim() || null,
        expectedStart: expectedStart?.trim() || null,
        futureReason: futureReason?.trim() || null,
        nextFollowUpAt: nextFollowUpAt,
        lastContactAt: null,
      },
      include: {
        service: true,
        assignedTo: true,
      },
    });

    // If initial notes or initial reason provided, log as first call or note
    const initialText = futureReason
      ? `Future Interest Reason: ${futureReason.trim()}${notes ? ` | Notes: ${notes.trim()}` : ""}`
      : notes?.trim();

    if (initialText) {
      await prisma.callHistory.create({
        data: {
          clientId: client.id,
          userId: user.id,
          callResult: status === "FUTURE" ? "CALL_LATER" : "OTHER",
          notes: `Initial Log: ${initialText}`,
          statusAtTime: status,
          previousStatus: "NEW",
          newStatus: status,
          nextFollowUpAt: nextFollowUpAt,
        },
      });
    }

    // If follow-up date set, create FollowUp record
    if (nextFollowUpAt) {
      await prisma.followUp.create({
        data: {
          clientId: client.id,
          userId: targetAssignee,
          scheduledAt: nextFollowUpAt,
          notes: status === "FUTURE"
            ? `Future client follow-up: ${futureReason || client.name}`
            : `Initial follow-up scheduled during client onboarding.`,
        },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_CLIENT",
        details: `Created client ${client.name} (${client.phone}) with status ${client.status}.`,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Failed to create client." },
      { status: 500 }
    );
  }
}
