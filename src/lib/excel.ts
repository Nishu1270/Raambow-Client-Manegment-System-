import ExcelJS from "exceljs";
import { Readable } from "stream";
import { CLIENT_STATUSES, ClientStatusType } from "./constants";

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

export const SUPPORTED_IMPORT_FIELDS: FieldDefinition[] = [
  {
    key: "name",
    label: "Client Name",
    required: true,
    aliases: [
      "client name",
      "name",
      "customer name",
      "contact name",
      "client",
      "customer",
      "fullname",
      "full name",
      "lead name",
    ],
  },
  {
    key: "phone",
    label: "Phone Number",
    required: true,
    aliases: [
      "phone number",
      "phone",
      "mobile",
      "mobile number",
      "contact number",
      "cell",
      "telephone",
      "tel",
      "contact",
      "phone no",
      "mobile no",
      "phone_number",
    ],
  },
  {
    key: "companyName",
    label: "Company Name",
    required: false,
    aliases: [
      "company name",
      "company",
      "business",
      "organization",
      "org",
      "firm",
      "business name",
      "company_name",
    ],
  },
  {
    key: "email",
    label: "Email",
    required: false,
    aliases: ["email", "e-mail", "email address", "mail", "mail id", "email_id"],
  },
  {
    key: "location",
    label: "Location",
    required: false,
    aliases: ["location", "city", "address", "state", "place", "region"],
  },
  {
    key: "service",
    label: "Service",
    required: false,
    aliases: [
      "service",
      "services",
      "interested service",
      "service required",
      "product",
      "requirement",
      "solution",
    ],
  },
  {
    key: "status",
    label: "Status",
    required: false,
    aliases: ["status", "client status", "lead status", "stage", "state"],
  },
  {
    key: "assignedTo",
    label: "Assigned Team Member",
    required: false,
    aliases: [
      "assigned team member",
      "assigned to",
      "assigned member",
      "agent",
      "team member",
      "assignee",
      "executive",
      "owner",
      "assigned_to",
    ],
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    aliases: [
      "notes",
      "note",
      "remarks",
      "discussion",
      "comment",
      "comments",
      "description",
      "details",
    ],
  },
  {
    key: "nextFollowUpAt",
    label: "Next Follow-up Date",
    required: false,
    aliases: [
      "next follow-up date",
      "next follow-up",
      "next followup",
      "follow up date",
      "followup date",
      "next call",
      "followup",
      "follow up",
      "follow_up_date",
    ],
  },
  {
    key: "expectedStart",
    label: "Expected Start Date",
    required: false,
    aliases: [
      "expected start date",
      "expected start",
      "start date",
      "project start",
      "project start date",
      "expected date",
      "start_date",
    ],
  },
  {
    key: "futureReason",
    label: "Future Interest Reason",
    required: false,
    aliases: [
      "future interest reason",
      "future reason",
      "interest reason",
      "reason for future",
      "future notes",
      "future_reason",
    ],
  },
];

/**
 * Normalizes Indian mobile numbers into "+91 XXXXX XXXXX" standard.
 * Strips out punctuation, spaces, dashes, parentheses.
 * Detects whether the number is valid 10 digits starting with 6, 7, 8, or 9.
 */
