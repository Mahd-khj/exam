import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/backend/middleware/roleGuard";
import ClassCode from "@/backend/models/ClassCode";
import { initializeDatabase } from "@/backend/db-init";

// Get all class codes
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    await initializeDatabase();
    const classCodes = await ClassCode.findAll({
      attributes: ["id", "code"],
      order: [["code", "ASC"]],
    });

    return NextResponse.json({
      success: true,
      classCodes: classCodes.map((cc) => ({
        id: cc.id,
        code: cc.code,
      })),
    });
  } catch (error: any) {
    console.error("Get class codes error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch class codes" },
      { status: 500 }
    );
  }
}









