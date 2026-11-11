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

    // Strict Admin check: Employees / Consultants must never access converted financials
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Converted client financials and project tracking are restricted to administrators only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company")?.trim() || "";

    const where: Record<string, unknown> = { status: "CONVERTED" };
    if (company && company !== "ALL") {
      if (company === "RAAMBOW" || company === "KATERNGERS") {
        where.company = company;
      }
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        service: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { callHistories: true } },
      },
    });

    // Compute financial analytics
    let totalProjectValue = 0;
    let totalAdvanceReceived = 0;
    let totalBalancePending = 0;
    let completedPayments = 0;
    let pendingPayments = 0;

    const formattedClients = clients.map((client) => {
      const price = client.quotationAmount || 0;
      const advance = client.advanceReceived || 0;
      const balance =
        client.balancePayment !== null && client.balancePayment !== undefined
          ? client.balancePayment
          : Math.max(0, price - advance);

      totalProjectValue += price;
      totalAdvanceReceived += advance;
      totalBalancePending += balance;

      if (client.paymentStatus === "COMPLETED" || (price > 0 && balance === 0)) {
        completedPayments++;
      } else {
        pendingPayments++;
      }

      return {
        ...client,
        quotationAmount: price,
        advanceReceived: advance,
        balancePayment: balance,
      };
    });

    return NextResponse.json({
      clients: formattedClients,
      summary: {
        totalConverted: clients.length,
        totalProjectValue,
        totalAdvanceReceived,
        totalBalancePending,
        completedPayments,
        pendingPayments,
      },
    });
  } catch (error) {
    console.error("Fetch converted clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch converted clients." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only administrators can update converted project financials." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    let price = client.quotationAmount;
    let advance = client.advanceReceived;

    if (body.quotationAmount !== undefined) {
      price = body.quotationAmount === "" || body.quotationAmount === null ? null : parseFloat(body.quotationAmount);
      updateData.quotationAmount = price;
    }

    if (body.advanceReceived !== undefined) {
      advance = body.advanceReceived === "" || body.advanceReceived === null ? null : parseFloat(body.advanceReceived);
      updateData.advanceReceived = advance;
    }

    if (price !== null && advance !== null) {
      updateData.balancePayment = Math.max(0, (price || 0) - (advance || 0));
    } else if (body.balancePayment !== undefined) {
      updateData.balancePayment =
        body.balancePayment === "" || body.balancePayment === null ? null : parseFloat(body.balancePayment);
    }

    if (body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.paymentStatus;
    }

    if (body.quotationDetails !== undefined) {
      updateData.quotationDetails = body.quotationDetails ? String(body.quotationDetails).trim() : null;
    }

    if (body.projectStarted !== undefined) {
      updateData.projectStarted = body.projectStarted ? new Date(body.projectStarted) : null;
    }

    if (body.projectDeadline !== undefined) {
      updateData.projectDeadline = body.projectDeadline ? new Date(body.projectDeadline) : null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes).trim() : null;
    }

    if (body.company !== undefined) {
      const cleanComp = String(body.company).trim().toUpperCase();
      if (cleanComp !== "RAAMBOW" && cleanComp !== "KATERNGERS") {
        return NextResponse.json(
          { error: "Invalid company selected. Must be RAAMBOW or KATERNGERS." },
          { status: 400 }
        );
      }
      updateData.company = cleanComp;
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      include: {
        service: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_CONVERTED_PROJECT",
        details: `Administrator ${user.name} updated project and financial details for converted client "${updated.name}" (Price: ₹${updated.quotationAmount || 0}, Advance: ₹${updated.advanceReceived || 0}, Balance: ₹${updated.balancePayment || 0}, Status: ${updated.paymentStatus}).`,
      },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("Update converted project error:", error);
    return NextResponse.json(
      { error: "Failed to update converted project details." },
      { status: 500 }
    );
  }
}

