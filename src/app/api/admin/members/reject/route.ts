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
    const { userId, reason } = body;

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

    // Atomically reject registration
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: "REJECTED",
        active: false,
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
        action: "MEMBER_REJECTED",
        details: `Administrator ${admin.name} rejected registration for ${updatedUser.name} (${updatedUser.email}). Reason: ${reason || "Not specified"}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Registration for ${updatedUser.name} has been rejected.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Reject member error:", error);
    return NextResponse.json(
      { error: "Failed to reject member registration." },
      { status: 500 }
    );
  }
}