export function normalizeIndianPhone(raw: any): {
  isValid: boolean;
  normalized: string;
  digits: string;
  error?: string;
} {
  if (raw === null || raw === undefined) {
    return {
      isValid: false,
      normalized: "",
      digits: "",
      error: "Phone number is required.",
    };
  }

  let str = String(raw).trim();
  if (!str) {
    return {
      isValid: false,
      normalized: "",
      digits: "",
      error: "Phone number cannot be empty.",
    };
  }

  // Extract all digits
  let digits = str.replace(/\D/g, "");

  // If 12 digits and starts with 91, remove prefix
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    // If 11 digits and starts with 0 (e.g. 09876543210), remove 0
    digits = digits.slice(1);
  }

  // Check 10-digit requirement
  if (digits.length !== 10) {
    return {
      isValid: false,
      normalized: str,
      digits,
      error: `Invalid phone number length (${digits.length} digits). Expected 10-digit Indian mobile number.`,
    };
  }

  // Check starting digit for valid Indian mobile operator allocation: 6, 7, 8, 9
  const firstDigit = digits.charAt(0);
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      isValid: false,
      normalized: str,
      digits,
      error: `Invalid Indian mobile number starting digit '${firstDigit}'. Must start with 6, 7, 8, or 9.`,
    };
  }

  const normalized = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return {
    isValid: true,
    normalized,
    digits,
  };
}

/**
 * Normalizes status string into valid ClientStatusType enum or defaults to NEW.
 */
export function normalizeStatus(raw: any): {
  isValid: boolean;
  status: ClientStatusType;
  error?: string;
} {
  if (!raw || String(raw).trim() === "") {
    return { isValid: true, status: "NEW" };
  }

  const clean = String(raw).trim().toUpperCase().replace(/[\s-_]+/g, "_");

  // Direct match
  const validStatusIds = CLIENT_STATUSES.map((s) => s.id);
  if (validStatusIds.includes(clean as ClientStatusType)) {
    return { isValid: true, status: clean as ClientStatusType };
  }

  // Common mapping variations
  const mapping: Record<string, ClientStatusType> = {
    NEW: "NEW",
    FRESH: "NEW",
    OPEN: "NEW",
    INTERESTED: "INTERESTED",
    HOT: "INTERESTED",
    WARM: "INTERESTED",
    FOLLOW_UP: "FOLLOW_UP",
    FOLLOWUP: "FOLLOW_UP",
    CALLBACK: "FOLLOW_UP",
    CALL_BACK: "FOLLOW_UP",
    FUTURE: "FUTURE",
    FUTURE_LEAD: "FUTURE",
    LATER: "FUTURE",
    THINKING: "THINKING",
    CONSIDERING: "THINKING",
    DECIDING: "THINKING",
    NOT_INTERESTED: "NOT_INTERESTED",
    NOTINTERESTED: "NOT_INTERESTED",
    DECLINED: "NOT_INTERESTED",
    REJECTED: "NOT_INTERESTED",
    NO_RESPONSE: "NO_RESPONSE",
    NORESPONSE: "NO_RESPONSE",
    UNREACHABLE: "NO_RESPONSE",
    BUSY: "NO_RESPONSE",
    CONVERTED: "CONVERTED",
    WON: "CONVERTED",
    CLOSED_WON: "CONVERTED",
    CLIENT: "CONVERTED",
    LOST: "LOST",
    CLOSED_LOST: "LOST",
    DROPPED: "LOST",
  };

  if (mapping[clean]) {
    return { isValid: true, status: mapping[clean] };
  }

  return {
    isValid: false,
    status: "NEW",
    error: `Invalid status "${raw}". Allowed values: New, Interested, Follow-up, Future, Thinking, Not Interested, No Response, Converted, Lost.`,
  };
}

/**
 * Parses dates from strings or Excel numeric serial codes.
 */
export function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;

  // Excel serial number
  if (typeof val === "number") {
    // Excel base date is Dec 30 1899
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const fractionalDay = val - Math.floor(val) + 0.0000001;
    const totalSeconds = Math.floor(86400 * fractionalDay);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const result = new Date(
      dateInfo.getFullYear(),
      dateInfo.getMonth(),
      dateInfo.getDate(),
      hours,
      minutes,
      seconds
    );
    return isNaN(result.getTime()) ? null : result;
  }

  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;

    // Check DD/MM/YYYY or DD-MM-YYYY format
    const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      const hour = dmy[4] ? parseInt(dmy[4], 10) : 0;
      const min = dmy[5] ? parseInt(dmy[5], 10) : 0;
      const sec = dmy[6] ? parseInt(dmy[6], 10) : 0;
      const parsed = new Date(year, month, day, hour, min, sec);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Try standard ISO or new Date(s)
    const direct = new Date(s);
    if (!isNaN(direct.getTime())) return direct;
  }

  return null;
}

