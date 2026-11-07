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

    // Safety: Cannot deactivate own account
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "For security, you cannot deactivate your own administrator account." },
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

    const newActiveState = !targetUser.active;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active: newActiveState },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: newActiveState ? "MEMBER_ACTIVATED" : "MEMBER_DEACTIVATED",
        details: `Administrator ${admin.name} ${newActiveState ? "activated" : "deactivated"} account for ${updatedUser.name} (${updatedUser.email}).`,
      },
    });

    return NextResponse.json({
      success: true,
      active: updatedUser.active,
      message: `Account for ${updatedUser.name} is now ${newActiveState ? "active" : "deactivated"}.`,
    });
  } catch (error: any) {
    console.error("Toggle member active error:", error);
    return NextResponse.json(
      { error: "Failed to update member active status." },
      { status: 500 }
    );
  }
}

