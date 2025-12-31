import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/middleware/roleGuard";
import { parseCSV, parseExcel, uploadCSV } from "@/backend/modules/admin/csvService";

// Upload exams from CSV or Excel file
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';

    // Validate file type
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type. Please upload a CSV, XLSX, or XLS file.` },
        { status: 400 }
      );
    }

    let csvData;
    try {
      if (fileExtension === 'csv') {
        // Read CSV as text
        const text = await file.text();
        csvData = parseCSV(text);
      } else {
        // Read Excel file as buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        csvData = parseExcel(buffer);
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `File parsing error: ${error.message}` },
        { status: 400 }
      );
    }

    if (csvData.length === 0) {
      return NextResponse.json(
        { success: false, error: "File is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Upload exams
    const result = await uploadCSV(csvData);

    return NextResponse.json({
      success: true,
      message: `Upload completed: ${result.success} succeeded, ${result.failed} failed`,
      result,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
