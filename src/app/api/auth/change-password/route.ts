import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser, signJwt, AUTH_COOKIE_NAME } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "127.0.0.1";

    const rateLimitKey = `change_pwd_${user.id}_${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutMs: 15 * 60 * 1000,
    });
    if (rateCheck.isLimited) {
      return NextResponse.json(
        {
          error: `Too many password change attempts. Please wait ${Math.ceil(
            rateCheck.retryAfterSeconds / 60
          )} minutes before trying again.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 1. Presence validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          error:
            "All fields are required. Please provide your current password, new password, and confirmation.",
        },
        { status: 400 }
      );
    }

    // 2. Minimum 12-character length enforcement
    if (typeof newPassword !== "string" || newPassword.length < 12) {
      return NextResponse.json(
        {
          error:
            "New password does not meet security requirements. It must be at least 12 characters long.",
        },
        { status: 400 }
      );
    }

    // 3. Confirmation match validation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error:
            "New password and confirmation password do not match. Please verify and try again.",
        },
        { status: 400 }
      );
    }

    // 4. Fetch user from database to inspect current password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        active: true,
      },
    });

    if (!dbUser || !dbUser.active) {
      return NextResponse.json(
        { error: "Account not found or inactive." },
        { status: 404 }
      );
    }

    // 5. Verify current password using bcrypt
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      dbUser.passwordHash
    );
    if (!isCurrentValid) {
      recordFailedAttempt(rateLimitKey);
      // Audit log failed password change attempt
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "PASSWORD_CHANGE_FAILED",
            details: `Failed password change attempt: Incorrect current password entered for ${user.email}.`,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error:
            "The current password you entered is incorrect. Please verify your current password.",
        },
        { status: 400 }
      );
    }

    // 6. Check that new password is not identical to current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      dbUser.passwordHash
    );
    if (isSamePassword) {
      return NextResponse.json(
        {
          error:
            "Your new password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    // 7. Hash the new password using bcrypt (12 salt rounds)
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 8. Update database with new hashed password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // 9. Audit log the password change & clear rate limit
    clearRateLimit(rateLimitKey);
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGED",
        details: `Password changed successfully for ${user.name} (${user.email}).`,
      },
    });

    // 10. Invalidate previous session and reissue fresh session token
    const sessionUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as "ADMIN" | "TEAM_MEMBER",
    };

    const freshToken = signJwt(sessionUser);

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message:
        "Your password has been changed successfully. Your active session has been securely refreshed.",
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: freshToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while changing your password. Please try again.",
      },
      { status: 500 }
    );
  }
}

