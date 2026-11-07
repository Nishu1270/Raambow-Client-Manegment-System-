import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For team dropdowns, active members list
    const teamMembers = await prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            assignedClients: true,
            callHistories: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // If user is a TEAM_MEMBER, do NOT expose performance statistics of other team members
    if (user.role !== "ADMIN") {
      return NextResponse.json({
        team: teamMembers.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
        })),
        isAdmin: false,
      });
    }

    // Admin view: Calculate deep breakdown per member
    const detailedTeam = await Promise.all(
      teamMembers.map(async (member) => {
        const clientStatuses = await prisma.client.groupBy({
          by: ["status"],
          where: { assignedToId: member.id },
          _count: { _all: true },
        });

        const statusCounts: Record<string, number> = {
          INTERESTED: 0,
          FUTURE: 0,
          FOLLOW_UP: 0,
          CONVERTED: 0,
          NEW: 0,
          NOT_INTERESTED: 0,
          THINKING: 0,
          LOST: 0,
          NO_RESPONSE: 0,
        };

        clientStatuses.forEach((s) => {
          statusCounts[s.status] = s._count._all;
        });

        return {
          ...member,
          stats: {
            total: member._count.assignedClients,
            interested: statusCounts.INTERESTED || 0,
            future: statusCounts.FUTURE || 0,
            followUp: statusCounts.FOLLOW_UP || 0,
            converted: statusCounts.CONVERTED || 0,
            new: statusCounts.NEW || 0,
            notInterested: statusCounts.NOT_INTERESTED || 0,
            thinking: statusCounts.THINKING || 0,
            lost: statusCounts.LOST || 0,
            noResponse: statusCounts.NO_RESPONSE || 0,
            callsLogged: member._count.callHistories,
          },
        };
      })
    );

    return NextResponse.json({
      team: detailedTeam,
      isAdmin: true,
    });
  } catch (error) {
    console.error("Fetch team error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only administrators can add team members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, password, role = "TEAM_MEMBER" } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and temporary password are required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash,
        role: role === "ADMIN" ? "ADMIN" : "TEAM_MEMBER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADD_TEAM_MEMBER",
        details: `Added new user ${newUser.name} (${newUser.email}) as ${newUser.role}.`,
      },
    });

    return NextResponse.json({ success: true, member: newUser });
  } catch (error) {
    console.error("Create team member error:", error);
    return NextResponse.json(
      { error: "Failed to create team member." },
      { status: 500 }
    );
  }
}
