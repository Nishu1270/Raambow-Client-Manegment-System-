import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizeIndianPhone } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ results: [], exactMatch: null });
    }

    const cleanQuery = query.replace(/[^\w\d+]/g, "");
    const phoneNorm = normalizeIndianPhone(query);

    // Strict role restriction: Team members can ONLY search their assigned clients
    const baseWhere: Record<string, unknown> = {};
    if (user.role === "TEAM_MEMBER") {
      baseWhere.assignedToId = user.id;
    }

    // Phone search conditions
    const phoneConditions: Array<Record<string, unknown>> = [
      { phone: { contains: query } },
      { phone: { contains: cleanQuery } },
    ];
    if (phoneNorm.isValid) {
      phoneConditions.push({ phone: phoneNorm.normalized });
    }

    // Check for exact phone match first within permitted clients
    const exactMatch = await prisma.client.findFirst({
      where: {
        ...baseWhere,
        OR: phoneConditions,
      },
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true } },
        callHistories: {
          take: 3,
          orderBy: { calledAt: "desc" },
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // General search across clients within permitted clients
    const results = await prisma.client.findMany({
      where: {
        ...baseWhere,
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
          { companyName: { contains: query } },
          { email: { contains: query } },
          { location: { contains: query } },
          { futureReason: { contains: query } },
        ],
      },
      take: 8,
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      query,
      exactPhoneMatch: exactMatch,
      results,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search query failed." },
      { status: 500 }
    );
  }
}
