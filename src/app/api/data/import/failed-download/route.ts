import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateFailedRowsWorkbook } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { failedRecords = [] } = body;

    if (!Array.isArray(failedRecords) || failedRecords.length === 0) {
      return NextResponse.json(
        { error: "No failed records to download." },
        { status: 400 }
      );
    }

    const buffer = await generateFailedRowsWorkbook(failedRecords);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="RaamBow_Failed_Import_Rows.xlsx"',
      },
    });
  } catch (err: any) {
    console.error("Failed download error:", err);
    return NextResponse.json(
      { error: "Failed to generate error file." },
      { status: 500 }
    );
  }
}
