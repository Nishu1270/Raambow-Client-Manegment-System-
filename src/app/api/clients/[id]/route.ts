import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
        callHistories: {
          orderBy: { calledAt: "desc" },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        followUps: {
          orderBy: { scheduledAt: "asc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    // Role check: if team member, strictly block if client is not assigned to them
    if (user.role === "TEAM_MEMBER" && client.assignedToId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only view clients assigned directly to you." },
        { status: 403 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Get client error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    if (user.role === "TEAM_MEMBER" && client.assignedToId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only modify your own assigned clients." },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.companyName !== undefined) updateData.companyName = body.companyName?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.location !== undefined) updateData.location = body.location?.trim() || null;
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.expectedStart !== undefined) updateData.expectedStart = body.expectedStart?.trim() || null;
    if (body.futureReason !== undefined) updateData.futureReason = body.futureReason?.trim() || null;

    // Admin can reassign; Team member cannot reassign
    if (body.assignedToId !== undefined && user.role === "ADMIN") {
      updateData.assignedToId = body.assignedToId || null;
    }

    // Status change
    if (body.status && body.status !== client.status) {
      const oldStatus = client.status;
      const newStatus = body.status;
      updateData.status = newStatus;

      // Log permanent history entry for status change if not coming from a call update
      await prisma.callHistory.create({
        data: {
          clientId: client.id,
          userId: user.id,
          callResult: "OTHER",
          notes: `Status changed from ${oldStatus} to ${newStatus}.${body.futureReason ? ` Future reason: ${body.futureReason}` : ""}`,
          statusAtTime: newStatus,
          previousStatus: oldStatus,
          newStatus: newStatus,
          nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : client.nextFollowUpAt,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "STATUS_CHANGE",
          details: `Changed client status from ${oldStatus} to ${newStatus}.`,
        },
      });
    }

    // Phone change with duplicate check
    if (body.phone && body.phone.trim() !== client.phone) {
      const trimmedPhone = body.phone.trim();
      const duplicate = await prisma.client.findUnique({
        where: { phone: trimmedPhone },
      });
      if (duplicate && duplicate.id !== client.id) {
        return NextResponse.json(
          { error: `Phone number ${trimmedPhone} is already used by ${duplicate.name}.` },
          { status: 409 }
        );
      }
      updateData.phone = trimmedPhone;
    }

    // Update follow-up if explicitly passed
    if (body.nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null;
    }

    const updated = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: "Failed to update client." },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can delete/archive clients
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only administrators can delete or archive client records." },
        { status: 403 }
      );
    }

    const { id } = params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_CLIENT",
        details: `Deleted client ${client.name} (${client.phone}).`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json(
      { error: "Failed to delete client." },
      { status: 500 }
    );
  }
}
