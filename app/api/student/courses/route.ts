import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/backend/middleware/roleGuard";
import { getAllCourseCodes } from "@/backend/modules/student/timetableService";

// Get all available course codes
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStudent(request);
    if (authResult.error) {
      return authResult.error;
    }

    const courses = await getAllCourseCodes();

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error: any) {
    console.error("Get courses error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
