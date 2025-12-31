import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/middleware/roleGuard";
import {
  createExam,
  getAllExams,
  deleteAllExams,
  updateExam,
} from "@/backend/modules/admin/examService";

// GET - List all exams (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

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

//Create new exam
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

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
      //Return the detailed conflict message from examService
      return NextResponse.json(
        {
          success: false,
          message:
            result.message ||
            "Clash detected. Please review the conflicts below.",
          clashes: result.clashes || [],
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

// Update existing exam
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required for update" },
        { status: 400 }
      );
    }

    const result = await updateExam(id, updateData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Exam updated successfully",
        exam: result.exam,
      });
    } else {
      // Return detailed message from examService
      return NextResponse.json(
        {
          success: false,
          message:
            result.message ||
            "Clash detected. Please review the conflicts below.",
          clashes: result.clashes || [],
        },
        { status: 409 }
      );
    }
  } catch (error: any) {
    console.error("Update exam error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update exam" },
      { status: 500 }
    );
  }
}

// Delete all exams
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) return authResult.error;

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
