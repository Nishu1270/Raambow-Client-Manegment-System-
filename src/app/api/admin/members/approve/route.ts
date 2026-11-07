import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Target userId is required." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found." },
        { status: 404 }
      );
    }

    if (targetUser.approvalStatus === "APPROVED") {
      return NextResponse.json(
        { error: "User is already approved." },
        { status: 400 }
      );
    }

    // Atomically approve member: role stays TEAM_MEMBER, approvalStatus becomes APPROVED, active becomes true
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: "APPROVED",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        approvalStatus: true,
        active: true,
      },
    });

    // Record in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "MEMBER_APPROVED",
        details: `Administrator ${admin.name} (${admin.email}) approved registration for ${updatedUser.name} (${updatedUser.email}, @${updatedUser.username}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${updatedUser.name}. They can now sign in to the Member Dashboard.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Approve member error:", error);
    return NextResponse.json(
      { error: "Failed to approve member registration." },
      { status: 500 }
    );
  }
}

