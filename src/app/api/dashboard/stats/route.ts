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
    const requestedScope = searchParams.get("scope");

    // Strictly enforce role-based scoping:
    // ADMIN can choose "all" or "my"
    // TEAM_MEMBER is ALWAYS restricted to "my" (their assigned clients only)
    const scope =
      user.role === "ADMIN"
        ? requestedScope === "my"
          ? "my"
          : "all"
        : "my";

    const whereClause: Record<string, unknown> = {};
    if (scope === "my" || user.role === "TEAM_MEMBER") {
      whereClause.assignedToId = user.id;
    }

    // Group by status dynamically from database records
    const statusCounts = await prisma.client.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { _all: true },
    });

    const statusMap: Record<string, number> = {
      TOTAL: 0,
      NEW: 0,
      INTERESTED: 0,
      FOLLOW_UP: 0,
      FUTURE: 0,
      THINKING: 0,
      NOT_INTERESTED: 0,
      NO_RESPONSE: 0,
      CONVERTED: 0,
      LOST: 0,
    };

    let total = 0;
    statusCounts.forEach((item) => {
      statusMap[item.status] = item._count._all;
      total += item._count._all;
    });
    statusMap.TOTAL = total;

    // Follow-ups today & overdue
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const followUpWhere: Record<string, unknown> = {
      ...whereClause,
      nextFollowUpAt: { not: null },
    };

    const todayFollowUpsCount = await prisma.client.count({
      where: {
        ...followUpWhere,
        nextFollowUpAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const overdueFollowUpsCount = await prisma.client.count({
      where: {
        ...followUpWhere,
        nextFollowUpAt: {
          lt: startOfToday,
        },
      },
    });

    // Recent calls:
    // Team member only sees calls for their assigned clients or calls logged by them
    const callWhereClause: Record<string, unknown> =
      user.role === "TEAM_MEMBER"
        ? {
            OR: [
              { userId: user.id },
              { client: { assignedToId: user.id } },
            ],
          }
        : scope === "my"
        ? { userId: user.id }
        : {};

    const recentCalls = await prisma.callHistory.findMany({
      where: callWhereClause,
      take: 6,
      orderBy: { calledAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, companyName: true, company: true, phone: true, status: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Today's urgent followups (strictly due today: gte startOfToday, lte endOfToday)
    const todayFollowUps = await prisma.client.findMany({
      where: {
        ...whereClause,
        nextFollowUpAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      take: 10,
      orderBy: { nextFollowUpAt: "asc" },
      select: {
        id: true,
        name: true,
        companyName: true,
        company: true,
        phone: true,
        status: true,
        nextFollowUpAt: true,
        service: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Upcoming urgent followups (future followups)
    const upcomingFollowUps = await prisma.client.findMany({
      where: {
        ...whereClause,
        nextFollowUpAt: {
          gte: startOfToday,
        },
      },
      take: 10,
      orderBy: { nextFollowUpAt: "asc" },
      select: {
        id: true,
        name: true,
        companyName: true,
        company: true,
        phone: true,
        status: true,
        nextFollowUpAt: true,
        service: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Overdue urgent followups (up to 5)
    const overdueFollowUps = await prisma.client.findMany({
      where: {
        ...whereClause,
        nextFollowUpAt: {
          lt: startOfToday,
        },
      },
      take: 5,
      orderBy: { nextFollowUpAt: "desc" },
      select: {
        id: true,
        name: true,
        companyName: true,
        company: true,
        phone: true,
        status: true,
        nextFollowUpAt: true,
        service: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    const pendingApprovalsCount =
      user.role === "ADMIN"
        ? await prisma.user.count({ where: { approvalStatus: "PENDING" } })
        : 0;

    return NextResponse.json({
      scope,
      userRole: user.role,
      counts: statusMap,
      todayFollowUpsCount,
      overdueFollowUpsCount,
      pendingApprovalsCount,
      recentCalls,
      todayFollowUps,
      upcomingFollowUps,
      overdueFollowUps,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics." },
      { status: 500 }
    );
  }
}
