import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RaamBow Client Management";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Clients Template");

    sheet.columns = [
      { header: "Client Name", key: "name", width: 22 },
      { header: "Phone Number", key: "phone", width: 18 },
      { header: "Company Name", key: "companyName", width: 25 },
      { header: "Email", key: "email", width: 28 },
      { header: "Location", key: "location", width: 22 },
      { header: "Service", key: "service", width: 24 },
      { header: "Status", key: "status", width: 16 },
      { header: "Assigned Team Member", key: "assignedTo", width: 24 },
      { header: "Notes", key: "notes", width: 35 },
      { header: "Next Follow-up Date", key: "nextFollowUpDate", width: 20 },
      { header: "Expected Start Date", key: "expectedStart", width: 22 },
      { header: "Future Interest Reason", key: "futureReason", width: 35 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF013687" },
    };

    const sampleRows = [
      {
        name: "Aarav Sharma",
        phone: "+91 98765 01001",
        companyName: "Apex Infotech Pvt Ltd",
        email: "aarav.sharma@apexinfotech.in",
        location: "Bengaluru, Karnataka",
        service: "Web Development",
        status: "Interested",
        assignedTo: "Rajesh Kumar",
        notes: "Discussed corporate website redesign. Follow-up next Monday.",
        nextFollowUpDate: "2026-11-15",
        expectedStart: "",
        futureReason: "",
      },
      {
        name: "Pooja Reddy",
        phone: "9876501002",
        companyName: "Reddy Logistics",
        email: "pooja@reddylogistics.com",
        location: "Hyderabad, Telangana",
        service: "Mobile App Development",
        status: "Future",
        assignedTo: "Anita Roy",
        notes: "Client expanding fleet in Q1 next year. Wants Flutter logistics app.",
        nextFollowUpDate: "2026-12-10",
        expectedStart: "January 2027",
        futureReason: "Awaiting next fiscal year budget allocation.",
      },
      {
        name: "Vikram Malhotra",
        phone: "09876501003",
        companyName: "Malhotra Textiles",
        email: "vikram@malhotratextiles.co.in",
        location: "Mumbai, Maharashtra",
        service: "Cloud Solutions",
        status: "Follow-up",
        assignedTo: "Suresh Nair",
        notes: "Needs proposal presentation for cloud server migration.",
        nextFollowUpDate: "2026-11-10",
        expectedStart: "",
        futureReason: "",
      },
    ];

    sampleRows.forEach((r) => sheet.addRow(r));

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="RaamBow_Client_Import_Template.xlsx"',
      },
    });
  } catch (err: any) {
    console.error("Template download error:", err);
    return NextResponse.json(
      { error: "Failed to generate template." },
      { status: 500 }
    );
  }
}
