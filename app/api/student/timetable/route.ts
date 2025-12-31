import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/backend/middleware/roleGuard";
import { getStudentTimetable } from "@/backend/modules/student/timetableService";

// Get personalized exam timetable for student
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStudent(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const courseCodesParam = searchParams.get("courseCodes");

    if (!courseCodesParam) {
      return NextResponse.json(
        { success: false, error: "courseCodes parameter is required" },
        { status: 400 }
      );
    }

    // Parse course codes (can be comma-separated or JSON array)
    let courseCodes: string[];
    try {
      // Try parsing as JSON array first
      courseCodes = JSON.parse(courseCodesParam);
    } catch {
      // If not JSON, split by comma
      courseCodes = courseCodesParam.split(",").map((code) => code.trim());
    }

    if (!Array.isArray(courseCodes) || courseCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "courseCodes must be a non-empty array" },
        { status: 400 }
      );
    }

    const timetable = await getStudentTimetable(courseCodes);

    return NextResponse.json({
      success: true,
      timetable,
      courseCodes,
    });
  } catch (error: any) {
    console.error("Get timetable error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