/**
 * Validates email format if provided.
 */
export function validateEmail(email: any): { isValid: boolean; error?: string } {
  if (!email || String(email).trim() === "") return { isValid: true };
  const str = String(email).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    return {
      isValid: false,
      error: `Invalid email address format: "${str}".`,
    };
  }
  return { isValid: true };
}

/**
 * Automatically recognizes and maps spreadsheet header columns to supported fields.
 */
export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const cleanedHeaders = headers.map((h) => ({
    original: h,
    normalized: String(h || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, ""),
  }));

  for (const field of SUPPORTED_IMPORT_FIELDS) {
    let matchedHeader = "";

    // 1. Exact match on field.key
    const exactKey = cleanedHeaders.find(
      (h) => h.normalized === field.key.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (exactKey) {
      matchedHeader = exactKey.original;
    } else {
      // 2. Check aliases
      for (const alias of field.aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = cleanedHeaders.find((h) => h.normalized === cleanAlias);
        if (match) {
          matchedHeader = match.original;
          break;
        }
      }
    }

    if (matchedHeader) {
      mapping[field.key] = matchedHeader;
    }
  }

  return mapping;
}

/**
 * Parses raw Buffer (.xlsx or .csv) into headers and JSON rows using ExcelJS.
 */
export async function parseSpreadsheetBuffer(buffer: Buffer): Promise<{
  headers: string[];
  rawRows: Record<string, any>[];
  sheetName: string;
}> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch {
    // If not valid xlsx, attempt loading as CSV stream
    const stream = Readable.from(buffer);
    await workbook.csv.read(stream);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("The uploaded file does not contain any worksheets.");
  }

  const sheetName = worksheet.name || "Sheet1";
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  const headerColIndices: number[] = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const val = String(cell.value ?? "").trim();
    if (val) {
      headers.push(val);
      headerColIndices.push(colNumber);
    }
  });

  if (headers.length === 0) {
    return { headers: [], rawRows: [], sheetName };
  }

  const rawRows: Record<string, any>[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    const rowObj: Record<string, any> = {};
    let hasAnyValue = false;

    headerColIndices.forEach((colIdx, i) => {
      const headerName = headers[i];
      const cell = row.getCell(colIdx);
      let val = cell.value;

      // Extract text from rich text, formulas, hyperlinks, or dates
      if (val && typeof val === "object") {
        if (val instanceof Date) {
          // preserve Date instance
        } else if ("result" in val) {
          val = (val as any).result;
        } else if ("text" in val) {
          val = (val as any).text;
        } else if ("richText" in val && Array.isArray((val as any).richText)) {
          val = (val as any).richText.map((t: any) => t.text).join("");
        }
      }

      if (val !== null && val !== undefined && String(val).trim() !== "") {
        hasAnyValue = true;
      }
      rowObj[headerName] = val ?? "";
    });

    if (hasAnyValue) {
      rawRows.push(rowObj);
    }
  });

  return { headers, rawRows, sheetName };
}

export interface ValidatedImportRow {
  rowNumber: number; // 1-based index (data row 1 is row 2 in Excel)
  name: string;
  phone: string;
  companyName?: string;
  email?: string;
  location?: string;
  serviceName?: string;
  status: ClientStatusType;
  assignedToName?: string;
  notes?: string;
  nextFollowUpAt?: Date | null;
  expectedStart?: string;
  futureReason?: string;
  errors: string[];
  warnings: string[];
  isDuplicateInDb: boolean;
  isDuplicateInFile: boolean;
  existingClientId?: string;
  existingClientName?: string;
  existingAssignedToId?: string | null;
  existingAssignedToName?: string | null;
}

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: ValidatedImportRow[];
}

