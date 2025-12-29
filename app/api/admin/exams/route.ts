import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/middleware/roleGuard";
import {
  createExam,
  getAllExams,
  deleteAllExams,
} from "@/backend/modules/admin/examService";

// GET - List all exams (with optional filters)
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
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

// POST - Create new exam
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const result = await createExam(body);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Exam created successfully",
          exam: result.exam,
        },
        { status: 201 }
      );
    } else {
      // Clash detected
      return NextResponse.json(
        {
          success: false,
          message: "Clash detected. Cannot create exam.",
          clashes: result.clashes,
        },
        { status: 409 }
      );
    }
  } catch (error: any) {
    console.error("Create exam error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create exam" },
      { status: 500 }
    );
  }
}

// DELETE - Delete all exams
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const result = await deleteAllExams();

    return NextResponse.json({
      success: true,
      message: `All exams deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Delete all exams error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete all exams" },
      { status: 500 }
    );
  }
}
