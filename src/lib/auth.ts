import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "./prisma";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing in production environment. A strong 32+ character secret is required."
      );
    }
    return "ramboow_techsolutions_super_secret_jwt_key_2026_modern_solutions_clean_execution";
  }
  return secret;
}

export const AUTH_COOKIE_NAME = "ramboow_auth_token";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
}

export function signJwt(
  payload: SessionUser,
  expiresIn: string | number = "7d"
): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyJwt(token: string): SessionUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  // Verify user still exists in database and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "ADMIN" | "TEAM_MEMBER",
  };
}