/**
 * Validates all spreadsheet rows against business rules, existing database clients, users, and services.
 */
export function validateImportRows(params: {
  rawRows: Record<string, any>[];
  columnMapping: Record<string, string>; // fieldKey -> ExcelHeader
  existingClients: Array<{
    id: string;
    name: string;
    phone: string;
    companyName: string | null;
    assignedToId: string | null;
    assignedTo?: { id: string; name: string } | null;
  }>;
  existingUsers: Array<{ id: string; name: string; email: string }>;
  existingServices: Array<{ id: string; name: string }>;
}): ValidationSummary {
  const { rawRows, columnMapping, existingClients, existingUsers } = params;

  // Build lookup index for existing DB clients by phone
  const dbPhoneMap = new Map<string, (typeof existingClients)[0]>();
  for (const client of existingClients) {
    const norm = normalizeIndianPhone(client.phone);
    if (norm.isValid) {
      dbPhoneMap.set(norm.normalized, client);
    } else {
      dbPhoneMap.set(client.phone, client);
    }
  }

  // Track phones encountered in current file to detect internal duplicates
  const seenFilePhones = new Map<string, number>(); // normalizedPhone -> first rowNumber

  const validatedRows: ValidatedImportRow[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const raw = rawRows[idx];
    const rowNumber = idx + 2; // Row 1 is header
    const errors: string[] = [];
    const warnings: string[] = [];

    // Helper to get mapped cell value
    const getVal = (key: string): any => {
      const headerName = columnMapping[key];
      if (!headerName || raw[headerName] === undefined) return "";
      return raw[headerName];
    };

    // 1. Client Name (required)
    const nameVal = String(getVal("name") || "").trim();
    if (!nameVal) {
      errors.push("Client Name is required.");
    }

    // 2. Phone Number (required & normalized)
    const phoneVal = getVal("phone");
    const phoneNorm = normalizeIndianPhone(phoneVal);
    let finalPhone = phoneNorm.normalized;

    if (!phoneNorm.isValid) {
      errors.push(phoneNorm.error || "Invalid phone number.");
      finalPhone = String(phoneVal || "").trim();
    }

    // 3. Company Name
    const companyVal = String(getVal("companyName") || "").trim();

    // 4. Email
    const emailVal = String(getVal("email") || "").trim();
    if (emailVal) {
      const emailCheck = validateEmail(emailVal);
      if (!emailCheck.isValid) {
        errors.push(emailCheck.error!);
      }
    }

    // 5. Location
    const locationVal = String(getVal("location") || "").trim();

    // 6. Service
    const serviceVal = String(getVal("service") || "").trim();

    // 7. Status
    const statusVal = getVal("status");
    const statusNorm = normalizeStatus(statusVal);
    if (!statusNorm.isValid) {
      errors.push(statusNorm.error!);
    }

    // 8. Assigned Team Member
    const assignedVal = String(getVal("assignedTo") || "").trim();
    if (assignedVal) {
      const matchedUser = existingUsers.find(
        (u) =>
          u.name.toLowerCase() === assignedVal.toLowerCase() ||
          u.email.toLowerCase() === assignedVal.toLowerCase()
      );
      if (!matchedUser) {
        warnings.push(
          `Assigned user "${assignedVal}" was not found in the team directory. Will remain unassigned or fall back to current user.`
        );
      }
    }

    // 9. Notes
    const notesVal = String(getVal("notes") || "").trim();

    // 10. Next Follow-up Date
    const followUpVal = getVal("nextFollowUpAt");
    let nextFollowUpDate: Date | null = null;
    if (followUpVal) {
      nextFollowUpDate = parseExcelDate(followUpVal);
      if (!nextFollowUpDate) {
        warnings.push(`Could not parse follow-up date "${followUpVal}". Date was ignored.`);
      }
    }

    // 11. Expected Start Date (for Future clients)
    const expectedStartVal = String(getVal("expectedStart") || "").trim();

    // 12. Future Interest Reason
    const futureReasonVal = String(getVal("futureReason") || "").trim();

    // If status is FUTURE and no reason given, add a helpful note/warning
    if (statusNorm.status === "FUTURE" && !futureReasonVal) {
      warnings.push("Status is FUTURE but Future Interest Reason is empty.");
    }

    // Duplicate detection
    let isDuplicateInFile = false;
    let isDuplicateInDb = false;
    let existingClientId: string | undefined;
    let existingClientName: string | undefined;
    let existingAssignedToId: string | null = null;
    let existingAssignedToName: string | null = null;

    if (phoneNorm.isValid && finalPhone) {
      // Check in-file duplicate
      if (seenFilePhones.has(finalPhone)) {
        isDuplicateInFile = true;
        const prevRow = seenFilePhones.get(finalPhone);
        warnings.push(
          `Duplicate phone number in this file (matches Row ${prevRow}).`
        );
      } else {
        seenFilePhones.set(finalPhone, rowNumber);
      }

      // Check DB duplicate
      const existingInDb = dbPhoneMap.get(finalPhone);
      if (existingInDb) {
        isDuplicateInDb = true;
        existingClientId = existingInDb.id;
        existingClientName = existingInDb.name;
        existingAssignedToId = existingInDb.assignedToId;
        existingAssignedToName = existingInDb.assignedTo?.name || null;
      }
    }

    validatedRows.push({
      rowNumber,
      name: nameVal,
      phone: finalPhone,
      companyName: companyVal || undefined,
      email: emailVal || undefined,
      location: locationVal || undefined,
      serviceName: serviceVal || undefined,
      status: statusNorm.status,
      assignedToName: assignedVal || undefined,
      notes: notesVal || undefined,
      nextFollowUpAt: nextFollowUpDate,
      expectedStart: expectedStartVal || undefined,
      futureReason: futureReasonVal || undefined,
      errors,
      warnings,
      isDuplicateInDb,
      isDuplicateInFile,
      existingClientId,
      existingClientName,
      existingAssignedToId,
      existingAssignedToName,
    });
  }

  const invalidCount = validatedRows.filter((r) => r.errors.length > 0).length;
  const duplicateCount = validatedRows.filter(
    (r) => r.errors.length === 0 && (r.isDuplicateInDb || r.isDuplicateInFile)
  ).length;
  const validCount = validatedRows.filter(
    (r) => r.errors.length === 0 && !r.isDuplicateInDb && !r.isDuplicateInFile
  ).length;

  return {
    totalRows: validatedRows.length,
    validCount,
    duplicateCount,
    invalidCount,
    rows: validatedRows,
  };
}

