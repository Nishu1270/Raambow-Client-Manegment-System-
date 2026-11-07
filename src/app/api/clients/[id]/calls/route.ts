import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = params;
    const body = await request.json();

    const {
      callResult,
      notes,
      newStatus,
      date,
      time,
      nextFollowUpDate,
      nextFollowUpTime,
      expectedStart,
      futureReason,
    } = body;

    if (!callResult) {
      return NextResponse.json(
        { error: "Call Result is required." },
        { status: 400 }
      );
    }

    if (!notes || !notes.trim()) {
      return NextResponse.json(
        { error: "Call discussion notes / summary are required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    if (user.role === "TEAM_MEMBER" && client.assignedToId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You cannot log calls for clients assigned to other team members." },
        { status: 403 }
      );
    }

    // Determine call datetime
    let calledAt = new Date();
    if (date) {
      const timeStr = time || `${calledAt.getHours().toString().padStart(2, '0')}:${calledAt.getMinutes().toString().padStart(2, '0')}`;
      calledAt = new Date(`${date}T${timeStr}:00`);
    }

    // Determine next follow-up datetime if provided
    let nextFollowUpAt: Date | null = null;
    if (nextFollowUpDate) {
      const followUpTime = nextFollowUpTime || "10:00";
      nextFollowUpAt = new Date(`${nextFollowUpDate}T${followUpTime}:00`);
    }

    // Determine previous and new status
    const previousStatus = client.status;
    const effectiveStatus = newStatus || client.status;

    // 1. Create a PERMANENT CallHistory record (never overwriting previous entries)
    const callRecord = await prisma.callHistory.create({
      data: {
        clientId: client.id,
        userId: user.id,
        callResult: callResult,
        notes: notes.trim(),
        statusAtTime: effectiveStatus,
        previousStatus: previousStatus,
        newStatus: effectiveStatus,
        calledAt: calledAt,
        nextFollowUpAt: nextFollowUpAt,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // 2. Update client lastContactAt, current status, nextFollowUpAt, expectedStart, futureReason
    const clientUpdateData: Record<string, unknown> = {
      lastContactAt: calledAt,
    };

    if (newStatus && newStatus !== client.status) {
      clientUpdateData.status = newStatus;
    }

    if (nextFollowUpDate !== undefined) {
      clientUpdateData.nextFollowUpAt = nextFollowUpAt;
    }

    if (expectedStart !== undefined && expectedStart !== null) {
      clientUpdateData.expectedStart = expectedStart.trim() || null;
    }

    if (futureReason !== undefined && futureReason !== null) {
      clientUpdateData.futureReason = futureReason.trim() || null;
    }

    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: clientUpdateData,
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // 3. If a next follow-up is scheduled, create FollowUp record
    if (nextFollowUpAt) {
      await prisma.followUp.create({
        data: {
          clientId: client.id,
          userId: client.assignedToId || user.id,
          scheduledAt: nextFollowUpAt,
          notes: `Follow-up after ${callResult} call: ${notes.trim().slice(0, 80)}`,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOG_CALL",
        details: `Logged ${callResult} call for ${client.name}. Status transition: ${previousStatus} -> ${effectiveStatus}.`,
      },
    });

    return NextResponse.json({
      success: true,
      call: callRecord,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Log call error:", error);
    return NextResponse.json(
      { error: "Failed to record call update." },
      { status: 500 }
    );
  }
}
