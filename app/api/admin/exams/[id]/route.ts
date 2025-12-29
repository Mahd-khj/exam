import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/middleware/roleGuard";
import {
  getExamById,
  updateExam,
  deleteExam,
} from "@/backend/modules/admin/examService";

// GET - Get single exam by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;
    const examId = parseInt(id);

    if (isNaN(examId)) {
      return NextResponse.json(
        { success: false, error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    const exam = await getExamById(examId);

    return NextResponse.json({ success: true, exam });
  } catch (error: any) {
    console.error("Get exam error:", error);
    if (error.message === "Exam not found") {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

// PUT - Update exam entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;
    const examId = parseInt(id);

    if (isNaN(examId)) {
      return NextResponse.json(
        { success: false, error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateExam(examId, body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Exam updated successfully",
        exam: result.exam,
      });
    } else {
      // Clash detected
      return NextResponse.json(
        {
          success: false,
          message: "Clash detected. Cannot update exam.",
          clashes: result.clashes,
        },
        { status: 409 }
      );
    }
  } catch (error: any) {
    console.error("Update exam error:", error);
    if (error.message === "Exam not found") {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update exam" },
      { status: 500 }
    );
  }
}

// DELETE - Delete exam entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;
    const examId = parseInt(id);

    if (isNaN(examId)) {
      return NextResponse.json(
        { success: false, error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    await deleteExam(examId);

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete exam error:", error);
    if (error.message === "Exam not found") {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete exam" },
      { status: 500 }
    );
  }
}