/**
 * Creates a clean, styled Excel Workbook (.xlsx) for client exports using ExcelJS.
 */
export async function generateClientsExportWorkbook(params: {
  clients: any[];
  includeCallHistory?: boolean;
  includeFutureDetails?: boolean;
  includeFollowUps?: boolean;
}): Promise<Buffer> {
  const {
    clients,
    includeCallHistory = true,
    includeFutureDetails = true,
    includeFollowUps = true,
  } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RaamBow Client Management";
  workbook.created = new Date();

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF013687" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  // 1. Clients Sheet
  const clientsSheet = workbook.addWorksheet("Clients");
  clientsSheet.columns = [
    { header: "Client Name", key: "name", width: 22 },
    { header: "Phone Number", key: "phone", width: 18 },
    { header: "Company Name", key: "companyName", width: 24 },
    { header: "Email", key: "email", width: 26 },
    { header: "Location", key: "location", width: 16 },
    { header: "Service", key: "service", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Assigned To", key: "assignedTo", width: 18 },
    { header: "Last Contact", key: "lastContact", width: 14 },
    { header: "Next Follow-up", key: "nextFollowUp", width: 16 },
    { header: "Expected Start Date", key: "expectedStart", width: 18 },
    { header: "Future Interest Reason", key: "futureReason", width: 28 },
    { header: "Notes", key: "notes", width: 30 },
    { header: "Created Date", key: "createdDate", width: 14 },
  ];
  clientsSheet.getRow(1).font = headerFont;
  clientsSheet.getRow(1).fill = headerFill;

  for (const c of clients) {
    clientsSheet.addRow({
      name: c.name || "",
      phone: c.phone || "",
      companyName: c.companyName || "",
      email: c.email || "",
      location: c.location || "",
      service: c.service?.name || "",
      status: c.status || "",
      assignedTo: c.assignedTo?.name || "Unassigned",
      lastContact: c.lastContactAt
        ? new Date(c.lastContactAt).toLocaleDateString("en-IN")
        : "—",
      nextFollowUp: c.nextFollowUpAt
        ? new Date(c.nextFollowUpAt).toLocaleDateString("en-IN")
        : "—",
      expectedStart: c.expectedStart || "—",
      futureReason: c.futureReason || "—",
      notes: c.notes || "",
      createdDate: c.createdAt
        ? new Date(c.createdAt).toLocaleDateString("en-IN")
        : "",
    });
  }

  // 2. Call History Sheet
  if (includeCallHistory) {
    const callSheet = workbook.addWorksheet("Call History");
    callSheet.columns = [
      { header: "Client Name", key: "clientName", width: 22 },
      { header: "Phone Number", key: "phone", width: 18 },
      { header: "Call Result", key: "callResult", width: 18 },
      { header: "Previous Status", key: "previousStatus", width: 16 },
      { header: "New Status", key: "newStatus", width: 16 },
      { header: "Updated By", key: "updatedBy", width: 18 },
      { header: "Date & Time", key: "dateTime", width: 20 },
      { header: "Next Follow-up Set", key: "nextFollowUpSet", width: 18 },
      { header: "Discussion Notes", key: "notes", width: 35 },
    ];
    callSheet.getRow(1).font = headerFont;
    callSheet.getRow(1).fill = headerFill;

    let rowCount = 0;
    for (const c of clients) {
      if (c.callHistories && c.callHistories.length > 0) {
        for (const ch of c.callHistories) {
          rowCount++;
          callSheet.addRow({
            clientName: c.name,
            phone: c.phone,
            callResult: ch.callResult || "",
            previousStatus: ch.previousStatus || "—",
            newStatus: ch.newStatus || ch.statusAtTime || "—",
            updatedBy: ch.user?.name || "Team Member",
            dateTime: ch.calledAt
              ? new Date(ch.calledAt).toLocaleString("en-IN")
              : "",
            nextFollowUpSet: ch.nextFollowUpAt
              ? new Date(ch.nextFollowUpAt).toLocaleDateString("en-IN")
              : "—",
            notes: ch.notes || "",
          });
        }
      }
    }
    if (rowCount === 0) {
      callSheet.addRow({
        clientName: "No records",
        phone: "",
        callResult: "",
        previousStatus: "",
        newStatus: "",
        updatedBy: "",
        dateTime: "",
        nextFollowUpSet: "",
        notes: "",
      });
    }
  }

  // 3. Future Clients Sheet
  if (includeFutureDetails) {
    const futureSheet = workbook.addWorksheet("Future Clients");
    futureSheet.columns = [
      { header: "Client Name", key: "clientName", width: 22 },
      { header: "Phone Number", key: "phone", width: 18 },
      { header: "Company", key: "company", width: 22 },
      { header: "Expected Project Start", key: "expectedStart", width: 22 },
      { header: "Next Follow-up Date", key: "nextFollowUpDate", width: 20 },
      { header: "Future Interest Reason", key: "futureReason", width: 35 },
      { header: "Assigned To", key: "assignedTo", width: 18 },
      { header: "Service", key: "service", width: 18 },
    ];
    futureSheet.getRow(1).font = headerFont;
    futureSheet.getRow(1).fill = headerFill;

    const futureClients = clients.filter((c) => c.status === "FUTURE");
    if (futureClients.length > 0) {
      for (const c of futureClients) {
        futureSheet.addRow({
          clientName: c.name,
          phone: c.phone,
          company: c.companyName || "",
          expectedStart: c.expectedStart || "Not specified",
          nextFollowUpDate: c.nextFollowUpAt
            ? new Date(c.nextFollowUpAt).toLocaleDateString("en-IN")
            : "Not set",
          futureReason: c.futureReason || "Not specified",
          assignedTo: c.assignedTo?.name || "Unassigned",
          service: c.service?.name || "General",
        });
      }
    } else {
      futureSheet.addRow({
        clientName: "No future clients",
        phone: "",
        company: "",
        expectedStart: "",
        nextFollowUpDate: "",
        futureReason: "",
        assignedTo: "",
        service: "",
      });
    }
  }

  // 4. Follow-up Records Sheet
  if (includeFollowUps) {
    const followUpSheet = workbook.addWorksheet("Follow-ups");
    followUpSheet.columns = [
      { header: "Client Name", key: "clientName", width: 22 },
      { header: "Phone Number", key: "phone", width: 18 },
      { header: "Assigned Member", key: "assignedMember", width: 18 },
      { header: "Scheduled Date", key: "scheduledDate", width: 20 },
      { header: "Status", key: "status", width: 14 },
      { header: "Completed Date", key: "completedDate", width: 20 },
      { header: "Notes", key: "notes", width: 30 },
    ];
    followUpSheet.getRow(1).font = headerFont;
    followUpSheet.getRow(1).fill = headerFill;

    let followUpCount = 0;
    for (const c of clients) {
      if (c.followUps && c.followUps.length > 0) {
        for (const fu of c.followUps) {
          followUpCount++;
          followUpSheet.addRow({
            clientName: c.name,
            phone: c.phone,
            assignedMember: fu.user?.name || "—",
            scheduledDate: fu.scheduledAt
              ? new Date(fu.scheduledAt).toLocaleString("en-IN")
              : "",
            status: fu.completed ? "Completed" : "Pending",
            completedDate: fu.completedAt
              ? new Date(fu.completedAt).toLocaleString("en-IN")
              : "—",
            notes: fu.notes || "",
          });
        }
      }
    }
    if (followUpCount === 0) {
      followUpSheet.addRow({
        clientName: "No follow-up records",
        phone: "",
        assignedMember: "",
        scheduledDate: "",
        status: "",
        completedDate: "",
        notes: "",
      });
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates an Excel file containing only failed rows with error descriptions using ExcelJS.
 */
export async function generateFailedRowsWorkbook(
  failedRows: Array<{
    rowNumber: number;
    name: string;
    phone: string;
    companyName?: string;
    email?: string;
    status: string;
    errors: string[];
    warnings: string[];
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RaamBow Client Management";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Failed Rows");
  sheet.columns = [
    { header: "Row Number", key: "rowNumber", width: 12 },
    { header: "Client Name", key: "name", width: 22 },
    { header: "Phone Number", key: "phone", width: 18 },
    { header: "Company Name", key: "companyName", width: 22 },
    { header: "Email", key: "email", width: 24 },
    { header: "Status", key: "status", width: 14 },
    { header: "Error Reason(s)", key: "errors", width: 45 },
    { header: "Warnings", key: "warnings", width: 35 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF013687" },
  };

  for (const r of failedRows) {
    sheet.addRow({
      rowNumber: r.rowNumber,
      name: r.name,
      phone: r.phone,
      companyName: r.companyName || "",
      email: r.email || "",
      status: r.status || "",
      errors: r.errors.join("; "),
      warnings: r.warnings.join("; "),
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

