import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMember = user.role === "TEAM_MEMBER";
    const clientWhere: Record<string, unknown> = isMember ? { assignedToId: user.id } : {};

    // 1. Status Counts based on permitted scope
    const statusCounts = await prisma.client.groupBy({
      by: ["status"],
      where: clientWhere,
      _count: { _all: true },
    });

    const statusTotals: Record<string, number> = {
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

    let totalClients = 0;
    statusCounts.forEach((s) => {
      statusTotals[s.status] = s._count._all;
      totalClients += s._count._all;
    });
    statusTotals.TOTAL = totalClients;

    // 2. Team-wise stats (only for Admin, or only self for Team Member)
    const teamMembers = await prisma.user.findMany({
      where: isMember ? { id: user.id } : { active: true },
      select: { id: true, name: true, role: true },
    });

    const teamStats = await Promise.all(
      teamMembers.map(async (member) => {
        const counts = await prisma.client.groupBy({
          by: ["status"],
          where: { assignedToId: member.id },
          _count: { _all: true },
        });

        let total = 0;
        let interested = 0;
        let future = 0;
        let followUp = 0;
        let converted = 0;

        counts.forEach((c) => {
          total += c._count._all;
          if (c.status === "INTERESTED") interested = c._count._all;
          if (c.status === "FUTURE") future = c._count._all;
          if (c.status === "FOLLOW_UP") followUp = c._count._all;
          if (c.status === "CONVERTED") converted = c._count._all;
        });

        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0";

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          total,
          interested,
          future,
          followUp,
          converted,
          conversionRate,
        };
      })
    );

    // 3. Service demand distribution within permitted clients
    const serviceDistribution = await prisma.service.findMany({
      where: { active: true },
      include: {
        clients: {
          where: clientWhere,
          select: { id: true },
        },
      },
    });

    const serviceData = serviceDistribution.map((s) => ({
      id: s.id,
      name: s.name,
      clientCount: s.clients.length,
      percentage: totalClients > 0 ? ((s.clients.length / totalClients) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.clientCount - a.clientCount);

    // 4. Call counts
    const callWhere: Record<string, unknown> = isMember ? { client: { assignedToId: user.id } } : {};
    const totalCalls = await prisma.callHistory.count({ where: callWhere });

    return NextResponse.json({
      statusTotals,
      teamStats,
      serviceDistribution: serviceData,
      totalCalls,
      isAdmin: user.role === "ADMIN",
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Failed to generate reports." },
      { status: 500 }
    );
  }
}
