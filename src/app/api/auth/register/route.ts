import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "127.0.0.1";

    const rateLimitKey = `register_${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutMs: 15 * 60 * 1000,
    });
    if (rateCheck.isLimited) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please wait ${Math.ceil(
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
    const { name, username, email, phone, password, confirmPassword } = body;

    // 1. Validation
    if (!name || !username || !email || !password || !confirmPassword) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "Full name, username, email, and password are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanUsername = String(username).trim();
    const cleanName = String(name).trim();
    const cleanPhone = phone ? String(phone).trim() : null;

    // Simple email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Duplicate checks (indexed queries)
    const emailConflict = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (emailConflict) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const usernameConflict = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: cleanUsername.toLowerCase() },
        ],
      },
    });
    if (usernameConflict) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // 3. Securely hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create user with role TEAM_MEMBER and PENDING approval status
    // Client cannot override role or approvalStatus
    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: "TEAM_MEMBER",
        approvalStatus: "PENDING",
        active: false,
      },
    });

    // 5. Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: newUser.id,
          action: "MEMBER_REGISTRATION",
          details: `Registration submitted by ${cleanName} (${cleanEmail}, @${cleanUsername}). Status: PENDING approval.`,
          ipAddress: clientIp,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message:
        "Your account has been created successfully. Your registration is waiting for administrator approval. You can log in after your account is approved.",
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        approvalStatus: newUser.approvalStatus,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your registration." },
      { status: 500 }
    );
  }
}

