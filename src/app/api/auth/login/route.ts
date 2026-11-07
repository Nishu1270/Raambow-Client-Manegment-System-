import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signJwt, AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Determine client IP for security telemetry and rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "127.0.0.1";

    const body = await request.json();
    const identifier = (body.identifier || body.email || body.username || "").trim();
    const password = body.password;
    const rememberMe = Boolean(body.rememberMe);

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/Email and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim();
    const rateLimitKey = `login_${cleanIdentifier.toLowerCase()}_${clientIp}`;

    // 1. Check Rate Limit
    const rateCheck = checkRateLimit(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutMs: 15 * 60 * 1000,
    });

    if (rateCheck.isLimited) {
      try {
        await prisma.auditLog.create({
          data: {
            action: "LOGIN_RATE_LIMITED",
            details: `Too many failed attempts for ${cleanIdentifier} from IP ${clientIp}. Locked for ${rateCheck.retryAfterSeconds}s.`,
            ipAddress: clientIp,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error: `Too many failed login attempts. For security, your access is temporarily locked. Please try again in ${Math.ceil(
            rateCheck.retryAfterSeconds / 60
          )} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    // 2. Fetch User: Support login via exact email, username, or full name (indexed queries)
    const lowerIdentifier = cleanIdentifier.toLowerCase();
    const altIdentifier = lowerIdentifier.includes("@ramboow.com")
      ? lowerIdentifier.replace("@ramboow.com", "@raambow.com")
      : lowerIdentifier.includes("@raambow.com")
      ? lowerIdentifier.replace("@raambow.com", "@ramboow.com")
      : lowerIdentifier;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerIdentifier },
          { email: altIdentifier },
          { email: cleanIdentifier },
          { username: cleanIdentifier },
          { username: lowerIdentifier },
          { name: cleanIdentifier },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: lowerIdentifier } },
            { username: { equals: lowerIdentifier } },
          ],
        },
      });
    }

    if (!user) {
      const failed = recordFailedAttempt(rateLimitKey);
      try {
        await prisma.auditLog.create({
          data: {
            action: "LOGIN_FAILED",
            details: `Non-existent user login attempt: ${cleanIdentifier}`,
            ipAddress: clientIp,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error: "Invalid username/email or password.",
          remainingAttempts: failed.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Verify Password Hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const failed = recordFailedAttempt(rateLimitKey);
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_FAILED",
            details: `Incorrect password for user: ${cleanIdentifier}. Remaining attempts: ${failed.remainingAttempts}`,
            ipAddress: clientIp,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error: "Invalid username/email or password.",
          remainingAttempts: failed.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 4. Approval and Status Validation
    // A. Check Approval Status
    if (user.approvalStatus === "PENDING") {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_BLOCKED_PENDING",
            details: `Pending registration login attempt by ${user.name} (${user.email}).`,
            ipAddress: clientIp,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error:
            "Your account registration is waiting for administrator approval. You can log in after your account is approved.",
          status: "PENDING",
        },
        { status: 403 }
      );
    }

    if (user.approvalStatus === "REJECTED") {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_BLOCKED_REJECTED",
            details: `Rejected user login attempt by ${user.name} (${user.email}).`,
            ipAddress: clientIp,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error:
            "Your registration request was not approved by an administrator.",
          status: "REJECTED",
        },
        { status: 403 }
      );
    }

    // B. Check Active Status
    if (!user.active) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_BLOCKED_INACTIVE",
            details: `Inactive user login attempt by ${user.name} (${user.email}).`,
            ipAddress: clientIp,
          },
        });
      } catch {}

      return NextResponse.json(
        {
          error:
            "Your account has been deactivated. Please contact an administrator.",
          status: "INACTIVE",
        },
        { status: 403 }
      );
    }

    // 5. Login Successful: Clear rate limit & log audit
    clearRateLimit(rateLimitKey);

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN_SUCCESS",
          details: `User ${user.name} (${user.role}) authenticated successfully.`,
          ipAddress: clientIp,
        },
      });
    } catch {}

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "TEAM_MEMBER",
    };

    const jwtExpiry = rememberMe ? "30d" : "7d";
    const token = signJwt(sessionUser, jwtExpiry);

    const redirectUrl = "/dashboard";

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
    });

    // Session duration: 30 days if rememberMe, otherwise 7 days
    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
