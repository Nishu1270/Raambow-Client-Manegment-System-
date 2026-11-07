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
    const assignedToId = searchParams.get("assignedToId");

    const clientWhere: Record<string, unknown> = {
      nextFollowUpAt: { not: null },
    };

    // Strict role restriction: Team members can ONLY view follow-ups for their assigned clients
    if (user.role === "TEAM_MEMBER") {
      clientWhere.assignedToId = user.id;
    } else if (assignedToId && assignedToId !== "ALL") {
      clientWhere.assignedToId = assignedToId;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const clientsWithFollowUps = await prisma.client.findMany({
      where: clientWhere,
      orderBy: { nextFollowUpAt: "asc" },
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        callHistories: {
          orderBy: { calledAt: "desc" },
          take: 1,
        },
      },
    });

    const overdue: typeof clientsWithFollowUps = [];
    const today: typeof clientsWithFollowUps = [];
    const upcoming: typeof clientsWithFollowUps = [];

    clientsWithFollowUps.forEach((client) => {
      if (!client.nextFollowUpAt) return;
      const followUpDate = new Date(client.nextFollowUpAt);

      if (followUpDate < startOfToday) {
        overdue.push(client);
      } else if (followUpDate <= endOfToday) {
        today.push(client);
      } else {
        upcoming.push(client);
      }
    });

    return NextResponse.json({
      counts: {
        total: clientsWithFollowUps.length,
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
      },
      overdue,
      today,
      upcoming,
    });
  } catch (error) {
    console.error("Fetch follow-ups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow-ups." },
      { status: 500 }
    );
  }
}
