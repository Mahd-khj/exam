import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middleware/roleGuard";
import { logout } from "@/backend/modules/shared/authService";

// POST - Logout user (invalidate session token)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 400 }
      );
    }

    const result = await logout(token);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Logged out successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to logout" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
