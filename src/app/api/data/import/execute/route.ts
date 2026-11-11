import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ValidatedImportRow } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Company-wide client import is restricted to administrators. Team members cannot execute company data imports.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      fileName = "import.xlsx",
      rows = [],
      duplicateHandling = "skip", // "skip" | "update"
      defaultAssigneeId,
    } = body as {
      fileName: string;
      rows: ValidatedImportRow[];
      duplicateHandling: "skip" | "update";
      defaultAssigneeId?: string;
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No client records provided for import execution." },
        { status: 400 }
      );
    }

    // Load active users and services for relational linking
    const [existingUsers, existingServices] = await Promise.all([
      prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, email: true },
      }),
      prisma.service.findMany({
        where: { active: true },
        select: { id: true, name: true },
      }),
    ]);

    // Service lookup map
    const serviceMap = new Map<string, string>();
    for (const s of existingServices) {
      serviceMap.set(s.name.toLowerCase().trim(), s.id);
    }

    // User lookup map (name & email)
    const userMap = new Map<string, string>();
    for (const u of existingUsers) {
      userMap.set(u.name.toLowerCase().trim(), u.id);
      userMap.set(u.email.toLowerCase().trim(), u.id);
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const failedRecords: Array<{
      rowNumber: number;
      name: string;
      company?: string;
      phone: string;
      companyName?: string;
      email?: string;
      status: string;
      errors: string[];
      warnings: string[];
    }> = [];

    // Track phones committed in this run to avoid in-run duplicate crashes
    const committedPhones = new Set<string>();

    for (const row of rows) {
      // 1. If row had validation errors, record as failed
      if (row.errors && row.errors.length > 0) {
        failedRecords.push({
          rowNumber: row.rowNumber,
          name: row.name || "Unknown",
          phone: row.phone || "—",
          companyName: row.companyName,
          email: row.email,
          status: row.status,
          errors: row.errors,
          warnings: row.warnings || [],
        });
        continue;
      }

      // Check if this phone was already committed in this batch run
      if (committedPhones.has(row.phone)) {
        skippedCount++;
        continue;
      }

      // Resolve Service ID
      let serviceId: string | null = null;
      if (row.serviceName) {
        const cleanServiceName = row.serviceName.toLowerCase().trim();
        if (serviceMap.has(cleanServiceName)) {
          serviceId = serviceMap.get(cleanServiceName)!;
        } else {
          // Auto-create service if it doesn't exist yet
          try {
            const newService = await prisma.service.create({
              data: { name: row.serviceName.trim() },
            });
            serviceMap.set(cleanServiceName, newService.id);
            serviceId = newService.id;
          } catch {
            // If race condition created it, lookup again
            const found = await prisma.service.findUnique({
              where: { name: row.serviceName.trim() },
            });
            if (found) serviceId = found.id;
          }
        }
      }

      // Resolve Assigned User ID
      let assignedToId: string | null = null;
      if (row.assignedToName) {
        const cleanUserName = row.assignedToName.toLowerCase().trim();
        if (userMap.has(cleanUserName)) {
          assignedToId = userMap.get(cleanUserName)!;
        }
      }
      if (!assignedToId && defaultAssigneeId) {
        assignedToId = defaultAssigneeId;
      }
      if (!assignedToId) {
        assignedToId = user.id; // Fallback to importing admin
      }

      // Handle Duplicate vs Fresh
      if (row.isDuplicateInDb && row.existingClientId) {
        if (duplicateHandling === "skip") {
          skippedCount++;
          continue;
        } else if (duplicateHandling === "update") {
          try {
            await prisma.client.update({
              where: { id: row.existingClientId },
              data: {
                name: row.name,
                company: row.company ? (row.company.includes("KATERNGER") ? "KATERNGERS" : "RAAMBOW") : undefined,
                companyName: row.companyName || null,
                email: row.email || null,
                location: row.location || null,
                status: row.status,
                serviceId: serviceId || undefined,
                assignedToId: assignedToId || undefined,
                notes: row.notes || undefined,
                expectedStart: row.expectedStart || undefined,
                futureReason: row.futureReason || undefined,
                nextFollowUpAt: row.nextFollowUpAt
                  ? new Date(row.nextFollowUpAt)
                  : undefined,
              },
            });
            updatedCount++;
            committedPhones.add(row.phone);
          } catch (updateErr: any) {
            console.error("Error updating existing client:", updateErr);
            failedRecords.push({
              rowNumber: row.rowNumber,
              name: row.name,
              phone: row.phone,
              companyName: row.companyName,
              email: row.email,
              status: row.status,
              errors: [updateErr.message || "Database update failed."],
              warnings: row.warnings || [],
            });
          }
          continue;
        }
      }

      // Fresh Client Insertion
      try {
        await prisma.client.create({
          data: {
            name: row.name,
            company: row.company ? (row.company.includes("KATERNGER") ? "KATERNGERS" : "RAAMBOW") : "RAAMBOW",
            phone: row.phone,
            companyName: row.companyName || null,
            email: row.email || null,
            location: row.location || null,
            status: row.status || "NEW",
            serviceId: serviceId || null,
            assignedToId: assignedToId || null,
            notes: row.notes || null,
            expectedStart: row.expectedStart || null,
            futureReason: row.futureReason || null,
            nextFollowUpAt: row.nextFollowUpAt
              ? new Date(row.nextFollowUpAt)
              : null,
          },
        });
        importedCount++;
        committedPhones.add(row.phone);
      } catch (insertErr: any) {
        console.error("Error creating client:", insertErr);
        failedRecords.push({
          rowNumber: row.rowNumber,
          name: row.name,
          phone: row.phone,
          companyName: row.companyName,
          email: row.email,
          status: row.status,
          errors: [insertErr.message || "Database insert failed."],
          warnings: row.warnings || [],
        });
      }
    }

    // Determine overall import status
    let status = "COMPLETED";
    if (failedRecords.length > 0 && importedCount + updatedCount > 0) {
      status = "PARTIAL";
    } else if (failedRecords.length > 0 && importedCount + updatedCount === 0) {
      status = "FAILED";
    }

    // Save persistent ImportHistory record
    await prisma.importHistory.create({
      data: {
        fileName,
        uploadedById: user.id,
        totalRows: rows.length,
        importedRows: importedCount + updatedCount,
        skippedRows: skippedCount,
        failedRows: failedRecords.length,
        status,
        errorLog: failedRecords.length > 0 ? JSON.stringify(failedRecords) : null,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "IMPORT_CLIENTS",
        details: `Imported ${importedCount} new, updated ${updatedCount}, skipped ${skippedCount}, failed ${failedRecords.length} from file "${fileName}".`,
      },
    });

    return NextResponse.json({
      success: true,
      fileName,
      totalRows: rows.length,
      importedCount,
      updatedCount,
      skippedCount,
      failedCount: failedRecords.length,
      failedRecords,
    });
  } catch (err: any) {
    console.error("Import execution error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute client import." },
      { status: 500 }
    );
  }
}

