import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const currentAdmin = await getCurrentUser();
    if (!currentAdmin || currentAdmin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only authorized administrators can create administrator accounts." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, email, phone, password, confirmPassword } = body;

    // 1. Validations
    if (!name || !username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Full name, username, work email, and password are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanUsername = String(username).trim();
    const cleanName = String(name).trim();
    const cleanPhone = phone ? String(phone).trim() : null;

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid work email address." },
        { status: 400 }
      );
    }

    // 2. Duplicate checks (case-insensitive)
    const existingUsers = await prisma.user.findMany();
    const emailExists = existingUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const usernameExists = existingUsers.find(
      (u) => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (usernameExists) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // 3. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create new administrator account
    const newAdmin = await prisma.user.create({
      data: {
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: "ADMIN",
        approvalStatus: "APPROVED",
        active: true,
      },
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
      },
    });

    // 5. Create AuditLog entry
    await prisma.auditLog.create({
      data: {
        userId: currentAdmin.id,
        action: "ADMIN_CREATED",
        details: `Administrator ${currentAdmin.name} (${currentAdmin.email}) created a new Administrator account for ${newAdmin.name} (${newAdmin.email}, @${newAdmin.username}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Administrator account for ${newAdmin.name} created successfully. They can now log in to the Admin Dashboard.`,
      admin: newAdmin,
    });
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the administrator account." },
      { status: 500 }
    );
  }
}

