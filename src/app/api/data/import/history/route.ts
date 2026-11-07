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

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access to import history is restricted to administrators." },
        { status: 403 }
      );
    }

    const histories = await prisma.importHistory.findMany({
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      histories,
    });
  } catch (err: any) {
    console.error("Error fetching import history:", err);
    return NextResponse.json(
      { error: "Failed to load import history." },
      { status: 500 }
    );
  }
}

