import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedClients: true,
            callHistories: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pending = allUsers.filter((u) => u.approvalStatus === "PENDING");
    const approved = allUsers.filter(
      (u) => u.approvalStatus === "APPROVED" && u.role === "TEAM_MEMBER"
    );
    const rejected = allUsers.filter((u) => u.approvalStatus === "REJECTED");
    const admins = allUsers.filter((u) => u.role === "ADMIN");

    const stats = {
      totalApproved: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      activeMembers: approved.filter((u) => u.active).length,
      inactiveMembers: approved.filter((u) => !u.active).length,
      totalAdmins: admins.length,
      totalUsers: allUsers.length,
    };

    return NextResponse.json({
      success: true,
      pending,
      approved,
      rejected,
      admins,
      stats,
    });
  } catch (error: any) {
    console.error("Admin fetch members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members directory." },
      { status: 500 }
    );
  }
}

