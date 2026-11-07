import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateClientsExportWorkbook } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim();
    const serviceId = searchParams.get("serviceId")?.trim();
    const assignedToId = searchParams.get("assignedToId")?.trim();
    const startDate = searchParams.get("startDate")?.trim();
    const endDate = searchParams.get("endDate")?.trim();
    const includeCallHistory = searchParams.get("includeCallHistory") !== "false";
    const includeFutureDetails =
      searchParams.get("includeFutureDetails") !== "false";
    const includeFollowUps = searchParams.get("includeFollowUps") !== "false";

    // Strict role-based scoping
    const where: Record<string, any> = {};

    if (user.role === "TEAM_MEMBER") {
      // Team members can strictly and ONLY export their own assigned clients
      where.assignedToId = user.id;
    } else if (assignedToId && assignedToId !== "ALL") {
      where.assignedToId = assignedToId;
    }

    // Status filter (supports multiple comma-separated or single)
    if (statusParam && statusParam !== "ALL") {
      const statuses = statusParam.split(",").map((s) => s.trim().toUpperCase());
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    // Service filter
    if (serviceId && serviceId !== "ALL") {
      where.serviceId = serviceId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Fetch clients with nested relations
    const clients = await prisma.client.findMany({
      where,
      include: {
        service: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        callHistories: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { calledAt: "desc" },
        },
        followUps: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { scheduledAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate formatted multi-sheet Excel workbook
    const buffer = await generateClientsExportWorkbook({
      clients,
      includeCallHistory,
      includeFutureDetails,
      includeFollowUps,
    });

    // Audit log export action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EXPORT_CLIENTS",
        details: `Exported ${clients.length} client records to Excel (Filters: status=${statusParam || "ALL"}, service=${serviceId || "ALL"}).`,
      },
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `RaamBow_Clients_${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Export generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate Excel export file." },
      { status: 500 }
    );
  }
}
