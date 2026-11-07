import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Fetch services error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services." },
      { status: 500 }
    );
  }
}
