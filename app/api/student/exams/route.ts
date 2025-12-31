import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/backend/middleware/roleGuard";
import { getAllExams } from "@/backend/modules/admin/examService";

// List all exams (read-only access for students)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStudent(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const date = searchParams.get("date") || undefined;
    const roomId = searchParams.get("roomId")
      ? parseInt(searchParams.get("roomId")!)
      : undefined;

    const exams = await getAllExams({ search, date, roomId });

    return NextResponse.json({ success: true, exams });
  } catch (error: any) {
    console.error("Get exams error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

