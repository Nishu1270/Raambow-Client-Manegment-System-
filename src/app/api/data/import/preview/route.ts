import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  parseSpreadsheetBuffer,
  detectColumnMapping,
  validateImportRows,
  SUPPORTED_IMPORT_FIELDS,
} from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only administrators can initiate company-wide imports
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Company-wide client import is restricted to administrators. Team members cannot upload company client files.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customMappingJson = formData.get("columnMapping") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Please select an Excel (.xlsx) or CSV (.csv) file to import." },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name || "upload.xlsx";
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "csv" && extension !== "xls") {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a Microsoft Excel (.xlsx, .xls) or Comma Separated Values (.csv) file.",
        },
        { status: 400 }
      );
    }

    // Validate file size (Vercel Serverless payload limit: 4.5 MB)
    const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 4.5 MB limit (${(
            file.size /
            (1024 * 1024)
          ).toFixed(
            2
          )} MB). Please upload a file smaller than 4.5 MB to ensure fast serverless processing.`,
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse spreadsheet into headers & raw data rows
    const { headers, rawRows, sheetName } = await parseSpreadsheetBuffer(buffer);

    if (headers.length === 0 || rawRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "The uploaded file is empty or does not contain any valid data rows. Please ensure your file has header titles and at least one data row.",
        },
        { status: 400 }
      );
    }

    // Determine column mapping: Use custom if provided, otherwise auto-detect
    let columnMapping: Record<string, string> = {};
    if (customMappingJson) {
      try {
        columnMapping = JSON.parse(customMappingJson);
      } catch {
        columnMapping = detectColumnMapping(headers);
      }
    } else {
      columnMapping = detectColumnMapping(headers);
    }

    // Fetch existing clients, users, and services for duplicate & relational verification
    const [existingClients, existingUsers, existingServices] = await Promise.all([
      prisma.client.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          companyName: true,
          assignedToId: true,
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, email: true },
      }),
      prisma.service.findMany({
        where: { active: true },
        select: { id: true, name: true },
      }),
    ]);

    // Validate all rows
    const summary = validateImportRows({
      rawRows,
      columnMapping,
      existingClients,
      existingUsers,
      existingServices,
    });

    return NextResponse.json({
      success: true,
      fileName,
      sheetName,
      headers,
      columnMapping,
      supportedFields: SUPPORTED_IMPORT_FIELDS,
      totalRows: summary.totalRows,
      validCount: summary.validCount,
      duplicateCount: summary.duplicateCount,
      invalidCount: summary.invalidCount,
      rows: summary.rows,
      users: existingUsers,
      services: existingServices,
    });
  } catch (err: any) {
    console.error("Import preview error:", err);
    return NextResponse.json(
      {
        error:
          err.message ||
          "Failed to process spreadsheet file. Please verify file format and content.",
      },
      { status: 500 }
    );
  }
}

