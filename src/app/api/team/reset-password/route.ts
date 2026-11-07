import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role verification: Only administrators can reset team-member passwords
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Access denied. Only administrators have authorization to reset team-member passwords.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetUserId = body.targetUserId || body.userId;
    const { newPassword } = body;

    // 1. Target user verification
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target team member ID is required." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "The specified team member could not be found." },
        { status: 404 }
      );
    }

    // 2. Minimum 12-character length enforcement
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 12) {
      return NextResponse.json(
        {
          error:
            "New password does not meet security requirements. It must be at least 12 characters long.",
        },
        { status: 400 }
      );
    }

    // 3. Hash the new password with bcrypt (12 salt rounds)
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 4. Update target user's password hash in database
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // 5. Audit log the administrative reset
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_RESET_MEMBER_PASSWORD",
        details: `Administrator ${user.name} reset password for team member ${targetUser.name} (${targetUser.email}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${targetUser.name} (${targetUser.email}) has been reset successfully.`,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
    });
  } catch (error: any) {
    console.error("Admin password reset error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while resetting the team member password.",
      },
      { status: 500 }
    );
  }
}
