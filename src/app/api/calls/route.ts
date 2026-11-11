import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const callResult = searchParams.get("callResult")?.trim() || "";
    const statusAtTime = searchParams.get("status")?.trim() || "";
    const userId = searchParams.get("userId")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Strict role restriction: Team members can only see activity for their assigned clients or logged by them
    if (user.role === "TEAM_MEMBER") {
      where.OR = [
        { userId: user.id },
        { client: { assignedToId: user.id } },
      ];
    } else if (userId && userId !== "ALL") {
      where.userId = userId;
    }

    if (callResult && callResult !== "ALL") {
      where.callResult = callResult;
    }

    if (statusAtTime && statusAtTime !== "ALL") {
      where.statusAtTime = statusAtTime;
    }

    if (search) {
      const searchConditions = [
        { client: { name: { contains: search } } },
        { client: { phone: { contains: search } } },
        { client: { companyName: { contains: search } } },
        { notes: { contains: search } },
      ];

      if (user.role === "TEAM_MEMBER") {
        where.AND = [
          {
            OR: [
              { userId: user.id },
              { client: { assignedToId: user.id } },
            ],
          },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, calls] = await Promise.all([
      prisma.callHistory.count({ where }),
      prisma.callHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { calledAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              companyName: true,
              company: true,
              status: true,
              service: { select: { name: true } },
            },
          },
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      calls,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Fetch call history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch call history." },
      { status: 500 }
    );
  }
}
